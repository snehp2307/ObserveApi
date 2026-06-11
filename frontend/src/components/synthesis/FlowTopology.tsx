import { ArrowRight, Box } from "lucide-react";
import type { HttpMethod } from "@/types/models";

const methodColor: Record<string, string> = {
  GET: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  POST: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  PATCH: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

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

interface FlowTopologyProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export function FlowTopology({ nodes, edges }: FlowTopologyProps) {
  if (nodes.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#2a2a3e] bg-[#0c0c14] p-6 overflow-x-auto relative min-h-[200px] flex items-center animate-fade-in">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Box className="h-4 w-4 text-indigo-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Agent-Inferred Topology
        </h3>
      </div>

      <div className="flex items-center gap-12 mt-6 mx-auto w-max px-8">
        {nodes.map((node, i) => {
          // Find if there's an edge pointing from this node to the next
          const connectingEdge = edges.find(
            (e) => e.source === node.id && e.target === `step-${i + 1}`
          );

          return (
            <div key={node.id} className="flex items-center">
              {/* Node Card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur-sm"></div>
                <div className="relative w-48 h-24 bg-[#12121a] border border-[#2a2a3e] rounded-lg p-3 flex flex-col shadow-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${
                        methodColor[node.method] || "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {node.method}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {node.label}
                    </span>
                  </div>
                  <div className="mt-auto">
                    <p className="text-[10px] text-slate-500 font-mono truncate" title={node.url}>
                      {node.url}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edge (if not last node) */}
              {i < nodes.length - 1 && (
                <div className="w-12 flex flex-col items-center justify-center shrink-0 relative">
                  <div className="h-0.5 w-full bg-[#2a2a3e] relative">
                    {/* Animated flow effect */}
                    {connectingEdge && (
                      <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 animate-pulse" />
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#3a3a4e] absolute bg-[#0c0c14]" />
                  
                  {connectingEdge && (
                    <div className="absolute -top-6 whitespace-nowrap bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[10px] text-indigo-300 font-mono shadow-sm">
                      {`{{${connectingEdge.variableName}}}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
