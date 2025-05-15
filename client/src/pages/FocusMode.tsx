import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import FocusMode from '@/components/FocusMode';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/lib/types';

export default function FocusModePage() {
  const { toast } = useToast();
  
  // Load personal tasks (tasks assigned to current user)
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks/personal'],
    select: (data) => data.filter(task => task.status !== 'done'),
  });
  
  // Mutation to mark a task as complete
  const markTaskCompleted = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest(
        'PATCH',
        `/api/tasks/${taskId}/status`,
        { status: 'done' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/personal'] });
      
      toast({
        title: 'Task completed',
        description: 'Great job! Task marked as done.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
    },
  });
  
  const handleTaskComplete = (taskId: number) => {
    markTaskCompleted.mutate(taskId);
  };
  
  return (
    <Layout>
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Focus Mode</h1>
          <p className="text-muted-foreground">
            Enhance your productivity with focused work sessions
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <FocusMode onTaskComplete={handleTaskComplete} />
          </div>
          
          <div>
            <Tabs defaultValue="personal">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Personal Tasks</TabsTrigger>
                <TabsTrigger value="tips">Focus Tips</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4">
                {tasks.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">
                        No personal tasks assigned to you. Tasks assigned to you will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  tasks.map(task => (
                    <Card key={task.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-between items-center">
                        <div className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${task.status === 'inprogress' ? 'bg-blue-100 text-blue-600' : ''}
                          ${task.status === 'review' ? 'bg-purple-100 text-purple-600' : ''}
                          ${task.status === 'todo' ? 'bg-yellow-100 text-yellow-600' : ''}
                          ${task.status === 'backlog' ? 'bg-slate-100 text-slate-600' : ''}
                        `}>
                          {task.status === 'inprogress' ? 'In Progress' : 
                           task.status === 'todo' ? 'To-Do' : 
                           task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </div>
                        <button
                          onClick={() => handleTaskComplete(task.id)}
                          className="text-xs font-medium hover:underline"
                        >
                          Mark Complete
                        </button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="tips">
                <Card>
                  <CardHeader>
                    <CardTitle>Tips for Better Focus</CardTitle>
                    <CardDescription>
                      Get the most out of your focus sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium">The Pomodoro Technique</h3>
                      <p className="text-sm text-muted-foreground">
                        Work in focused sprints (typically 25 minutes) followed by short breaks (5 minutes).
                        After 4 pomodoros, take a longer break (15-30 minutes).
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Minimize Distractions</h3>
                      <p className="text-sm text-muted-foreground">
                        Close unnecessary tabs, put your phone away, and consider using "Do Not Disturb" mode.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Clear Goals</h3>
                      <p className="text-sm text-muted-foreground">
                        Before starting a focus session, write down exactly what you want to accomplish.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Take Real Breaks</h3>
                      <p className="text-sm text-muted-foreground">
                        During breaks, step away from your computer. Stretch, hydrate, or take a short walk.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Track Your Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        Keep a log of your focus sessions and what you accomplished to build momentum.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}