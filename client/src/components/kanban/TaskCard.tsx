import React from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Task, TaskType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface TaskCardProps {
  task: Task;
  onDragStart: (event: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  refetchTasks: () => void;
}

export default function TaskCard({ task, onDragStart, onDragEnd, refetchTasks }: TaskCardProps) {
  const { toast } = useToast();

  const getTypeLabel = (type: TaskType) => {
    const typeMap: Record<TaskType, { label: string, classes: string }> = {
      frontend: { label: 'Frontend', classes: 'bg-blue-100 text-blue-600' },
      backend: { label: 'Backend', classes: 'bg-yellow-100 text-yellow-600' },
      integration: { label: 'Integration', classes: 'bg-violet-100 text-violet-600' },
      research: { label: 'Research', classes: 'bg-slate-100 text-slate-600' },
      bugfix: { label: 'Bug Fix', classes: 'bg-red-100 text-red-600' },
      design: { label: 'Design', classes: 'bg-pink-100 text-pink-600' },
      documentation: { label: 'Docs', classes: 'bg-green-100 text-green-600' },
      testing: { label: 'Testing', classes: 'bg-amber-100 text-amber-600' },
      other: { label: 'Other', classes: 'bg-slate-100 text-slate-600' }
    };
    
    return typeMap[type] || typeMap.other;
  };
  
  const getDueDateText = () => {
    if (!task.dueDate) return 'No due date';
    
    const dueDate = new Date(task.dueDate);
    
    if (isPast(dueDate) && task.status !== 'done') {
      return `Overdue by ${formatDistanceToNow(dueDate)}`;
    } else if (task.status === 'done') {
      return 'Completed';
    } else {
      return `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`;
    }
  };
  
  const handleDelete = async () => {
    try {
      await apiRequest('DELETE', `/api/tasks/${task.id}`);
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
      refetchTasks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const typeInfo = getTypeLabel(task.type);
  
  return (
    <div
      className="task-card bg-white p-3 rounded-lg border border-slate-200 cursor-grab"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-medium ${typeInfo.classes} px-1.5 py-0.5 rounded`}>
          {typeInfo.label}
        </span>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-slate-400 hover:text-slate-600">
                <i className="ri-more-2-fill"></i>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onClick={handleDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <h4 className="font-medium mb-2">{task.title}</h4>
      
      {task.description && (
        <p className="text-sm text-slate-600 mb-3">{task.description}</p>
      )}
      
      {task.progress !== undefined && task.progress > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium">{task.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {(task.githubPrUrl || task.ciStatus) && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {task.githubPrUrl && (
            <a
              href={task.githubPrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <i className="ri-github-fill"></i>
              <span>PR #{task.githubPrNumber || '?'}</span>
            </a>
          )}
          
          {task.ciStatus && (
            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded
              ${task.ciStatus === 'success' || task.ciStatus === 'merged' ? 'bg-green-100 text-green-600' : ''}
              ${task.ciStatus === 'pending' || task.ciStatus === 'running' ? 'bg-amber-100 text-amber-600' : ''}
              ${task.ciStatus === 'failed' ? 'bg-red-100 text-red-600' : ''}
              ${task.ciStatus === 'closed' ? 'bg-slate-100 text-slate-600' : ''}
            `}>
              {task.ciStatus === 'success' || task.ciStatus === 'merged' ? <i className="ri-check-line"></i> : null}
              {task.ciStatus === 'pending' || task.ciStatus === 'running' ? <i className="ri-loader-4-line"></i> : null}
              {task.ciStatus === 'failed' ? <i className="ri-close-line"></i> : null}
              {task.ciStatus === 'closed' ? <i className="ri-git-pull-request-line"></i> : null}
              <span>{task.ciStatus === 'merged' ? 'Merged' : task.ciStatus.charAt(0).toUpperCase() + task.ciStatus.slice(1)}</span>
            </div>
          )}
          
          {task.deployments && task.deployments.length > 0 && task.deployments[0].status && (
            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded
              ${task.deployments[0].status === 'success' ? 'bg-green-100 text-green-600' : ''}
              ${task.deployments[0].status === 'pending' || task.deployments[0].status === 'running' ? 'bg-amber-100 text-amber-600' : ''}
              ${task.deployments[0].status === 'failed' || task.deployments[0].status === 'canceled' ? 'bg-red-100 text-red-600' : ''}
            `}>
              {task.deployments[0].status === 'success' ? <i className="ri-rocket-line"></i> : null}
              {task.deployments[0].status === 'pending' || task.deployments[0].status === 'running' ? <i className="ri-loader-4-line"></i> : null}
              {task.deployments[0].status === 'failed' || task.deployments[0].status === 'canceled' ? <i className="ri-close-line"></i> : null}
              <span>
                {task.deployments[0].status === 'success' ? 'Deployed' : 
                 task.deployments[0].status.charAt(0).toUpperCase() + task.deployments[0].status.slice(1)}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500">
          <i className="ri-calendar-line"></i>
          <span>{getDueDateText()}</span>
        </div>
        
        {task.assignee && (
          <div>
            {task.assignee.avatar ? (
              <img
                src={task.assignee.avatar}
                alt={task.assignee.name}
                className="w-6 h-6 rounded-full border border-white"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                {task.assignee.name.charAt(0)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
