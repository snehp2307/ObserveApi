import type { StepResult } from "@/types/models";

interface LatencyChartProps {
  steps: StepResult[];
}

export function LatencyChart({ steps }: LatencyChartProps) {
  if (steps.length === 0) return null;

  const maxLatency = Math.max(...steps.map((s) => s.latency_ms), 1);
  const totalDuration = steps.reduce((sum, s) => sum + s.latency_ms, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Latency Breakdown
        </h4>
        <span className="text-xs tabular-nums text-slate-400">
          Total: {totalDuration.toFixed(0)}ms
        </span>
      </div>
      <div className="space-y-1.5">
        {steps.map((step) => {
          const widthPercent = Math.max((step.latency_ms / maxLatency) * 100, 2);
          const barColor = step.passed
            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
            : "bg-gradient-to-r from-red-500 to-red-400";

          return (
            <div key={step.step_index} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-6 text-right tabular-nums shrink-0">
                {step.step_index + 1}
              </span>
              <div className="flex-1 h-5 bg-[#0a0a0f] rounded-md overflow-hidden relative">
                <div
                  className={`h-full rounded-md ${barColor} transition-all duration-700 ease-out`}
                  style={{ width: `${widthPercent}%` }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-medium text-white/80">
                  {step.step_name}
                </span>
              </div>
              <span className="text-xs tabular-nums text-slate-400 w-14 text-right shrink-0">
                {step.latency_ms.toFixed(0)}ms
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
