import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SprintStats from "@/components/SprintStats";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import CreateTaskDialog from "@/components/dialogs/CreateTaskDialog";
import PitchGeneratorDialog from "@/components/dialogs/PitchGeneratorDialog";
import ActivityFeed from "@/components/ActivityFeed";
import { SprintWithTasks } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Presentation } from "lucide-react";

export default function Dashboard() {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isPitchGeneratorOpen, setIsPitchGeneratorOpen] = useState(false);
  const { toast } = useToast();

  const { 
    data: activeSprint,
    isLoading,
    error,
    refetch 
  } = useQuery<SprintWithTasks>({
    queryKey: ['/api/sprints/active'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/sprints/active');
        if (res.status === 404) {
          // Expected for no active sprint
          return null;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch active sprint');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching active sprint:', error);
        throw error;
      }
    }
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
      <div className="flex justify-between items-center px-6 mt-2 mb-4">
        <div></div> {/* Empty div for flex spacing */}
        
        {activeSprint.hackathonMode && (
          <Button 
            variant="outline"
            onClick={() => setIsPitchGeneratorOpen(true)}
            className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 border-0"
          >
            <Presentation className="h-4 w-4" />
            Generate Pitch Deck
          </Button>
        )}
      </div>
      
      <SprintStats 
        tasks={activeSprint.tasks} 
        activeSprint={activeSprint}
        onNewTask={() => setIsCreateTaskOpen(true)} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-6 mb-6">
        <div className="lg:col-span-3">
          <KanbanBoard 
            tasks={activeSprint.tasks}
            sprintId={activeSprint.id}
            refetchTasks={refetch}
          />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
      
      <CreateTaskDialog 
        isOpen={isCreateTaskOpen} 
        onClose={() => setIsCreateTaskOpen(false)} 
        sprintId={activeSprint.id}
        onTaskCreated={refetch}
      />
      
      {activeSprint.hackathonMode && (
        <PitchGeneratorDialog
          isOpen={isPitchGeneratorOpen}
          onClose={() => setIsPitchGeneratorOpen(false)}
          sprintId={activeSprint.id}
        />
      )}
    </Layout>
  );
}
