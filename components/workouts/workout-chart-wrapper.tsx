"use client";

import { useState } from "react";
import { WorkoutTimelineChart } from "@/components/charts/workout-timeline-chart";

interface ExerciseData {
  date: string;
  weightKg: number;
  volume: number;
  isPR: boolean;
  reps: number;
  sets: number;
}

interface WorkoutChartWrapperProps {
  exercises: { name: string; data: ExerciseData[] }[];
}

export function WorkoutChartWrapper({ exercises }: WorkoutChartWrapperProps) {
  const [activeExercise, setActiveExercise] = useState(exercises[0]?.name ?? "");
  const [metric, setMetric] = useState<"weightKg" | "volume">("weightKg");

  const current = exercises.find((e) => e.name === activeExercise);

  if (!current) return null;

  return (
    <div className="space-y-4">
      {/* Exercise selector */}
      <div className="flex flex-wrap gap-2">
        {exercises.map((e) => (
          <button
            key={e.name}
            onClick={() => setActiveExercise(e.name)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeExercise === e.name
                ? "bg-indigo-600 text-white"
                : "bg-[#2a2a32] text-gray-400 hover:text-gray-200"
            }`}
          >
            {e.name}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {(["weightKg", "volume"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                metric === m
                  ? "bg-[#2a2a32] text-white"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              {m === "weightKg" ? "Weight" : "Volume"}
            </button>
          ))}
        </div>
      </div>

      <WorkoutTimelineChart
        data={current.data}
        exerciseName={activeExercise}
        metric={metric}
      />
    </div>
  );
}
