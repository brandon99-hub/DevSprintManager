import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { User, Task } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface TeamMemberWithTasks extends User {
  assignedTasks: Task[];
  completedTasks: number;
}

export default function Team() {
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  // Process the data to associate tasks with users
  const teamMembers: TeamMemberWithTasks[] = users.map(user => {
    const assignedTasks = tasks.filter(task => task.assigneeId === user.id);
    const completedTasks = assignedTasks.filter(task => task.status === 'done').length;
    
    return {
      ...user,
      assignedTasks,
      completedTasks
    };
  });
  
  const isLoading = usersLoading || tasksLoading;

  return (
    <Layout>
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Team</h1>
        
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : teamMembers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <i className="ri-user-add-line text-3xl text-slate-500"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No Team Members Found</h3>
              <p className="text-slate-500 text-center max-w-md">
                There are no team members added yet. Add team members to start collaborating on tasks.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map(member => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{member.name}</CardTitle>
                      <p className="text-sm text-slate-500">
                        {member.githubUsername ? `@${member.githubUsername}` : member.email}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Tasks Progress</span>
                        <span className="font-medium">
                          {member.assignedTasks.length > 0 
                            ? `${member.completedTasks}/${member.assignedTasks.length}`
                            : '0/0'}
                        </span>
                      </div>
                      <Progress 
                        value={member.assignedTasks.length > 0 
                          ? (member.completedTasks / member.assignedTasks.length) * 100 
                          : 0
                        } 
                      />
                    </div>
                    
                    <div className="pt-3">
                      <h4 className="text-sm font-medium mb-2">Recent Tasks</h4>
                      {member.assignedTasks.length > 0 ? (
                        <div className="space-y-2">
                          {member.assignedTasks.slice(0, 3).map(task => (
                            <div 
                              key={task.id} 
                              className="flex items-center justify-between p-2 bg-slate-50 rounded-md"
                            >
                              <span className="text-sm truncate flex-1">{task.title}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium
                                ${task.status === 'inprogress' ? 'bg-blue-100 text-blue-600' : ''}
                                ${task.status === 'review' ? 'bg-purple-100 text-purple-600' : ''}
                                ${task.status === 'done' ? 'bg-green-100 text-green-600' : ''}
                                ${task.status === 'todo' ? 'bg-yellow-100 text-yellow-600' : ''}
                                ${task.status === 'backlog' ? 'bg-slate-100 text-slate-600' : ''}
                              `}>
                                {task.status === 'inprogress' ? 'In Progress' : 
                                 task.status === 'todo' ? 'To-Do' : 
                                 task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </span>
                            </div>
                          ))}
                          {member.assignedTasks.length > 3 && (
                            <p className="text-xs text-center text-slate-500 pt-1">
                              +{member.assignedTasks.length - 3} more tasks
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No tasks assigned</p>
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
