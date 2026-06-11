import { Badge } from "@/components/ui/badge";
import { LatencyChart } from "@/components/results/LatencyChart";
import { StepResultCard } from "@/components/results/StepResultCard";
import type { CheckResult, HttpMethod } from "@/types/models";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Variable,
  Activity,
} from "lucide-react";

const methodVariant: Record<HttpMethod, "get" | "post" | "put" | "delete" | "patch"> = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
  PATCH: "patch",
};

interface ExecutionTimelineProps {
  result: CheckResult;
}

export function ExecutionTimeline({ result }: ExecutionTimelineProps) {
  const passedCount = result.steps.filter((s) => s.passed).length;
  const failedCount = result.steps.length - passedCount;
  const extractionCount = result.steps.reduce(
    (sum, s) => sum + s.extractions.filter((e) => e.success).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="rounded-xl border border-[#2a2a3e] bg-[#12121a] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {result.overall_passed ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
                <span className="text-lg font-semibold">All Checks Passed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-6 w-6" />
                <span className="text-lg font-semibold">Check Failed</span>
              </div>
            )}
          </div>
          <Badge variant={result.overall_passed ? "success" : "destructive"} className="text-sm">
            {result.overall_passed ? "PASSED" : "FAILED"}
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-[#0a0a0f] border border-[#2a2a3e] p-3 text-center">
            <Activity className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-200 tabular-nums">
              {result.steps.length}
            </p>
            <p className="text-[10px] text-slate-500 uppercase">Steps</p>
          </div>
          <div className="rounded-lg bg-[#0a0a0f] border border-[#2a2a3e] p-3 text-center">
            <Clock className="h-4 w-4 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-200 tabular-nums">
              {result.total_duration_ms.toFixed(0)}
            </p>
            <p className="text-[10px] text-slate-500 uppercase">ms Total</p>
          </div>
          <div className="rounded-lg bg-[#0a0a0f] border border-[#2a2a3e] p-3 text-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-200 tabular-nums">
              {passedCount}/{result.steps.length}
            </p>
            <p className="text-[10px] text-slate-500 uppercase">Passed</p>
          </div>
          <div className="rounded-lg bg-[#0a0a0f] border border-[#2a2a3e] p-3 text-center">
            <Variable className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-200 tabular-nums">
              {extractionCount}
            </p>
            <p className="text-[10px] text-slate-500 uppercase">Extracted</p>
          </div>
        </div>
      </div>

      {/* Latency Chart */}
      <div className="rounded-xl border border-[#2a2a3e] bg-[#12121a] p-4">
        <LatencyChart steps={result.steps} />
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
          Execution Timeline
        </h4>
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[#2a2a3e]" />

          <div className="space-y-3">
            {result.steps.map((step) => (
              <div key={step.step_index} className="relative pl-10">
                {/* Node Dot */}
                <div
                  className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 ${
                    step.passed
                      ? "bg-emerald-400 border-emerald-500/50"
                      : "bg-red-400 border-red-500/50"
                  }`}
                />
                <StepResultCard result={step} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Context Snapshot */}
      {Object.keys(result.context_snapshot).length > 0 && (
        <div className="rounded-xl border border-[#2a2a3e] bg-[#12121a] p-4">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Final Context Snapshot
          </h4>
          <pre className="text-xs font-mono text-slate-400 bg-[#0a0a0f] rounded-md p-3 overflow-auto max-h-48">
            {JSON.stringify(result.context_snapshot, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
