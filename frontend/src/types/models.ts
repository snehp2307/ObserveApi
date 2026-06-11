// ─────────────────────────────────────────────────────────────────────────────
// TypeScript domain models — mirrors of backend Pydantic schemas
// ─────────────────────────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type ExtractionSource = "body" | "header" | "status";

export type AssertionTarget = "status_code" | "header" | "body";

export type AssertionOperator = "eq" | "neq" | "contains" | "matches" | "gt" | "lt";

// ── Step Configuration ──────────────────────────────────────────────────────

export interface ExtractionRule {
  variable_name: string;
  source: ExtractionSource;
  expression: string;
}

export interface Assertion {
  target: AssertionTarget;
  operator: AssertionOperator;
  expected: string;
  header_name?: string | null;
}

export interface StepConfig {
  name: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  query_params: Record<string, string>;
  body: string | null;
  extraction_rules: ExtractionRule[];
  assertions: Assertion[];
}

// ── Domain Hierarchy ────────────────────────────────────────────────────────

export interface SyntheticCheck {
  id: string;
  name: string;
  steps: StepConfig[];
  created_at: string;
}

export interface BusinessProcess {
  id: string;
  name: string;
  checks: SyntheticCheck[];
}

export interface BusinessService {
  id: string;
  name: string;
  processes: BusinessProcess[];
}

// ── Execution Results ───────────────────────────────────────────────────────

export interface ExtractionLog {
  variable_name: string;
  expression: string;
  extracted_value: unknown;
  source: string;
  source_step_index: number;
  success: boolean;
  error: string | null;
}

export interface AssertionResult {
  assertion: Assertion;
  actual_value: string | null;
  passed: boolean;
  message: string;
}

export interface StepResult {
  step_index: number;
  step_name: string;
  url: string;
  method: HttpMethod;
  request_headers: Record<string, string>;
  request_body: string | null;
  status_code: number | null;
  response_headers: Record<string, string>;
  response_body: string | null;
  latency_ms: number;
  extractions: ExtractionLog[];
  assertions: AssertionResult[];
  passed: boolean;
  error: string | null;
  started_at: string;
  completed_at: string;
}

export interface CheckResult {
  check_id: string;
  check_name: string;
  steps: StepResult[];
  overall_passed: boolean;
  total_duration_ms: number;
  executed_at: string;
  context_snapshot: Record<string, unknown>;
}

// ── API Request / Response ──────────────────────────────────────────────────

export interface TestRunRequest {
  check: SyntheticCheck;
  secrets_config?: Record<string, unknown> | null;
  abort_on_failure?: boolean;
}

export interface TestRunResponse {
  success: boolean;
  result: CheckResult;
}

// ── UI State ────────────────────────────────────────────────────────────────

export interface RuntimeVariable {
  name: string;
  source_step_index: number;
  source_step_name: string;
  expression: string;
}
