import { useState, useCallback } from "react";
import type { CheckResult, SyntheticCheck } from "@/types/models";
import { executeTestRun } from "@/lib/api";

interface TestRunState {
  isRunning: boolean;
  result: CheckResult | null;
  error: string | null;
}

export function useTestRun() {
  const [state, setState] = useState<TestRunState>({
    isRunning: false,
    result: null,
    error: null,
  });

  const run = useCallback(async (check: SyntheticCheck, abortOnFailure: boolean = false) => {
    setState({ isRunning: true, result: null, error: null });

    try {
      const response = await executeTestRun({
        check,
        abort_on_failure: abortOnFailure,
      });

      setState({
        isRunning: false,
        result: response.result,
        error: null,
      });

      return response.result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({
        isRunning: false,
        result: null,
        error: message,
      });
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    setState({ isRunning: false, result: null, error: null });
  }, []);

  return {
    isRunning: state.isRunning,
    result: state.result,
    error: state.error,
    run,
    clear,
  };
}
