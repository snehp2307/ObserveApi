import { useState, useCallback, useMemo } from "react";
import type {
  BusinessService,
  BusinessProcess,
  SyntheticCheck,
  StepConfig,
  RuntimeVariable,
} from "@/types/models";

function uuid(): string {
  return crypto.randomUUID();
}

function createDefaultStep(index: number): StepConfig {
  return {
    name: `Step ${index + 1}`,
    url: "",
    method: "GET",
    headers: {},
    query_params: {},
    body: null,
    extraction_rules: [],
    assertions: [],
  };
}

function createDefaultCheck(): SyntheticCheck {
  return {
    id: uuid(),
    name: "New Check",
    steps: [createDefaultStep(0)],
    created_at: new Date().toISOString(),
  };
}

function createDefaultProcess(): BusinessProcess {
  return {
    id: uuid(),
    name: "New Process",
    checks: [createDefaultCheck()],
  };
}

function createDefaultService(): BusinessService {
  return {
    id: uuid(),
    name: "New Service",
    processes: [createDefaultProcess()],
  };
}

export interface WorkflowState {
  service: BusinessService;
  activeProcessId: string;
  activeCheckId: string;
}

export function useWorkflow() {
  const [state, setState] = useState<WorkflowState>(() => {
    const svc = createDefaultService();
    return {
      service: svc,
      activeProcessId: svc.processes[0].id,
      activeCheckId: svc.processes[0].checks[0].id,
    };
  });

  // ── Derived State ───────────────────────────────────────────────
  const activeProcess = useMemo(
    () => state.service.processes.find((p) => p.id === state.activeProcessId) ?? state.service.processes[0],
    [state.service.processes, state.activeProcessId]
  );

  const activeCheck = useMemo(
    () => activeProcess.checks.find((c) => c.id === state.activeCheckId) ?? activeProcess.checks[0],
    [activeProcess.checks, state.activeCheckId]
  );

  const steps = activeCheck.steps;

  // ── Runtime Variables — tracks which variables are available at each step ─
  const runtimeVariables = useMemo((): RuntimeVariable[] => {
    const vars: RuntimeVariable[] = [];
    for (let i = 0; i < steps.length; i++) {
      for (const rule of steps[i].extraction_rules) {
        vars.push({
          name: rule.variable_name,
          source_step_index: i,
          source_step_name: steps[i].name,
          expression: rule.expression,
        });
      }
    }
    return vars;
  }, [steps]);

  const getAvailableVariables = useCallback(
    (stepIndex: number): RuntimeVariable[] => {
      return runtimeVariables.filter((v) => v.source_step_index < stepIndex);
    },
    [runtimeVariables]
  );

  // ── Service Mutations ───────────────────────────────────────────
  const updateServiceName = useCallback((name: string) => {
    setState((s) => ({ ...s, service: { ...s.service, name } }));
  }, []);

  // ── Process Mutations ───────────────────────────────────────────
  const addProcess = useCallback(() => {
    const newProc = createDefaultProcess();
    setState((s) => ({
      ...s,
      service: {
        ...s.service,
        processes: [...s.service.processes, newProc],
      },
      activeProcessId: newProc.id,
      activeCheckId: newProc.checks[0].id,
    }));
  }, []);

  const selectProcess = useCallback((processId: string) => {
    setState((s) => {
      const proc = s.service.processes.find((p) => p.id === processId);
      return {
        ...s,
        activeProcessId: processId,
        activeCheckId: proc?.checks[0]?.id ?? s.activeCheckId,
      };
    });
  }, []);

  const updateProcessName = useCallback((processId: string, name: string) => {
    setState((s) => ({
      ...s,
      service: {
        ...s.service,
        processes: s.service.processes.map((p) =>
          p.id === processId ? { ...p, name } : p
        ),
      },
    }));
  }, []);

  // ── Check Mutations ─────────────────────────────────────────────
  const addCheck = useCallback(() => {
    const newCheck = createDefaultCheck();
    setState((s) => ({
      ...s,
      service: {
        ...s.service,
        processes: s.service.processes.map((p) =>
          p.id === s.activeProcessId
            ? { ...p, checks: [...p.checks, newCheck] }
            : p
        ),
      },
      activeCheckId: newCheck.id,
    }));
  }, []);

  const selectCheck = useCallback((checkId: string) => {
    setState((s) => ({ ...s, activeCheckId: checkId }));
  }, []);

  const updateCheckName = useCallback((checkId: string, name: string) => {
    setState((s) => ({
      ...s,
      service: {
        ...s.service,
        processes: s.service.processes.map((p) =>
          p.id === s.activeProcessId
            ? {
                ...p,
                checks: p.checks.map((c) =>
                  c.id === checkId ? { ...c, name } : c
                ),
              }
            : p
        ),
      },
    }));
  }, []);

  // ── Step Mutations ──────────────────────────────────────────────
  const _updateSteps = useCallback((updater: (steps: StepConfig[]) => StepConfig[]) => {
    setState((s) => ({
      ...s,
      service: {
        ...s.service,
        processes: s.service.processes.map((p) =>
          p.id === s.activeProcessId
            ? {
                ...p,
                checks: p.checks.map((c) =>
                  c.id === s.activeCheckId
                    ? { ...c, steps: updater(c.steps) }
                    : c
                ),
              }
            : p
        ),
      },
    }));
  }, []);

  const addStep = useCallback(() => {
    _updateSteps((steps) => [...steps, createDefaultStep(steps.length)]);
  }, [_updateSteps]);

  const removeStep = useCallback((index: number) => {
    _updateSteps((steps) => steps.filter((_, i) => i !== index));
  }, [_updateSteps]);

  const updateStep = useCallback((index: number, updates: Partial<StepConfig>) => {
    _updateSteps((steps) =>
      steps.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  }, [_updateSteps]);

  const moveStep = useCallback((fromIndex: number, toIndex: number) => {
    _updateSteps((steps) => {
      const arr = [...steps];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr;
    });
  }, [_updateSteps]);

  return {
    // State
    service: state.service,
    activeProcess,
    activeCheck,
    steps,
    runtimeVariables,

    // Variable helpers
    getAvailableVariables,

    // Service
    updateServiceName,

    // Process
    addProcess,
    selectProcess,
    updateProcessName,

    // Check
    addCheck,
    selectCheck,
    updateCheckName,

    // Steps
    addStep,
    removeStep,
    updateStep,
    moveStep,
  };
}
