import { ChevronRight } from "lucide-react";
import type { BusinessService, BusinessProcess, SyntheticCheck } from "@/types/models";

interface ServiceBreadcrumbProps {
  service: BusinessService;
  process: BusinessProcess;
  check: SyntheticCheck;
}

export function ServiceBreadcrumb({
  service,
  process,
  check,
}: ServiceBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      <span className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
        {service.name}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
      <span className="text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">
        {process.name}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
      <span className="text-slate-200 font-medium">{check.name}</span>
    </nav>
  );
}
