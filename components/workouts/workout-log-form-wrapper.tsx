"use client";

import { useRouter } from "next/navigation";
import { WorkoutLogForm } from "./workout-log-form";

export function WorkoutLogFormWrapper() {
  const router = useRouter();
  return <WorkoutLogForm onSuccess={() => router.refresh()} />;
}
