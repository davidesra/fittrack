"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisStreamProps {
  endpoint: string;
  payload: Record<string, unknown>;
  title?: string;
  buttonLabel?: string;
  className?: string;
}

export function AnalysisStream({
  endpoint,
  payload,
  title = "AI Analysis",
  buttonLabel = "Run Analysis",
  className,
}: AnalysisStreamProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setContent("");
    setError(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setContent((prev) => prev + chunk);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header + run button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <Button
          onClick={runAnalysis}
          loading={loading}
          size="sm"
          variant={content ? "secondary" : "primary"}
        >
          {content && !loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Re-analyze
            </>
          ) : (
            buttonLabel
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Streaming output */}
      {(content || loading) && (
        <div className="bg-[#111114] border border-[#2a2a32] rounded-xl p-5">
          {loading && !content && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <div
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                style={{ animationDelay: "0.4s" }}
              />
              <span>Claude is thinking…</span>
            </div>
          )}
          {content && (
            <div className="prose prose-invert prose-sm max-w-none">
              <MarkdownContent content={content} />
              {loading && (
                <span className="inline-block w-1 h-4 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Minimal markdown renderer (bold, headers, bullets) without heavy deps */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-gray-200 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="font-semibold text-white text-base mt-4 mb-1">
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="font-bold text-white text-lg mt-5 mb-2">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="font-bold text-white text-xl mt-5 mb-2">
              {line.replace("# ", "")}
            </h1>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <li key={i} className="ml-4 list-disc">
              <InlineMd text={line.slice(2)} />
            </li>
          );
        }
        if (/^\d+\. /.test(line)) {
          const text = line.replace(/^\d+\. /, "");
          return (
            <li key={i} className="ml-4 list-decimal">
              <InlineMd text={text} />
            </li>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i}>
            <InlineMd text={line} />
          </p>
        );
      })}
    </div>
  );
}

function InlineMd({ text }: { text: string }) {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
