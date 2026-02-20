"use client";

import { useRouter } from "next/navigation";
import { MealLogForm } from "./meal-log-form";

export function MealLogFormWrapper() {
  const router = useRouter();
  return (
    <MealLogForm
      onSuccess={() => {
        router.refresh();
      }}
    />
  );
}
