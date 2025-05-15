import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SprintStats from "@/components/SprintStats";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import CreateTaskDialog from "@/components/dialogs/CreateTaskDialog";
import { SprintWithTasks } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const { toast } = useToast();

  const { 
    data: activeSprint,
    isLoading,
    error,
    refetch 
  } = useQuery<SprintWithTasks>({
    queryKey: ['/api/sprints/active'],
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-slate-600">Loading sprint data...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="flex-1 p-8">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load sprint data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }
  
  const handleCreateSprint = async () => {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + 14); // 2 weeks sprint
      
      await fetch('/api/sprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Sprint',
          description: 'A new development sprint',
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
          isActive: true,
          hackathonMode: false,
        }),
      });
      
      refetch();
      toast({
        title: 'Success',
        description: 'New sprint created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new sprint',
        variant: 'destructive',
      });
    }
  };

  // No active sprint
  if (!activeSprint) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full text-center">
            <div className="mb-4 text-slate-400">
              <i className="ri-sprint-fill text-5xl"></i>
            </div>
            <h2 className="text-xl font-bold mb-2">No Active Sprint</h2>
            <p className="text-slate-600 mb-6">
              There is no active sprint. Create a new sprint to start tracking tasks.
            </p>
            <Button onClick={handleCreateSprint}>
              <i className="ri-add-line mr-2"></i>
              Create New Sprint
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SprintStats 
        tasks={activeSprint.tasks} 
        activeSprint={activeSprint}
        onNewTask={() => setIsCreateTaskOpen(true)} 
      />
      
      <KanbanBoard 
        tasks={activeSprint.tasks}
        sprintId={activeSprint.id}
        refetchTasks={refetch}
      />
      
      <CreateTaskDialog 
        isOpen={isCreateTaskOpen} 
        onClose={() => setIsCreateTaskOpen(false)} 
        sprintId={activeSprint.id}
        onTaskCreated={refetch}
      />
    </Layout>
  );
}
