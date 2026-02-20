import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AnalysisStream } from "@/components/analysis/analysis-stream";
import { Sparkles } from "lucide-react";

export default function WorkoutAnalysisPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Workout Analysis</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI-powered coaching insights from your training history
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <CardTitle>Claude Training Coach</CardTitle>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Get a personalized breakdown of your training patterns, recovery, weak points, and a custom 4-week training plan.
          </p>
        </CardHeader>
        <CardContent>
          <AnalysisStream
            endpoint="/api/workouts/analysis"
            payload={{}}
            title="Full Workout Analysis"
            buttonLabel="Analyze My Training"
          />
        </CardContent>
      </Card>
    </div>
  );
}
