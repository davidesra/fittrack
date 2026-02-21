"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function WorkoutsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <AlertTriangle className="w-10 h-10 text-red-400" />
      <div>
        <h2 className="text-lg font-semibold text-white">Failed to load Workouts</h2>
        <p className="text-gray-500 text-sm mt-1">
          {error.message || "Something went wrong. Please try again."}
        </p>
      </div>
      <Button variant="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
