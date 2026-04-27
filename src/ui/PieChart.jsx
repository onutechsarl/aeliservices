import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-md border border-gray-100 flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: payload[0].payload.color }}
        ></div>
        <span className="text-sm font-bold text-gray-800">
          {payload[0].name}: {payload[0].value}%
        </span>
      </div>
    );
  }
  return null;
};

/**
 * UI component responsible for rendering the pie charts section.
 */
export const PieCharts = ({ data }) => {
  return (
    <div style={{ width: "100%", height: 400, position: "relative" }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={0}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="#fff"
            strokeWidth={2}
            isAnimationActive={true}
            label={({ cx, cy, midAngle, outerRadius, value }) => {
              const RADIAN = Math.PI / 180;
              const radius = outerRadius * 0.7;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x}
                  y={y}
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {value}%
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                outerRadius={
                  entry.name === "Medium"
                    ? 110
                    : entry.name === "High"
                      ? 100
                      : 90
                }
                className="cursor-pointer transition-all duration-300 outline-none"
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
