import { useState, useCallback } from "react";
import type { SyntheticCheck } from "@/types/models";
import { synthesizeFlow } from "@/lib/api";

interface FlowNode {
  id: string;
  label: string;
  method: string;
  url: string;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  variableName: string;
}

interface SynthesisState {
  isSynthesizing: boolean;
  rawSpec: string;
  synthesizedCheck: SyntheticCheck | null;
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
  modelUsed: string | null;
  tokensUsed: number | null;
  synthesisTimeMs: number | null;
  warnings: string[];
  error: string | null;
}

export function useSynthesis() {
  const [state, setState] = useState<SynthesisState>({
    isSynthesizing: false,
    rawSpec: "",
    synthesizedCheck: null,
    flowNodes: [],
    flowEdges: [],
    modelUsed: null,
    tokensUsed: null,
    synthesisTimeMs: null,
    warnings: [],
    error: null,
  });

  const setRawSpec = useCallback((spec: string) => {
    setState((prev) => ({ ...prev, rawSpec: spec }));
  }, []);

  const synthesize = useCallback(async () => {
    if (!state.rawSpec.trim()) return;

    setState((prev) => ({
      ...prev,
      isSynthesizing: true,
      error: null,
      warnings: [],
      synthesizedCheck: null,
    }));

    try {
      const response = await synthesizeFlow({
        raw_spec: state.rawSpec,
        model: "mistral-large-latest",
      });

      if (response.success && response.check) {
        // Compute topology for visualization
        const nodes: FlowNode[] = [];
        const edges: FlowEdge[] = [];
        
        response.check.steps.forEach((step, index) => {
          const nodeId = `step-${index}`;
          nodes.push({
            id: nodeId,
            label: step.name,
            method: step.method,
            url: step.url,
          });

          // Check if this step extracts anything
          step.extraction_rules.forEach((rule) => {
            // Find subsequent steps that use this variable
            for (let i = index + 1; i < response.check!.steps.length; i++) {
              const targetStep = response.check!.steps[i];
              const varRef = `{{${rule.variable_name}}}`;
              
              const usesVar = 
                targetStep.url.includes(varRef) ||
                (targetStep.body && targetStep.body.includes(varRef)) ||
                Object.values(targetStep.headers).some(v => v.includes(varRef)) ||
                Object.values(targetStep.query_params).some(v => v.includes(varRef));

              if (usesVar) {
                edges.push({
                  id: `edge-${index}-${i}-${rule.variable_name}`,
                  source: nodeId,
                  target: `step-${i}`,
                  variableName: rule.variable_name,
                });
              }
            }
          });
        });

        setState((prev) => ({
          ...prev,
          isSynthesizing: false,
          synthesizedCheck: response.check!,
          flowNodes: nodes,
          flowEdges: edges,
          modelUsed: response.model_used || null,
          tokensUsed: response.tokens_used || null,
          synthesisTimeMs: response.synthesis_time_ms || null,
          warnings: response.warnings || [],
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isSynthesizing: false,
          error: response.error || "Synthesis failed without an explicit error.",
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSynthesizing: false,
        error: err instanceof Error ? err.message : "An unknown error occurred",
      }));
    }
  }, [state.rawSpec]);

  const clear = useCallback(() => {
    setState({
      isSynthesizing: false,
      rawSpec: "",
      synthesizedCheck: null,
      flowNodes: [],
      flowEdges: [],
      modelUsed: null,
      tokensUsed: null,
      synthesisTimeMs: null,
      warnings: [],
      error: null,
    });
  }, []);

  return {
    ...state,
    setRawSpec,
    synthesize,
    clear,
  };
}
