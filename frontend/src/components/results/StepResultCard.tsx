import { useState } from "react";
import { ChevronDown, ChevronRight, ArrowRightLeft, FileJson } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AssertionBadge } from "@/components/results/AssertionBadge";
import type { StepResult, HttpMethod } from "@/types/models";

const methodVariant: Record<HttpMethod, "get" | "post" | "put" | "delete" | "patch"> = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
  PATCH: "patch",
};

interface StepResultCardProps {
  result: StepResult;
}

export function StepResultCard({ result }: StepResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatJson = (text: string | null): string => {
    if (!text) return "";
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        result.passed
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-red-500/20 bg-red-500/5"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left cursor-pointer"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
        )}
        <Badge variant={methodVariant[result.method]} className="shrink-0">
          {result.method}
        </Badge>
        {result.status_code && (
          <Badge
            variant={result.status_code < 400 ? "success" : "destructive"}
            className="shrink-0 tabular-nums"
          >
            {result.status_code}
          </Badge>
        )}
        <span className="text-sm text-slate-300 truncate flex-1 font-mono">
          {result.url}
        </span>
        <span className="text-xs tabular-nums text-slate-500 shrink-0">
          {result.latency_ms.toFixed(0)}ms
        </span>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-[#2a2a3e] p-4 space-y-4">
          {/* Request */}
          <div>
            <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ArrowRightLeft className="h-3 w-3" /> Request
            </h5>
            {Object.keys(result.request_headers).length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-slate-600 mb-1">Headers</p>
                <pre className="text-xs font-mono text-slate-400 bg-[#0a0a0f] rounded-md p-2 overflow-auto max-h-32">
                  {JSON.stringify(result.request_headers, null, 2)}
                </pre>
              </div>
            )}
            {result.request_body && (
              <div>
                <p className="text-[10px] text-slate-600 mb-1">Body</p>
                <pre className="text-xs font-mono text-slate-400 bg-[#0a0a0f] rounded-md p-2 overflow-auto max-h-32">
                  {formatJson(result.request_body)}
                </pre>
              </div>
            )}
          </div>

          {/* Response */}
          <div>
            <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileJson className="h-3 w-3" /> Response
            </h5>
            {result.response_body && (
              <pre className="text-xs font-mono text-slate-400 bg-[#0a0a0f] rounded-md p-2 overflow-auto max-h-48">
                {formatJson(result.response_body)}
              </pre>
            )}
            {result.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2">
                <p className="text-xs text-red-400 font-mono">{result.error}</p>
              </div>
            )}
          </div>

          {/* Extractions */}
          {result.extractions.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Extractions
              </h5>
              <div className="space-y-1">
                {result.extractions.map((ext, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-xs rounded-md px-2 py-1 ${
                      ext.success
                        ? "bg-indigo-500/10 border border-indigo-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <span className="font-mono text-indigo-300 font-medium">
                      {ext.variable_name}
                    </span>
                    <span className="text-slate-600">=</span>
                    <span className="font-mono text-slate-400 truncate">
                      {ext.success
                        ? String(ext.extracted_value)
                        : ext.error || "Failed"}
                    </span>
                    <span className="text-slate-600 ml-auto shrink-0">
                      via {ext.expression}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assertions */}
          {result.assertions.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Assertions
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {result.assertions.map((assertion, i) => (
                  <AssertionBadge key={i} result={assertion} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
