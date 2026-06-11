import type { AssertionResult } from "@/types/models";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X } from "lucide-react";

interface AssertionBadgeProps {
  result: AssertionResult;
}

export function AssertionBadge({ result }: AssertionBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium cursor-help transition-colors ${
            result.passed
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {result.passed ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          {result.passed ? "PASS" : "FAIL"}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs font-mono">{result.message}</p>
      </TooltipContent>
    </Tooltip>
  );
}
