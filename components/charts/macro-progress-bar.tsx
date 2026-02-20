"use client";

import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  color?: string;
}

export function MacroBar({
  label,
  value,
  goal,
  unit = "g",
  color = "bg-indigo-500",
}: MacroBarProps) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const over = goal > 0 && value > goal;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={cn("font-medium", over ? "text-red-400" : "text-white")}>
          {Math.round(value)}
          <span className="text-gray-500">/{goal}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-[#2a2a32] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", over ? "bg-red-500" : color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
