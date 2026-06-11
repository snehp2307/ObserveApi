import { Play, Loader2, AlertTriangle, Sparkles, PencilRuler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceBreadcrumb } from "@/components/navigation/ServiceBreadcrumb";
import { StepAccordion } from "@/components/editor/StepAccordion";
import { ExecutionTimeline } from "@/components/results/ExecutionTimeline";
import { SpecIngestion } from "@/components/synthesis/SpecIngestion";
import { FlowTopology } from "@/components/synthesis/FlowTopology";
import { SynthesisStatus } from "@/components/synthesis/SynthesisStatus";
import { useTestRun } from "@/hooks/useTestRun";
import { useSynthesis } from "@/hooks/useSynthesis";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { useWorkflow } from "@/hooks/useWorkflow";

interface DashboardProps {
  workflow: ReturnType<typeof useWorkflow>;
}

export function Dashboard({ workflow }: DashboardProps) {
  const testRun = useTestRun();
  const synthesis = useSynthesis();

  const handleRunDraft = async () => {
    // When running from Synthesis tab, we run the synthesized check
    if (synthesis.synthesizedCheck) {
      await testRun.run(synthesis.synthesizedCheck);
    }
  };

  const handleRunManual = async () => {
    // When running from Manual tab, we run the active workflow check
    await testRun.run(workflow.activeCheck);
  };

  const applyToManual = () => {
    if (synthesis.synthesizedCheck) {
      workflow.updateCheckName(workflow.activeCheck.id, synthesis.synthesizedCheck.name);
      // Hacky way to replace steps in the workflow hook for the prototype
      workflow.activeCheck.steps = synthesis.synthesizedCheck.steps;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
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
        </div>
      </header>

      {/* Main Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="synthesis" className="flex-1 flex flex-col h-full">
          <div className="px-6 py-2 border-b border-[#2a2a3e] bg-[#12121a]">
            <TabsList>
              <TabsTrigger value="synthesis" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                AI Synthesis
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <PencilRuler className="h-4 w-4 text-slate-400" />
                Manual Composer
              </TabsTrigger>
            </TabsList>
          </div>

          {/* AI Synthesis Tab */}
          <TabsContent value="synthesis" className="flex-1 flex overflow-hidden m-0 outline-none">
            {/* Left: Synthesis Config */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-[#2a2a3e]">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <SpecIngestion
                    rawSpec={synthesis.rawSpec}
                    isSynthesizing={synthesis.isSynthesizing}
                    onSpecChange={synthesis.setRawSpec}
                    onSynthesize={synthesis.synthesize}
                  />

                  {synthesis.error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3 text-red-400">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm">Synthesis Failed</h3>
                        <p className="text-xs mt-1 text-red-300/80">{synthesis.error}</p>
                      </div>
                    </div>
                  )}

                  {synthesis.synthesizedCheck && (
                    <>
                      <SynthesisStatus
                        modelUsed={synthesis.modelUsed}
                        tokensUsed={synthesis.tokensUsed}
                        synthesisTimeMs={synthesis.synthesisTimeMs}
                        warnings={synthesis.warnings}
                      />
                      <FlowTopology
                        nodes={synthesis.flowNodes}
                        edges={synthesis.flowEdges}
                      />
                      
                      <div className="pt-4 border-t border-[#2a2a3e]">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-slate-200">
                            Generated Execution Draft
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={applyToManual}
                            className="text-xs h-7"
                          >
                            Apply to Manual Editor
                          </Button>
                        </div>
                        <StepAccordion
                          steps={synthesis.synthesizedCheck.steps}
                          stepResults={testRun.result?.steps}
                          getAvailableVariables={() => []} // Simplified for draft view
                          onUpdateStep={(i, updates) => {
                            if (synthesis.synthesizedCheck) {
                              const newSteps = [...synthesis.synthesizedCheck.steps];
                              newSteps[i] = { ...newSteps[i], ...updates };
                              synthesis.synthesizedCheck.steps = newSteps;
                            }
                          }}
                          onRemoveStep={() => {}}
                          onAddStep={() => {}}
                        />
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Synthesis Results */}
            <div className="w-[480px] shrink-0 bg-[#0a0a0f] flex flex-col">
              <div className="p-4 border-b border-[#2a2a3e] flex justify-end bg-[#12121a]">
                <Button
                  onClick={handleRunDraft}
                  disabled={testRun.isRunning || !synthesis.synthesizedCheck}
                  variant="success"
                  size="sm"
                >
                  {testRun.isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Running Draft...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Synthesized Draft
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {testRun.isRunning && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-4" />
                      <p className="text-sm">Executing synthesized draft...</p>
                    </div>
                  )}

                  {testRun.error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-red-400 text-sm">
                      {testRun.error}
                    </div>
                  )}

                  {testRun.result && <ExecutionTimeline result={testRun.result} />}

                  {!testRun.isRunning && !testRun.result && !testRun.error && (
                    <div className="text-center py-20 text-slate-600 text-sm">
                      Generate a flow and run the draft to see results
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Manual Composer Tab */}
          <TabsContent value="manual" className="flex-1 flex overflow-hidden m-0 outline-none">
            <div className="flex-1 flex flex-col min-w-0 border-r border-[#2a2a3e]">
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-200">
                      Manual Composer
                    </h2>
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

            <div className="w-[480px] shrink-0 bg-[#0a0a0f] flex flex-col">
              <div className="p-4 border-b border-[#2a2a3e] flex justify-end bg-[#12121a]">
                <Button
                  onClick={handleRunManual}
                  disabled={testRun.isRunning || workflow.steps.length === 0}
                  variant="success"
                  size="sm"
                >
                  {testRun.isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Check
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {testRun.isRunning && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-4" />
                      <p className="text-sm">Executing manual check...</p>
                    </div>
                  )}

                  {testRun.error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3 text-red-400">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-sm">Execution Failed</h3>
                        <p className="text-xs mt-1 text-red-300/80">{testRun.error}</p>
                      </div>
                    </div>
                  )}

                  {testRun.result && <ExecutionTimeline result={testRun.result} />}

                  {!testRun.isRunning && !testRun.result && !testRun.error && (
                    <div className="text-center py-20 text-slate-600 text-sm">
                      Configure your steps and click "Run Check"
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
