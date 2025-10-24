import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Renders a user-friendly chart showing sunlight intensity and which side
 * (left/right) the sun is on during each route segment.
 *
 * @param {{ data: Array<{ index: number, sunSide: string, intensity?: number }> }} props
 */
const SunChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    index: d.index,
    sunSideValue: d.sunSide === "right" ? 1 : -1,
    intensity: d.intensity ?? 0,
  }));

  return (
    <div className="mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 max-w-3xl mx-auto">
      <h3 className="text-lg font-semibold text-center mb-2">
        🌤️ Sunlight Intensity & Side of the Vehicle
      </h3>

      <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-3 leading-snug">
        This chart shows how sunlight shifts along your route.<br />
        <strong>+1 = sun on right ☀️</strong> . <strong>-1 = sun on left ☀️</strong> . Higher curve = stronger sunlight.
      </p>

      <div className="w-full h-64 sm:h-72 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
            <XAxis
              dataKey="index"
              tick={false}
              label={{
                value: "Route Progress →",
                position: "insideBottom",
                offset: -5,
                fill: "#888",
                fontSize: 12,
              }}
            />
            <YAxis
              yAxisId="left"
              domain={[-1, 1]}
              ticks={[-1, 0, 1]}
              label={{
                value: "Sun Side ",
                angle: -90,
                position: "insideLeft",
                fill: "#666",
                fontSize: 12,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 1]}
              label={{
                value: "Sunlight Intensity",
                angle: -90,
                position: "insideRight",
                fill: "#666",
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#f9fafb",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
              formatter={(value, name) => {
                if (name === "sunSideValue") {
                  return [value === 1 ? "Right" : "Left", "Sun side"];
                }
                if (name === "intensity") {
                  return [(value).toFixed(2), "Intensity"];
                }
                return [value, name];
              }}
            />
            <Line
              yAxisId="left"
              type="stepAfter"
              dataKey="sunSideValue"
              strokeWidth={2}
              stroke="#3b82f6"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="intensity"
              strokeWidth={2}
              stroke="#f59e0b"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center text-gray-500 dark:text-gray-400 text-xs mt-2">
        ☀️ Blue line: which side the sun is on · 🟠 Yellow line: sunlight intensity
      </div>
    </div>
  );
};

export default SunChart;
