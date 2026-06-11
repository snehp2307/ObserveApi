import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Assertion, AssertionTarget, AssertionOperator } from "@/types/models";

interface AssertionEditorProps {
  assertions: Assertion[];
  onChange: (assertions: Assertion[]) => void;
}

export function AssertionEditor({ assertions, onChange }: AssertionEditorProps) {
  const addAssertion = () => {
    onChange([
      ...assertions,
      { target: "status_code", operator: "eq", expected: "200" },
    ]);
  };

  const removeAssertion = (index: number) => {
    onChange(assertions.filter((_, i) => i !== index));
  };

  const updateAssertion = (index: number, updates: Partial<Assertion>) => {
    onChange(
      assertions.map((a, i) => (i === index ? { ...a, ...updates } : a))
    );
  };

  const operatorLabels: Record<AssertionOperator, string> = {
    eq: "equals",
    neq: "not equals",
    contains: "contains",
    matches: "matches",
    gt: ">",
    lt: "<",
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
        <span>Target</span>
        <span>Operator</span>
        <span>Expected Value</span>
        <span></span>
      </div>
      {assertions.map((assertion, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-2 items-center">
          <Select
            value={assertion.target}
            onValueChange={(v) => updateAssertion(index, { target: v as AssertionTarget })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status_code">Status Code</SelectItem>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="body">Body</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={assertion.operator}
            onValueChange={(v) => updateAssertion(index, { operator: v as AssertionOperator })}
          >
            <SelectTrigger>
              <SelectValue>
                {operatorLabels[assertion.operator]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(operatorLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={assertion.expected}
            onChange={(e) => updateAssertion(index, { expected: e.target.value })}
            placeholder="200"
            className="font-mono"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeAssertion(index)}
            className="text-slate-500 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addAssertion} className="text-indigo-400 hover:text-indigo-300">
        <Plus className="h-3 w-3 mr-1" />
        Add Assertion
      </Button>
    </div>
  );
}
