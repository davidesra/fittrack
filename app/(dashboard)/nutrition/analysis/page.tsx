import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AnalysisStream } from "@/components/analysis/analysis-stream";
import { Sparkles } from "lucide-react";

export default function NutritionAnalysisPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Nutrition Analysis</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI-powered insights from your last 30 days of nutrition data
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <CardTitle>Claude Nutrition Coach</CardTitle>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Get a personalized assessment of your nutrition patterns, deficiencies, and a custom 4-week meal plan.
          </p>
        </CardHeader>
        <CardContent>
          <AnalysisStream
            endpoint="/api/nutrition/analysis"
            payload={{}}
            title="Full Nutrition Analysis"
            buttonLabel="Analyze My Nutrition"
          />
        </CardContent>
      </Card>
    </div>
  );
}
