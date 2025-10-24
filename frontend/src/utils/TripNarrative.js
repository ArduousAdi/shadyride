// src/utils/TripNarrative.js
export function buildNarrative({
  origin,
  destination,
  confidence,
  weather,
  avgHeading,
  avgAzimuth,
  shade_side,
  sun_side,
}) {
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
  const headingIndex = Math.round(((avgHeading % 360) / 45)) % 8;
  const headingText = directions[headingIndex];

  let confidenceText = "";
  if (confidence >= 0.9) confidenceText = "absolutely certain ";
  else if (confidence >= 0.75) confidenceText = "pretty sure ";
  else if (confidence >= 0.5) confidenceText = "fairly confident ";
  else confidenceText = "not entirely sure; the sun keeps changing ";

  let weatherText = "";
  const desc = weather?.description?.toLowerCase() || "";
  if (desc.includes("clear")) weatherText = "bright and sunny ☀️";
  else if (desc.includes("few")) weatherText = "mostly sunny with a few clouds 🌤️";
  else if (desc.includes("scattered") || desc.includes("broken"))
    weatherText = "patchy sunlight drifting through clouds ⛅";
  else if (desc.includes("rain")) weatherText = "occasional sun between light showers 🌦️";
  else if (desc.includes("overcast")) weatherText = "soft light under overcast skies ☁️";
  else weatherText = desc || "typical daylight";

  return `
Leaving ${origin || "your starting point"}, you’ll be heading mostly ${headingText} toward ${destination || "your destination"}.
It looks like a ${weatherText} kind of day, so expect ${sun_side === "right" ? "bright light on your right" : "warm rays on your left"} for most of the trip.
I am ${confidenceText}  ${shade_side === "left" ? "left seats" : "right seats"} will feel cooler and shadier along the way 
  `.trim();
}
