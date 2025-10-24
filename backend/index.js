import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import SunCalc from "suncalc";

const { ORS_API_KEY, WEATHER_API_KEY, PORT } = process.env;

const app = express();
app.use(cors());
app.use(express.json());

// Utility: convert bearings between points
function calculateBearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Get real route + distance via ORS
async function getRoutePoints(origin, destination) {
  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${origin.lon},${origin.lat}&end=${destination.lon},${destination.lat}&geometry_format=geojson`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!resp.ok || !data?.features) {
      console.error("ORS error:", data);
      return {
        coords: [
          { lat: origin.lat, lon: origin.lon },
          { lat: destination.lat, lon: destination.lon },
        ],
        distance: 0,
      };
    }

    const coords = data.features[0].geometry.coordinates.map(([lon, lat]) => ({
      lat,
      lon,
    }));
    const distance = data.features[0].properties.summary.distance; // meters
    return { coords, distance };
  } catch (err) {
    console.error("Failed to fetch ORS route:", err);
    return {
      coords: [
        { lat: origin.lat, lon: origin.lon },
        { lat: destination.lat, lon: destination.lon },
      ],
      distance: 0,
    };
  }
}

// Get weather info
async function getWeather(lat, lon) {
  if (!WEATHER_API_KEY) return null;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    return {
      cloudCover: data.clouds?.all ?? null,
      description: data.weather?.[0]?.description || "",
    };
  } catch {
    return null;
  }
}

// Determine sun side
function getSunSide(sunAz, heading) {
  const diff = (sunAz - heading + 360) % 360;
  return diff <= 180 ? "right" : "left";
}

// Main API route
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
      .json({ error: "origin and destination with lat/lon are required" });
  }

  let depTime;
  try {
    depTime = datetime ? new Date(datetime) : new Date();
    if (isNaN(depTime)) throw new Error("Invalid date");
  } catch {
    return res.status(400).json({ error: "Invalid datetime provided" });
  }

  const now = new Date();
  const isPastTrip = depTime < now;

  try {
    const { coords, distance } = await getRoutePoints(origin, destination);
    const segments = [];
    for (let i = 0; i < coords.length - 1; i++) {
      segments.push({ start: coords[i], end: coords[i + 1] });
    }

    const weather = await getWeather(origin.lat, origin.lon);
    const cloudCover = weather?.cloudCover ?? null;
    const weatherDesc = weather?.description ?? "";

    // Get sunrise/sunset at origin
    const times = SunCalc.getTimes(depTime, origin.lat, origin.lon);
    const sunrise = times.sunrise;
    const sunset = times.sunset;

    // Estimate total duration (based on 80 km/h avg)
    const avgSpeed = 80 * 1000 / 3600;
    const totalDurationMs = distance ? (distance / avgSpeed) * 1000 : 0;
    const durationHrs = totalDurationMs / (1000 * 60 * 60);
    const durationStr =
      durationHrs >= 1
        ? `${Math.floor(durationHrs)}h ${Math.round((durationHrs % 1) * 60)}m`
        : `${Math.round(durationHrs * 60)}m`;

    const chartData = [];
    let leftCount = 0;
    let sunSegments = 0;
    let sumAz = 0;
    let sumHeading = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const heading = calculateBearing(seg.start, seg.end);
      sumHeading += heading;

      // simulate realistic time across journey
      const segTime = new Date(
        depTime.getTime() + (i / segments.length) * totalDurationMs
      );
      const sunPos = SunCalc.getPosition(
        segTime,
        seg.start.lat,
        seg.start.lon
      );
      const sunAz = ((sunPos.azimuth * 180) / Math.PI + 180) % 360;
      const sunAlt = sunPos.altitude; // radians

      // skip dark segments
      if (segTime < sunrise || segTime > sunset || sunAlt <= 0) {
        chartData.push({
          index: i,
          heading,
          sunAzimuth: sunAz,
          sunSide: "none",
          intensity: 0,
          timestamp: segTime.toISOString(),
        });
        continue;
      }

      const sunSide = getSunSide(sunAz, heading);
      if (sunSide === "left") leftCount++;
      sunSegments++;

      let intensity = Math.sin(sunAlt);
      if (cloudCover != null) intensity *= 1 - cloudCover / 100;

      sumAz += sunAz;
      chartData.push({
        index: i,
        heading,
        sunAzimuth: sunAz,
        sunSide,
        intensity,
        timestamp: segTime.toISOString(),
      });
    }

    // if all segments dark, short-circuit
    if (sunSegments === 0) {
      return res.json({
        shade_side: null,
        sun_side: null,
        message: "No sunlight during this trip — it's entirely night time 🌙",
        sunrise,
        sunset,
        estimatedDuration: durationStr,
        isPastTrip,
        tripNote: isPastTrip
          ? "Looks like you're reminiscing the past — we hope you picked the coziest seat that night 🌌"
          : "",
        chartData,
        coordinates: coords,
      });
    }

    const majoritySunSide = leftCount > sunSegments / 2 ? "left" : "right";
    const shadeSide = majoritySunSide === "left" ? "right" : "left";
    const confidence =
      Math.abs(leftCount / sunSegments - 0.5) * 2 || 0;
    const avgHeading = sumHeading / sunSegments || 0;
    const avgAz = sumAz / sunSegments || 0;

    let reason = `Average heading ${avgHeading.toFixed(
      1
    )}° vs sun azimuth ${avgAz.toFixed(1)}°. The sun shines on your ${majoritySunSide} for ${leftCount} of ${sunSegments} sunlit segments.`;

    const tripNote = isPastTrip
      ? "Looks like you're reminiscing the past, hope you picked the shadier side back then ☀️. Regards, Aditya."
      : "";

    return res.json({
      shade_side: shadeSide,
      sun_side: majoritySunSide,
      confidence,
      sunrise,
      sunset,
      coordinates: coords,
      chartData,
      reason,
      weather: weatherDesc ? { cloudCover, description: weatherDesc } : null,
      estimatedDuration: durationStr,
      isPastTrip,
      tripNote,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const port = PORT || 4000;
app.listen(port, () => console.log(`Shade API running on port ${port}`));
