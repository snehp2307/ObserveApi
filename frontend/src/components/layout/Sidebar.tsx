import {
  Network,
  FolderTree,
  TestTubeDiagonal,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  BusinessService,
  BusinessProcess,
  SyntheticCheck,
} from "@/types/models";

interface SidebarProps {
  service: BusinessService;
  activeProcessId: string;
  activeCheckId: string;
  onSelectProcess: (id: string) => void;
  onSelectCheck: (id: string) => void;
  onAddProcess: () => void;
  onAddCheck: () => void;
  onUpdateServiceName: (name: string) => void;
  onUpdateProcessName: (id: string, name: string) => void;
  onUpdateCheckName: (id: string, name: string) => void;
}

export function Sidebar({
  service,
  activeProcessId,
  activeCheckId,
  onSelectProcess,
  onSelectCheck,
  onAddProcess,
  onAddCheck,
  onUpdateServiceName,
  onUpdateProcessName,
  onUpdateCheckName,
}: SidebarProps) {
  return (
    <aside className="w-72 border-r border-[#2a2a3e] bg-[#0c0c14]/80 backdrop-blur-xl flex flex-col shrink-0">
      {/* Logo Area */}
      <div className="p-4 border-b border-[#2a2a3e]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Network className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-200 leading-tight">
              Observe
            </h1>
            <p className="text-[10px] text-slate-500">Synthetic Monitoring</p>
          </div>
        </div>
      </div>

      {/* Service Name */}
      <div className="p-3 border-b border-[#2a2a3e]">
        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">
          Service
        </label>
        <Input
          value={service.name}
          onChange={(e) => onUpdateServiceName(e.target.value)}
          className="h-7 text-xs bg-transparent"
        />
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {service.processes.map((process) => (
            <div key={process.id}>
              {/* Process Node */}
              <button
                onClick={() => onSelectProcess(process.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  process.id === activeProcessId
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-[#1a1a2e] hover:text-slate-300"
                }`}
              >
                <FolderTree className="h-3.5 w-3.5 shrink-0" />
                <Input
                  value={process.name}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateProcessName(process.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 text-xs bg-transparent border-none shadow-none p-0 focus-visible:ring-0"
                />
              </button>

              {/* Checks under this process */}
              {process.id === activeProcessId && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-[#2a2a3e] pl-3">
                  {process.checks.map((check) => (
                    <button
                      key={check.id}
                      onClick={() => onSelectCheck(check.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        check.id === activeCheckId
                          ? "bg-indigo-500/15 text-indigo-200"
                          : "text-slate-500 hover:bg-[#1a1a2e] hover:text-slate-400"
                      }`}
                    >
                      <TestTubeDiagonal className="h-3 w-3 shrink-0" />
                      <Input
                        value={check.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateCheckName(check.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 text-xs bg-transparent border-none shadow-none p-0 focus-visible:ring-0"
                      />
                    </button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddCheck}
                    className="w-full justify-start text-[10px] text-slate-600 hover:text-indigo-400 h-6 px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Check
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddProcess}
            className="w-full justify-start text-[10px] text-slate-600 hover:text-indigo-400 h-7 px-2 mt-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Process
          </Button>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-[#2a2a3e]">
        <p className="text-[10px] text-slate-600 text-center">
          Observe API v0.1.0 — Phase 1 Prototype
        </p>
      </div>
    </aside>
  );
}
