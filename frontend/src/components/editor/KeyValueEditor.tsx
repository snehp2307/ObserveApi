import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  const addPair = () => {
    onChange([...pairs, { key: "", value: "" }]);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  const updatePair = (index: number, field: "key" | "value", val: string) => {
    onChange(
      pairs.map((p, i) => (i === index ? { ...p, [field]: val } : p))
    );
  };

  return (
    <div className="space-y-2">
      {pairs.map((pair, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={pair.key}
            onChange={(e) => updatePair(index, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1"
          />
          <Input
            value={pair.value}
            onChange={(e) => updatePair(index, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removePair(index)}
            className="shrink-0 text-slate-500 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addPair} className="text-indigo-400 hover:text-indigo-300">
        <Plus className="h-3 w-3 mr-1" />
        Add Pair
      </Button>
    </div>
  );
}

// Utility to convert between Record<string,string> and KeyValuePair[]
export function recordToPairs(record: Record<string, string>): KeyValuePair[] {
  return Object.entries(record).map(([key, value]) => ({ key, value }));
}

export function pairsToRecord(pairs: KeyValuePair[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const pair of pairs) {
    if (pair.key.trim()) {
      record[pair.key] = pair.value;
    }
  }
  return record;
}
