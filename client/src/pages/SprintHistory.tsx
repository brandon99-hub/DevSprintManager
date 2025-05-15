import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Sprint, Task } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { format, formatDistanceToNow, isFuture, isPast } from "date-fns";

export default function SprintHistory() {
  const { data: sprints = [], isLoading: sprintsLoading } = useQuery<Sprint[]>({
    queryKey: ['/api/sprints'],
  });
  
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  const isLoading = sprintsLoading || tasksLoading;
  
  const getSprintStatus = (sprint: Sprint) => {
    const now = new Date();
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    
    if (now < startDate) return "upcoming";
    if (now > endDate) return "completed";
    return "active";
  };
  
  const getSprintProgress = (sprint: Sprint) => {
    const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
    const completedTasks = sprintTasks.filter(task => task.status === 'done');
    return sprintTasks.length > 0 ? (completedTasks.length / sprintTasks.length) * 100 : 0;
  };
  
  const getSprintTaskCounts = (sprint: Sprint) => {
    const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
    return {
      total: sprintTasks.length,
      completed: sprintTasks.filter(task => task.status === 'done').length
    };
  };
  
  const getSprintTimePeriod = (sprint: Sprint) => {
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    
    const formattedStart = format(startDate, "MMM d, yyyy");
    const formattedEnd = format(endDate, "MMM d, yyyy");
    
    return `${formattedStart} - ${formattedEnd}`;
  };
  
  const getTimeRemaining = (sprint: Sprint) => {
    const now = new Date();
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    
    if (now < startDate) {
      return `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`;
    }
    
    if (now > endDate) {
      return `Completed ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    }
    
    return `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`;
  };

  return (
    <Layout>
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Sprint History</h1>
        
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sprints.length === 0 ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <i className="ri-history-line text-3xl text-slate-500"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No Sprints Found</h3>
              <p className="text-slate-500 text-center max-w-md">
                There are no sprints created yet. Create a sprint to start tracking your team's progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sprints.map(sprint => {
              const status = getSprintStatus(sprint);
              const progress = getSprintProgress(sprint);
              const taskCounts = getSprintTaskCounts(sprint);
              
              return (
                <Card key={sprint.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{sprint.name}</CardTitle>
                          <div className={`text-xs px-2 py-0.5 rounded font-medium
                            ${status === 'active' ? 'bg-blue-100 text-blue-600' : ''}
                            ${status === 'completed' ? 'bg-green-100 text-green-600' : ''}
                            ${status === 'upcoming' ? 'bg-yellow-100 text-yellow-600' : ''}
                          `}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                          
                          {sprint.hackathonMode && (
                            <div className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded font-medium">
                              Hackathon
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{getSprintTimePeriod(sprint)}</p>
                      </div>
                      <div className="text-sm font-medium">
                        {getTimeRemaining(sprint)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sprint.description && (
                        <p className="text-sm text-slate-600">{sprint.description}</p>
                      )}
                      
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Progress</span>
                          <span className="font-medium">
                            {taskCounts.completed}/{taskCounts.total} tasks completed
                          </span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      
                      <div className="pt-2 flex flex-wrap gap-3">
                        <div className="px-3 py-1.5 bg-slate-100 rounded text-sm flex items-center gap-1.5">
                          <i className="ri-calendar-line text-slate-500"></i>
                          <span>
                            {formatDistanceToNow(new Date(sprint.endDate), { addSuffix: false })} duration
                          </span>
                        </div>
                        
                        <div className="px-3 py-1.5 bg-slate-100 rounded text-sm flex items-center gap-1.5">
                          <i className="ri-list-check text-slate-500"></i>
                          <span>{taskCounts.total} total tasks</span>
                        </div>
                        
                        {sprint.isActive && (
                          <div className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded text-sm flex items-center gap-1.5">
                            <i className="ri-focus-3-line"></i>
                            <span>Current Sprint</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
