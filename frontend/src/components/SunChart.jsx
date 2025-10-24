import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

/**
 * Renders a simple chart showing whether the sun is on the right (1) or left (-1) side per segment.
 *
 * @param {{ data: Array<{ index: number, sunSide: string }> }} props
 */
const SunChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const chartData = data.map((d) => ({
    index: d.index,
    sunSideValue: d.sunSide === 'right' ? 1 : -1,
    intensity: d.intensity ?? 0,
  }));
  return (
    <div className="w-full h-64 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="index"
            tick={false}
            label={{ value: 'Route segments', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            yAxisId="left"
            domain={[-1, 1]}
            ticks={[-1, 0, 1]}
            label={{ value: 'Side (-1 left, 1 right)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 1]}
            label={{ value: 'Intensity', angle: -90, position: 'insideRight' }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'sunSideValue') {
                return [value === 1 ? 'Right' : 'Left', 'Sun side'];
              }
              if (name === 'intensity') {
                return [(value).toFixed(2), 'Intensity'];
              }
              return [value, name];
            }}
          />
          <Line
            yAxisId="left"
            type="stepAfter"
            dataKey="sunSideValue"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="intensity"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SunChart;