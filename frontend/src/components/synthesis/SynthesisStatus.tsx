import { Bot, Clock, Cpu, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SynthesisStatusProps {
  modelUsed: string | null;
  tokensUsed: number | null;
  synthesisTimeMs: number | null;
  warnings: string[];
}

export function SynthesisStatus({
  modelUsed,
  tokensUsed,
  synthesisTimeMs,
  warnings,
}: SynthesisStatusProps) {
  if (!modelUsed) return null;

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#12121a] border border-[#2a2a3e] rounded-xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <Bot className="h-4 w-4" />
          <span className="text-sm font-semibold">Synthesis Complete</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5" title="Model Used">
            <Cpu className="h-3 w-3" />
            {modelUsed}
          </span>
          <span className="flex items-center gap-1.5" title="Tokens Used">
            <Badge variant="outline" className="text-[10px] h-5 border-[#2a2a3e] bg-[#0a0a0f]">
              {tokensUsed?.toLocaleString()} tokens
            </Badge>
          </span>
          <span className="flex items-center gap-1.5" title="Duration">
            <Clock className="h-3 w-3" />
            {(synthesisTimeMs! / 1000).toFixed(2)}s
          </span>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-2 space-y-1 bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
          <div className="flex items-center gap-1.5 text-amber-400 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Compiler Warnings
            </span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-300/80 space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
