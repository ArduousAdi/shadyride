import dotenv from "dotenv";
dotenv.config();

console.log("DEBUG ORS key loaded:", !!process.env.ORS_API_KEY);

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import SunCalc from "suncalc";

const { ORS_API_KEY, WEATHER_API_KEY, PORT } = process.env;

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------------------------------------------------------------- */
/*                               Helper functions                             */
/* -------------------------------------------------------------------------- */

// Bearing between two geographic points
function calculateBearing(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let brng = Math.atan2(y, x);
  brng = (toDeg(brng) + 360) % 360;
  return brng;
}

// Fetch real route geometry from ORS Directions API
async function getRoutePoints(origin, destination) {
  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${origin.lon},${origin.lat}&end=${destination.lon},${destination.lat}&geometry_format=geojson`;

    const resp = await fetch(url);
    const data = await resp.json();

    if (!resp.ok || !data?.features?.[0]?.geometry?.coordinates) {
      console.error("❌ ORS error:", data);
      throw new Error("ORS request failed");
    }

    const coords = data.features[0].geometry.coordinates.map(([lon, lat]) => ({
      lat,
      lon,
    }));

    console.log(`✅ ORS returned ${coords.length} coordinates`);
    return coords;
  } catch (err) {
    console.error("⚠️ Failed to fetch ORS route:", err.message);
    // fallback: straight line
    return [
      { lat: origin.lat, lon: origin.lon },
      { lat: destination.lat, lon: destination.lon },
    ];
  }
}

// Resample short routes for smoother charts
function resampleRoute(coordinates) {
  if (coordinates.length > 2 && coordinates.length < 20) {
    const resampled = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const a = coordinates[i];
      const b = coordinates[i + 1];
      for (let j = 0; j < 10; j++) {
        const t = j / 10;
        resampled.push({
          lat: a.lat + (b.lat - a.lat) * t,
          lon: a.lon + (b.lon - a.lon) * t,
        });
      }
    }
    return resampled;
  }
  return coordinates;
}

// Determine which side of the bus/car the sun is on
function getSunSide(sunAzimuth, heading) {
  const diff = (sunAzimuth - heading + 360) % 360;
  return diff <= 180 ? "right" : "left";
}

// Fetch current weather data from OpenWeatherMap
async function getWeather(lat, lon) {
  if (!WEATHER_API_KEY) return null;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    const cloudCover = data.clouds?.all;
    const description = data.weather?.[0]?.description || "";
    return {
      cloudCover: typeof cloudCover === "number" ? cloudCover : null,
      description,
    };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                API Endpoint                                */
/* -------------------------------------------------------------------------- */

app.post("/api/shade", async (req, res) => {
  const { origin, destination, datetime } = req.body || {};

  if (
    !origin ||
    !destination ||
    origin.lat == null ||
    origin.lon == null ||
    destination.lat == null ||
    destination.lon == null
  ) {
    return res
      .status(400)
      .json({ error: "origin and destination with lat/lon required" });
  }

  // Parse departure time
  let depTime = new Date();
  if (datetime) {
    const parsed = new Date(datetime);
    if (!isNaN(parsed)) depTime = parsed;
  }

  try {
    // 1️⃣ Fetch ORS route
    let coordinates = await getRoutePoints(origin, destination);
    coordinates = resampleRoute(coordinates);
    console.log("Debug → coordinates length:", coordinates.length);

    // If only two points, still fallback
    if (coordinates.length <= 2) {
      console.warn("⚠️ Using fallback straight route (ORS failed).");
    }

    // 2️⃣ Compute daylight info
    const times = SunCalc.getTimes(depTime, origin.lat, origin.lon);
    const sunrise = times.sunrise;
    const sunset = times.sunset;
    if (!sunrise || !sunset || depTime < sunrise || depTime > sunset) {
      return res.json({
        shade_side: null,
        sun_side: null,
        message: "No sunlight at the specified time",
        sunrise,
        sunset,
        coordinates,
        chartData: [],
      });
    }

    // 3️⃣ Weather / cloud cover
    const weather = await getWeather(origin.lat, origin.lon);
    const cloudCover = weather?.cloudCover ?? null;
    const weatherDesc = weather?.description ?? "";

    // 4️⃣ Segment computations
    const segments = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      segments.push({ start: coordinates[i], end: coordinates[i + 1] });
    }

    const chartData = [];
    let leftCount = 0;
    let sumAz = 0;
    let sumHeading = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const heading = calculateBearing(seg.start, seg.end);
      sumHeading += heading;

      const segTime = new Date(
        depTime.getTime() + (i / Math.max(segments.length - 1, 1)) * 3600 * 1000
      );
      const sunPos = SunCalc.getPosition(segTime, seg.start.lat, seg.start.lon);
      const sunAzimuth = (sunPos.azimuth * 180) / Math.PI + 180;
      const altitude = sunPos.altitude;

      let intensity = Math.max(0, Math.sin(altitude));
      if (cloudCover != null) intensity *= 1 - cloudCover / 100;

      const sunSide = getSunSide(sunAzimuth % 360, heading);
      if (sunSide === "left") leftCount++;

      sumAz += sunAzimuth;

      chartData.push({
        index: i,
        heading,
        sunAzimuth,
        sunSide,
        intensity,
        timestamp: segTime.toISOString(),
      });
    }

    const majoritySunSide = leftCount > segments.length / 2 ? "left" : "right";
    const shadeSide = majoritySunSide === "left" ? "right" : "left";
    const confidence =
      segments.length > 0
        ? Math.abs(leftCount / segments.length - 0.5) * 2
        : 0;

    const avgHeading = segments.length ? sumHeading / segments.length : null;
    const avgAz = segments.length ? sumAz / segments.length : null;
    let reason = "";
    if (avgHeading != null && avgAz != null) {
      reason = `Average route heading ${avgHeading.toFixed(
        1
      )}° and average sun azimuth ${avgAz.toFixed(
        1
      )}°. The sun spends ${
        majoritySunSide === "left" ? leftCount : segments.length - leftCount
      } of ${segments.length} segments on your ${majoritySunSide} side.`;
    }

    // 5️⃣ Response
    res.json({
      shade_side: shadeSide,
      sun_side: majoritySunSide,
      sunrise,
      sunset,
      coordinates,
      chartData,
      confidence,
      reason,
      weather: weatherDesc
        ? { cloudCover, description: weatherDesc }
        : null,
    });
  } catch (err) {
    console.error("Internal Server Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* -------------------------------------------------------------------------- */
/*                                 Start server                               */
/* -------------------------------------------------------------------------- */

const port = PORT || 4000;
app.listen(port, () => {
  console.log(`Shade API listening on port ${port}`);
});
