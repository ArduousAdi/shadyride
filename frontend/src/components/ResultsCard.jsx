import { motion } from "framer-motion";
import { Sun, CloudSun, Info, Moon, Compass } from "lucide-react";
import { buildNarrative } from "../utils/TripNarrative";

const ResultCard = ({ result, origin, destination }) => {
  if (!result) return null;

  const {
    shade_side,
    sun_side,
    sunrise,
    sunset,
    confidence,
    weather,
    reason,
  } = result;

  // parse angles for readable direction
  const headingMatch = reason?.match(/heading\s([\d.]+)/);
  const azimuthMatch = reason?.match(/azimuth\s([\d.]+)/);
  const avgHeading = headingMatch ? parseFloat(headingMatch[1]) : 0;
  const avgAzimuth = azimuthMatch ? parseFloat(azimuthMatch[1]) : 0;

  const narrative = buildNarrative({
    origin,
    destination,
    confidence,
    weather,
    avgHeading,
    avgAzimuth,
    shade_side,
    sun_side,
  });

  const confPercent = Math.round(confidence * 100);

  // convert numeric heading → direction label
  const directions = [
    "north",
    "north-east",
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
  ];
  const headingDir = directions[Math.round(((avgHeading % 360) / 45)) % 8];
  const azimuthDir = directions[Math.round(((avgAzimuth % 360) / 45)) % 8];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-800 dark:text-gray-100 backdrop-blur-md p-6 rounded-2xl shadow-md w-full max-w-3xl mx-auto mt-6 border border-gray-200 dark:border-gray-700"
    >
      <h2 className="text-2xl font-semibold mb-2 flex items-center justify-center">
        <Sun className="text-yellow-500 mr-2" />
        {shade_side
          ? `Sit on the ${shade_side.charAt(0).toUpperCase() + shade_side.slice(1)} side`
          : "No Sunlight Right Now"}
      </h2>

      <p className="text-center text-gray-600 dark:text-gray-300 mb-3">
        {sun_side
          ? `🌞 The sun will mostly be on your ${sun_side} side during this trip.`
          : "🌙 It's dark outside, so no sunlight data."}
      </p>

      <div className="mt-2 text-center space-y-2 text-sm">
        {weather && (
          <p className="text-gray-700 dark:text-gray-300">
            <CloudSun className="inline-block w-4 h-4 mr-1 text-yellow-500" />
            <span className="font-medium">Weather:</span>{" "}
            {weather.description} ({weather.cloudCover ?? 0}% clouds)
          </p>
        )}
        <p className="text-gray-700 dark:text-gray-300">
          <Compass className="inline-block w-4 h-4 mr-1 text-blue-500" />
          <span className="font-medium">Confidence:</span> {confPercent}%
          <span
            title="Confidence means how sure the app is that the sun will stay on this side for most of your route, based on sun position consistency."
            className="ml-1 cursor-help text-gray-400"
          >
            <Info className="inline w-3 h-3" />
          </span>
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Sunrise:{" "}
          {new Date(sunrise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Sunset:{" "}
          {new Date(sunset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="mt-5 bg-yellow-50 dark:bg-gray-700/40 rounded-xl p-4 text-gray-800 dark:text-gray-200 leading-relaxed text-[15px] italic">
        {narrative}
      </div>

      <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        On average, you’ll be heading <strong>{headingDir}</strong>, and the sun will stay{" "}
        <strong>{azimuthDir}</strong> of you during the trip.
      </div>

      <p className="text-center text-gray-400 text-xs mt-3 italic">
        This app estimates sunlight direction using live weather, solar position, and your exact road path.
      </p>
    </motion.div>
  );
};

export default ResultCard;
