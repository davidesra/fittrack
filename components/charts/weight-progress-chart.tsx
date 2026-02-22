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
import { Scale } from "lucide-react";
import { formatShortDate } from "@/lib/utils";

interface WeightDataPoint {
  date: string;
  weightKg: number;
}

interface WeightProgressChartProps {
  data: WeightDataPoint[];
  targetWeight?: number;
}

export function WeightProgressChart({ data, targetWeight }: WeightProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Scale className="w-8 h-8 text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-600 max-w-[180px]">
          Upload progress photos with your weight to track progress over time
        </p>
      </div>
    );
  }

  const weights = data.map((d) => d.weightKg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);

  const formatted = data.map((d) => ({
    ...d,
    dateLabel: formatShortDate(d.date),
  }));

  return (
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
          domain={[Math.floor(minW) - 2, Math.ceil(maxW) + 2]}
        />
        <Tooltip
          contentStyle={{
            background: "#1a1a1f",
            border: "1px solid #2a2a32",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(val: number | undefined) => [`${(val ?? 0).toFixed(1)} kg`, "Weight"]}
        />
        {targetWeight !== undefined && (
          <ReferenceLine
            y={targetWeight}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeOpacity={0.7}
            label={{
              value: `Goal ${targetWeight}kg`,
              fill: "#f59e0b",
              fontSize: 10,
              position: "insideTopRight",
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="weightKg"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#6366f1" }}
          name="Weight"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
