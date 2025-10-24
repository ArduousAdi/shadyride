import React from "react";
import { Sun, Info, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { buildNarrative } from "../utils/TripNarrative";

/**
 * Tooltip component (minimal, Tailwind-only)
 */
const Tooltip = ({ text, children }) => (
  <div className="relative group cursor-pointer inline-flex items-center">
    {children}
    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 shadow-lg">
      {text}
    </div>
  </div>
);

/**
 * Displays computed results for the shade side, confidence, weather and trip summary.
 */
const ResultsCard = ({ result }) => {
  if (!result) return null;

  const {
    shade_side,
    sun_side,
    confidence,
    sunrise,
    sunset,
    weather,
    reason,
    isPastTrip,
    tripNote,
    estimatedDuration,
    message,
  } = result;

  const narrative = buildNarrative({
    origin: result.origin,
    destination: result.destination,
    confidence,
    weather,
    avgHeading: result.avgHeading,
    avgAzimuth: result.avgAzimuth,
    shade_side,
    sun_side,
  });

  const sunriseTime = sunrise
    ? new Date(sunrise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const sunsetTime = sunset
    ? new Date(sunset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 mb-6 max-w-3xl mx-auto border border-gray-100 dark:border-gray-700 transition-colors duration-500"
    >
      <div className="text-center space-y-3">
        {/* Header */}
        <h2 className="text-2xl font-semibold flex justify-center items-center gap-2 text-gray-900 dark:text-gray-100">
          <Sun className="text-yellow-400" />
          {shade_side
            ? `Sit on the ${shade_side.charAt(0).toUpperCase() + shade_side.slice(1)} side`
            : "No sunlight during this trip"}
        </h2>

        {/* Subheading */}
        {shade_side && (
          <p className="text-gray-600 dark:text-gray-300 text-base">
            The sun will mostly be on your{" "}
            <strong className="text-gray-800 dark:text-gray-100">{sun_side}</strong> side.
          </p>
        )}

        {/* Weather + Confidence */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-2">
          {weather && (
            <div className="flex items-center gap-1">
              <Sun className="w-4 h-4 text-yellow-400" />
              {weather.description} ({weather.cloudCover}% clouds)
            </div>
          )}
          <Tooltip text="Depends on how frequently the sun shifts during the journey">
            <div className="flex items-center gap-1">
              <Info className="w-4 h-4 text-blue-400" />
              Confidence: {(confidence * 100).toFixed(0)}%
            </div>
          </Tooltip>
        </div>

        {/* Sunrise & Sunset */}
        {sunriseTime && sunsetTime && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sunrise: {sunriseTime} · Sunset: {sunsetTime}
          </p>
        )}

        {/* Narrative Block */}
        {narrative && (
          <div className="bg-yellow-50 dark:bg-gray-700/40 text-gray-800 dark:text-gray-100 italic rounded-md p-4 my-4 leading-relaxed shadow-sm max-w-2xl mx-auto text-balance">
            {narrative}
          </div>
        )}

        {/* Average Reason */}
        {reason && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {reason.replace(/heading\s\d+(\.\d+)?°/, (m) => {
              const val = parseFloat(m.match(/\d+(\.\d+)?/)[0]) % 360;
              return `heading ${val.toFixed(1)}°`;
            })}
          </p>
        )}

        {/* Night Message */}
        {message && (
          <p className="text-sm italic text-gray-500 dark:text-gray-400">{message}</p>
        )}

        {/* Duration */}
        {estimatedDuration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium mt-3"
          >
            <Clock className="w-4 h-4 text-blue-500" />
            Estimated travel time: <span className="font-semibold">{estimatedDuration}</span>
          </motion.div>
        )}

        {/* Past Trip Note */}
        {isPastTrip && tripNote && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center text-sm italic text-gray-500 dark:text-gray-400 mt-2"
          >
            {tripNote}
          </motion.p>
        )}

        {/* Footer */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 leading-snug max-w-md mx-auto">
          <Info className="inline w-3 h-3 mr-1 text-blue-400" />
          This app estimates sunlight direction using live weather, solar position, and
          route geometry, assuming an average travel speed of 60 km/h.
        </div>
      </div>
    </motion.div>
  );
};

export default ResultsCard;
