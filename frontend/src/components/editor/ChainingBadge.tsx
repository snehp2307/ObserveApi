import type { RuntimeVariable } from "@/types/models";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ChainingBadgeProps {
  variableName: string;
  variables: RuntimeVariable[];
}

/**
 * Renders a colored pill for a {{variable}} reference, showing
 * which upstream step produces this variable on hover.
 */
export function ChainingBadge({ variableName, variables }: ChainingBadgeProps) {
  const source = variables.find((v) => v.name === variableName);

  if (!source) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 text-xs font-mono text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        {`{{${variableName}}}`}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 text-xs font-mono text-indigo-300 cursor-help transition-colors hover:bg-indigo-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          {`{{${variableName}}}`}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">
            From: Step {source.source_step_index + 1} — {source.source_step_name}
          </p>
          <p className="font-mono text-xs text-slate-400">{source.expression}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Parses a string for {{variable}} references and renders them as ChainingBadges
 */
export function ChainingHighlighter({
  text,
  variables,
}: {
  text: string;
  variables: RuntimeVariable[];
}) {
  if (!text) return null;

  const parts = text.split(/(\{\{[^}]+\}\})/g);

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {parts.map((part, index) => {
        const match = part.match(/^\{\{(\w+)\}\}$/);
        if (match) {
          return (
            <ChainingBadge
              key={index}
              variableName={match[1]}
              variables={variables}
            />
          );
        }
        if (part) {
          return (
            <span key={index} className="text-sm text-slate-400">
              {part}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}
