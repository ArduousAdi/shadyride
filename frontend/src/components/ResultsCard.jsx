import React from 'react';
import { motion } from 'framer-motion';
import { Sun } from 'lucide-react';

/**
 * Animated card that explains whether there will be shade and summarises sunrise/sunset times.
 *
 * @param {{ result: object|null }} props
 */
const ResultsCard = ({ result }) => {
  if (!result) return null;
  const { shade_side, sun_side, sunrise, sunset, confidence, reason, weather } = result;
  const formatSide = (side) => side ? side.charAt(0).toUpperCase() + side.slice(1) : null;
  const shadeLabel = formatSide(shade_side);
  const sunLabel = formatSide(sun_side);
  const formatTime = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const sunriseTime = formatTime(sunrise);
  const sunsetTime = formatTime(sunset);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white rounded-lg shadow mb-4"
    >
      {shade_side === null ? (
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No sunlight for the selected time.</p>
          <p className="text-sm text-gray-500">Sunrise at {sunriseTime}, Sunset at {sunsetTime}</p>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
            <Sun /> Sit on the {shadeLabel} side
          </h2>
          <p className="text-gray-500">The sun will mostly be on your {sunLabel} side during this trip.</p>
          {typeof confidence === 'number' && (
            <p className="text-sm text-gray-500">Confidence: {(confidence * 100).toFixed(0)}%</p>
          )}
          {weather && (
            <p className="text-sm text-gray-500">Cloud cover: {weather.cloudCover}% – {weather.description}</p>
          )}
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <span>Sunrise: {sunriseTime}</span>
            <span>Sunset: {sunsetTime}</span>
          </div>
          {reason && (
            <div className="mt-2 text-xs text-gray-500 italic max-w-prose mx-auto">{reason}</div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ResultsCard;