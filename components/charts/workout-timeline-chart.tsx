"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { formatShortDate } from "@/lib/utils";

interface ExerciseDataPoint {
  date: string;
  weightKg: number;
  volume: number;
  isPR: boolean;
  reps: number;
  sets: number;
}

interface WorkoutTimelineChartProps {
  data: ExerciseDataPoint[];
  exerciseName: string;
  metric?: "weightKg" | "volume";
  goalWeightKg?: number;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ExerciseDataPoint;
}

const PRDot = ({ cx, cy, payload }: CustomDotProps) => {
  if (!payload?.isPR || cx === undefined || cy === undefined) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#111114" strokeWidth={2} />
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#f59e0b" fontSize={9} fontWeight="bold">
        PR
      </text>
    </g>
  );
};

export function WorkoutTimelineChart({
  data,
  exerciseName,
  metric = "weightKg",
  goalWeightKg,
}: WorkoutTimelineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    dateLabel: formatShortDate(d.date),
    displayValue: metric === "weightKg" ? d.weightKg : d.volume,
  }));

  const label = metric === "weightKg" ? "Weight (kg)" : "Volume (kg×reps×sets)";

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3 font-medium">{exerciseName} — {label}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a1f",
              border: "1px solid #2a2a32",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(val: number | undefined) => [
              `${(val ?? 0).toFixed(1)} ${metric === "weightKg" ? "kg" : ""}`,
              label,
            ]}
          />
          {goalWeightKg !== undefined && metric === "weightKg" && (
            <ReferenceLine
              y={goalWeightKg}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              label={{
                value: `Goal ${goalWeightKg}kg`,
                fill: "#f59e0b",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="displayValue"
            stroke="#6366f1"
            strokeWidth={2}
            dot={<PRDot />}
            activeDot={{ r: 4, fill: "#6366f1" }}
            name={label}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
