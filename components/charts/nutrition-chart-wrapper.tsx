"use client";

import { useState, useMemo } from "react";
import { NutritionTimelineChart } from "./nutrition-timeline-chart";
import { format, parseISO, startOfWeek, startOfMonth } from "date-fns";

type Metric = "calories" | "protein" | "carbs" | "fat";
type Period = "7d" | "30d" | "90d";
type Granularity = "daily" | "weekly" | "monthly";

interface DataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionChartWrapperProps {
  data: DataPoint[]; // all data sorted ascending by date
  calGoal?: number;
}

const PERIODS: { label: string; value: Period; granularity: Granularity }[] = [
  { label: "7D", value: "7d", granularity: "daily" },
  { label: "30D", value: "30d", granularity: "daily" },
  { label: "90D", value: "90d", granularity: "weekly" },
];

const METRICS: { label: string; value: Metric }[] = [
  { label: "Calories", value: "calories" },
  { label: "Protein", value: "protein" },
  { label: "Carbs", value: "carbs" },
  { label: "Fat", value: "fat" },
];

function aggregateWeekly(data: DataPoint[]): DataPoint[] {
  const byWeek: Record<string, DataPoint> = {};
  for (const d of data) {
    const weekStart = format(startOfWeek(parseISO(d.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (!byWeek[weekStart]) {
      byWeek[weekStart] = { date: weekStart, calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    byWeek[weekStart].calories += d.calories;
    byWeek[weekStart].protein += d.protein;
    byWeek[weekStart].carbs += d.carbs;
    byWeek[weekStart].fat += d.fat;
  }
  return Object.values(byWeek).sort((a, b) => a.date.localeCompare(b.date));
}

export function NutritionChartWrapper({ data, calGoal }: NutritionChartWrapperProps) {
  const [period, setPeriod] = useState<Period>("30d");
  const [metric, setMetric] = useState<Metric>("calories");

  const { granularity } = PERIODS.find((p) => p.value === period)!;

  const filteredData = useMemo(() => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = format(cutoff, "yyyy-MM-dd");

    const sliced = data.filter((d) => d.date >= cutoffStr);

    if (granularity === "weekly") {
      return aggregateWeekly(sliced);
    }
    return sliced;
  }, [data, period, granularity]);

  // Scale calGoal for weekly aggregation (7-day average)
  const effectiveCalGoal =
    calGoal && granularity === "weekly" ? calGoal * 7 : calGoal;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Period */}
        <div className="flex gap-1 bg-[#111114] rounded-lg p-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                period === value
                  ? "bg-[#2a2a32] text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Metric */}
        <div className="flex gap-1 bg-[#111114] rounded-lg p-1">
          {METRICS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setMetric(value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                metric === value
                  ? "bg-[#2a2a32] text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">
          No data for this period
        </div>
      ) : (
        <NutritionTimelineChart
          data={filteredData}
          calGoal={metric === "calories" ? effectiveCalGoal : undefined}
          activeMetric={metric}
        />
      )}

      {granularity === "weekly" && (
        <p className="text-xs text-gray-600 text-right">
          Showing weekly totals
        </p>
      )}
    </div>
  );
}
