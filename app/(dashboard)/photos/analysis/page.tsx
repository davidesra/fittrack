import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AnalysisStream } from "@/components/analysis/analysis-stream";
import { Sparkles } from "lucide-react";

export default function PhotoAnalysisPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Photo Analysis</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI-powered visual progress assessment using Claude vision
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <CardTitle>Claude Vision Analysis</CardTitle>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Claude will analyze your progress photos and provide observations on body composition changes, visual progress, and personalized recommendations.
          </p>
        </CardHeader>
        <CardContent>
          <AnalysisStream
            endpoint="/api/photos/analysis"
            payload={{}}
            title="Body Composition Analysis"
            buttonLabel="Analyze My Progress Photos"
          />
        </CardContent>
      </Card>
    </div>
  );
}
