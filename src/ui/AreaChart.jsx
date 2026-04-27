import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * UI component responsible for rendering the area charts section.
 */
export const AreaCharts = ({ data, dataKey, color = "#6366f1" }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart
      data={data}
      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
    >
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.2} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
      <XAxis
        dataKey="name"
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#9ca3af", fontSize: 12 }}
        dy={10}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#9ca3af", fontSize: 12 }}
      />
      <Tooltip
        contentStyle={{
          borderRadius: "8px",
          border: "none",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        }}
      />
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        strokeWidth={3}
        fill="url(#colorValue)"
      />
    </AreaChart>
  </ResponsiveContainer>
);
