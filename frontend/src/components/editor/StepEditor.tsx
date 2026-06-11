import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KeyValueEditor,
  recordToPairs,
  pairsToRecord,
} from "@/components/editor/KeyValueEditor";
import { ExtractionEditor } from "@/components/editor/ExtractionEditor";
import { AssertionEditor } from "@/components/editor/AssertionEditor";
import { ChainingHighlighter } from "@/components/editor/ChainingBadge";
import type { StepConfig, HttpMethod, RuntimeVariable } from "@/types/models";

interface StepEditorProps {
  step: StepConfig;
  stepIndex: number;
  availableVariables: RuntimeVariable[];
  onChange: (updates: Partial<StepConfig>) => void;
}

export function StepEditor({
  step,
  stepIndex,
  availableVariables,
  onChange,
}: StepEditorProps) {
  const hasVariableRefs = (text: string) => /\{\{\w+\}\}/.test(text);

  return (
    <div className="space-y-4">
      {/* URL + Method Row */}
      <div className="flex gap-2 items-start">
        <Select
          value={step.method}
          onValueChange={(v) => onChange({ method: v as HttpMethod })}
        >
          <SelectTrigger className="w-[120px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["GET", "POST", "PUT", "DELETE", "PATCH"] as HttpMethod[]).map(
              (method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <div className="flex-1 space-y-1">
          <Input
            value={step.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://api.example.com/v1/resource"
            className="font-mono"
          />
          {hasVariableRefs(step.url) && (
            <div className="pl-1">
              <ChainingHighlighter
                text={step.url}
                variables={availableVariables}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabbed Configuration */}
      <Tabs defaultValue="params" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="params">
            Params
            {Object.keys(step.query_params).length > 0 && (
              <span className="ml-1 text-[10px] bg-indigo-500/30 text-indigo-300 rounded-full px-1.5">
                {Object.keys(step.query_params).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="headers">
            Headers
            {Object.keys(step.headers).length > 0 && (
              <span className="ml-1 text-[10px] bg-indigo-500/30 text-indigo-300 rounded-full px-1.5">
                {Object.keys(step.headers).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="extractions">
            Extract
            {step.extraction_rules.length > 0 && (
              <span className="ml-1 text-[10px] bg-emerald-500/30 text-emerald-300 rounded-full px-1.5">
                {step.extraction_rules.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="assertions">
            Assert
            {step.assertions.length > 0 && (
              <span className="ml-1 text-[10px] bg-amber-500/30 text-amber-300 rounded-full px-1.5">
                {step.assertions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="params">
          <KeyValueEditor
            pairs={recordToPairs(step.query_params)}
            onChange={(pairs) => onChange({ query_params: pairsToRecord(pairs) })}
            keyPlaceholder="Parameter name"
            valuePlaceholder="Value (supports {{var}})"
          />
        </TabsContent>

        <TabsContent value="headers">
          <KeyValueEditor
            pairs={recordToPairs(step.headers)}
            onChange={(pairs) => onChange({ headers: pairsToRecord(pairs) })}
            keyPlaceholder="Header name"
            valuePlaceholder="Value (supports {{var}})"
          />
        </TabsContent>

        <TabsContent value="body">
          <div className="space-y-2">
            <Textarea
              value={step.body ?? ""}
              onChange={(e) =>
                onChange({ body: e.target.value || null })
              }
              placeholder='{"key": "value", "token": "{{auth_token}}"}'
              rows={6}
            />
            {step.body && hasVariableRefs(step.body) && (
              <div className="pl-1">
                <ChainingHighlighter
                  text={step.body}
                  variables={availableVariables}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="extractions">
          <ExtractionEditor
            rules={step.extraction_rules}
            onChange={(rules) => onChange({ extraction_rules: rules })}
          />
        </TabsContent>

        <TabsContent value="assertions">
          <AssertionEditor
            assertions={step.assertions}
            onChange={(assertions) => onChange({ assertions })}
          />
        </TabsContent>
      </Tabs>

      {/* Available Variables from upstream steps */}
      {availableVariables.length > 0 && (
        <div className="rounded-lg border border-[#2a2a3e] bg-[#0a0a0f] p-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Available Variables from Prior Steps
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableVariables.map((v) => (
              <span
                key={`${v.source_step_index}-${v.name}`}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-xs font-mono text-indigo-300"
                title={`From Step ${v.source_step_index + 1}: ${v.expression}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                {`{{${v.name}}}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
