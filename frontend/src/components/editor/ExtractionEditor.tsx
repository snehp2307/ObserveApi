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
import type { ExtractionRule, ExtractionSource } from "@/types/models";

interface ExtractionEditorProps {
  rules: ExtractionRule[];
  onChange: (rules: ExtractionRule[]) => void;
}

export function ExtractionEditor({ rules, onChange }: ExtractionEditorProps) {
  const addRule = () => {
    onChange([
      ...rules,
      { variable_name: "", source: "body", expression: "" },
    ]);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<ExtractionRule>) => {
    onChange(
      rules.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1.5fr_auto] gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
        <span>Variable Name</span>
        <span>Source</span>
        <span>Expression</span>
        <span></span>
      </div>
      {rules.map((rule, index) => (
        <div key={index} className="grid grid-cols-[1fr_auto_1.5fr_auto] gap-2 items-center">
          <Input
            value={rule.variable_name}
            onChange={(e) => updateRule(index, { variable_name: e.target.value })}
            placeholder="token"
            className="font-mono text-indigo-300"
          />
          <Select
            value={rule.source}
            onValueChange={(v) => updateRule(index, { source: v as ExtractionSource })}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="body">Body</SelectItem>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={rule.expression}
            onChange={(e) => updateRule(index, { expression: e.target.value })}
            placeholder="$.data.access_token"
            className="font-mono"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeRule(index)}
            className="text-slate-500 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addRule} className="text-indigo-400 hover:text-indigo-300">
        <Plus className="h-3 w-3 mr-1" />
        Add Extraction Rule
      </Button>
    </div>
  );
}
