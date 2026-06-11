import { Play, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceBreadcrumb } from "@/components/navigation/ServiceBreadcrumb";
import { StepAccordion } from "@/components/editor/StepAccordion";
import { ExecutionTimeline } from "@/components/results/ExecutionTimeline";
import { useTestRun } from "@/hooks/useTestRun";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { useWorkflow } from "@/hooks/useWorkflow";

interface DashboardProps {
  workflow: ReturnType<typeof useWorkflow>;
}

export function Dashboard({ workflow }: DashboardProps) {
  const testRun = useTestRun();

  const handleRun = async () => {
    await testRun.run(workflow.activeCheck);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#2a2a3e] bg-[#0c0c14]/60 backdrop-blur-sm shrink-0">
        <ServiceBreadcrumb
          service={workflow.service}
          process={workflow.activeProcess}
          check={workflow.activeCheck}
        />
        <div className="flex items-center gap-3">
          {testRun.result && (
            <span
              className={`text-xs font-medium ${
                testRun.result.overall_passed ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {testRun.result.overall_passed ? "✓ Passed" : "✗ Failed"} in{" "}
              {testRun.result.total_duration_ms.toFixed(0)}ms
            </span>
          )}
          <Button
            onClick={handleRun}
            disabled={testRun.isRunning || workflow.steps.length === 0}
            variant="success"
            size="sm"
            className="min-w-[100px]"
          >
            {testRun.isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Check
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 min-w-0 border-r border-[#2a2a3e]">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">
                  Step Composer
                </h2>
                <span className="text-xs text-slate-500">
                  {workflow.steps.length} step{workflow.steps.length !== 1 ? "s" : ""}
                  {workflow.runtimeVariables.length > 0 &&
                    ` · ${workflow.runtimeVariables.length} variable${
                      workflow.runtimeVariables.length !== 1 ? "s" : ""
                    }`}
                </span>
              </div>

              <StepAccordion
                steps={workflow.steps}
                stepResults={testRun.result?.steps}
                getAvailableVariables={workflow.getAvailableVariables}
                onUpdateStep={workflow.updateStep}
                onRemoveStep={workflow.removeStep}
                onAddStep={workflow.addStep}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Results Panel */}
        <div className="w-[480px] shrink-0 bg-[#0a0a0f]">
          <ScrollArea className="h-full">
            <div className="p-6">
              {testRun.isRunning && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-4" />
                  <p className="text-sm">Executing synthetic check...</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Running {workflow.steps.length} steps sequentially
                  </p>
                </div>
              )}

              {testRun.error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="font-semibold">Execution Error</h3>
                  </div>
                  <p className="text-sm text-red-300/80 font-mono">
                    {testRun.error}
                  </p>
                </div>
              )}

              {testRun.result && <ExecutionTimeline result={testRun.result} />}

              {!testRun.isRunning && !testRun.result && !testRun.error && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                  <div className="w-16 h-16 rounded-2xl bg-[#12121a] border border-[#2a2a3e] flex items-center justify-center mb-4">
                    <Play className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-500">No results yet</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Configure your steps and click "Run Check"
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
