import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepEditor } from "@/components/editor/StepEditor";
import type { StepConfig, HttpMethod, RuntimeVariable, StepResult } from "@/types/models";

const methodVariant: Record<HttpMethod, "get" | "post" | "put" | "delete" | "patch"> = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
  PATCH: "patch",
};

interface StepAccordionProps {
  steps: StepConfig[];
  stepResults?: StepResult[];
  getAvailableVariables: (stepIndex: number) => RuntimeVariable[];
  onUpdateStep: (index: number, updates: Partial<StepConfig>) => void;
  onRemoveStep: (index: number) => void;
  onAddStep: () => void;
}

export function StepAccordion({
  steps,
  stepResults,
  getAvailableVariables,
  onUpdateStep,
  onRemoveStep,
  onAddStep,
}: StepAccordionProps) {
  return (
    <div className="space-y-3">
      <Accordion type="multiple" className="space-y-2" defaultValue={["step-0"]}>
        {steps.map((step, index) => {
          const result = stepResults?.[index];
          const hasResult = result !== undefined;

          return (
            <AccordionItem
              key={index}
              value={`step-${index}`}
              className="rounded-xl border border-[#2a2a3e] bg-[#12121a] overflow-hidden transition-all hover:border-[#3a3a4e]"
            >
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-slate-600 shrink-0 cursor-grab" />
                  <span className="text-xs font-bold text-slate-600 tabular-nums w-5 shrink-0">
                    {index + 1}
                  </span>
                  <Badge variant={methodVariant[step.method]} className="shrink-0">
                    {step.method}
                  </Badge>
                  <Input
                    value={step.name}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateStep(index, { name: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 text-xs bg-transparent border-none shadow-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 px-1.5 max-w-[180px]"
                  />
                  <span className="text-xs text-slate-500 truncate flex-1 min-w-0">
                    {step.url || "No URL configured"}
                  </span>
                  {/* Result indicators */}
                  {hasResult && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs tabular-nums text-slate-500">
                        {result.latency_ms.toFixed(0)}ms
                      </span>
                      {result.passed ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          Pass
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          Fail
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <StepEditor
                    step={step}
                    stepIndex={index}
                    availableVariables={getAvailableVariables(index)}
                    onChange={(updates) => onUpdateStep(index, updates)}
                  />
                  {steps.length > 1 && (
                    <div className="flex justify-end pt-2 border-t border-[#2a2a3e]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveStep(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove Step
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Button
        variant="outline"
        onClick={onAddStep}
        className="w-full border-dashed border-[#2a2a3e] hover:border-indigo-500/50 hover:bg-indigo-500/5"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Step
      </Button>
    </div>
  );
}
