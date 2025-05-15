import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export default function GithubPRs() {
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Filter tasks with GitHub PR URLs
  const tasksWithPRs = tasks.filter(task => task.githubPrUrl);

  return (
    <Layout>
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">GitHub Pull Requests</h1>
        
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tasksWithPRs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <i className="ri-github-fill text-3xl text-slate-500"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No Pull Requests Found</h3>
              <p className="text-slate-500 text-center max-w-md">
                There are no tasks linked to GitHub pull requests yet. Create a task with a GitHub PR link to see it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasksWithPRs.map(task => (
              <Card key={task.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    <div className={`text-xs px-2 py-0.5 rounded font-medium
                      ${task.status === 'inprogress' ? 'bg-blue-100 text-blue-600' : ''}
                      ${task.status === 'review' ? 'bg-purple-100 text-purple-600' : ''}
                      ${task.status === 'done' ? 'bg-green-100 text-green-600' : ''}
                      ${task.status === 'todo' ? 'bg-yellow-100 text-yellow-600' : ''}
                      ${task.status === 'backlog' ? 'bg-slate-100 text-slate-600' : ''}
                    `}>
                      {task.status === 'inprogress' ? 'In Progress' : 
                       task.status === 'todo' ? 'To-Do' : 
                       task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-col sm:flex-row sm:items-center">
                    <div className="flex-1">
                      {task.description && (
                        <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <i className="ri-github-fill text-slate-700"></i>
                        <a 
                          href={task.githubPrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Pull Request #{task.githubPrNumber}
                        </a>
                      </div>
                      
                      {task.ciStatus && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <div className={`w-2 h-2 rounded-full 
                            ${task.ciStatus === 'success' || task.ciStatus === 'merged' ? 'bg-green-500' : ''}
                            ${task.ciStatus === 'pending' || task.ciStatus === 'running' ? 'bg-yellow-500' : ''}
                            ${task.ciStatus === 'failed' ? 'bg-red-500' : ''}
                            ${task.ciStatus === 'closed' ? 'bg-slate-500' : ''}
                          `}></div>
                          <span>
                            {task.ciStatus === 'success' ? 'CI Passing' : 
                             task.ciStatus === 'merged' ? 'Merged' :
                             task.ciStatus === 'pending' ? 'CI Pending' :
                             task.ciStatus === 'running' ? 'CI Running' :
                             task.ciStatus === 'failed' ? 'CI Failed' :
                             task.ciStatus === 'closed' ? 'Closed' :
                             task.ciStatus}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Separator orientation="vertical" className="hidden sm:block h-16" />
                    
                    <div className="sm:w-48">
                      <div className="text-xs text-slate-500 mb-1">Assigned to</div>
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            {task.assignee.avatar ? (
                              <img
                                src={task.assignee.avatar}
                                alt={task.assignee.name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                                {task.assignee.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-medium">{task.assignee.name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">Unassigned</span>
                        )}
                      </div>
                      
                      {task.deployments && task.deployments.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs">
                          <div className={`w-1.5 h-1.5 rounded-full 
                            ${task.deployments[0].status === 'success' ? 'bg-green-500' : ''}
                            ${task.deployments[0].status === 'pending' || task.deployments[0].status === 'running' ? 'bg-yellow-500' : ''}
                            ${task.deployments[0].status === 'failed' || task.deployments[0].status === 'canceled' ? 'bg-red-500' : ''}
                          `}></div>
                          <span>
                            {task.deployments[0].status === 'success' ? 'Deployed' : 
                             task.deployments[0].status.charAt(0).toUpperCase() + task.deployments[0].status.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
