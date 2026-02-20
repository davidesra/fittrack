"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { formatShortDate } from "@/lib/utils";

interface ChartDataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionTimelineChartProps {
  data: ChartDataPoint[];
  calGoal?: number;
  activeMetric?: "calories" | "protein" | "carbs" | "fat";
}

const COLORS = {
  calories: "#6366f1",
  protein: "#10b981",
  carbs: "#f59e0b",
  fat: "#ec4899",
};

export function NutritionTimelineChart({
  data,
  calGoal,
  activeMetric = "calories",
}: NutritionTimelineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    dateLabel: formatShortDate(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
          labelStyle={{ color: "#9ca3af" }}
          itemStyle={{ color: "#e5e7eb" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        {calGoal && activeMetric === "calories" && (
          <ReferenceLine
            y={calGoal}
            stroke="#6366f1"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{ value: "Goal", fill: "#6366f1", fontSize: 10 }}
          />
        )}
        <Bar
          dataKey={activeMetric}
          fill={COLORS[activeMetric]}
          radius={[4, 4, 0, 0]}
          opacity={0.8}
          name={activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
