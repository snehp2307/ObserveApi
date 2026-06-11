import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { useWorkflow } from "@/hooks/useWorkflow";

export default function App() {
  const workflow = useWorkflow();

  return (
    <TooltipProvider delayDuration={200}>
      <AppShell
        sidebar={
          <Sidebar
            service={workflow.service}
            activeProcessId={workflow.activeProcess.id}
            activeCheckId={workflow.activeCheck.id}
            onSelectProcess={workflow.selectProcess}
            onSelectCheck={workflow.selectCheck}
            onAddProcess={workflow.addProcess}
            onAddCheck={workflow.addCheck}
            onUpdateServiceName={workflow.updateServiceName}
            onUpdateProcessName={workflow.updateProcessName}
            onUpdateCheckName={workflow.updateCheckName}
          />
        }
      >
        <Dashboard workflow={workflow} />
      </AppShell>
    </TooltipProvider>
  );
}
