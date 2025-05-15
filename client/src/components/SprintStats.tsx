import React, { useMemo } from "react";
import { Task, TaskStatus, ColumnStats } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface SprintStatsProps {
  tasks: Task[];
  activeSprint?: {
    name: string;
    description?: string;
  };
  onNewTask: () => void;
}

export default function SprintStats({ tasks, activeSprint, onNewTask }: SprintStatsProps) {
  const columnStats: ColumnStats = useMemo(() => {
    return tasks.reduce(
      (stats, task) => {
        stats[task.status]++;
        return stats;
      },
      {
        backlog: 0,
        todo: 0,
        inprogress: 0,
        review: 0,
        done: 0,
      }
    );
  }, [tasks]);

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">Sprint</span>
            <span className="font-medium">{activeSprint?.name || "No Active Sprint"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              <span className="text-slate-600">{columnStats.backlog} Backlog</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-warning"></div>
              <span className="text-slate-600">{columnStats.todo} To-Do</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-slate-600">{columnStats.inprogress} In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <span className="text-slate-600">{columnStats.review} Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-slate-600">{columnStats.done} Done</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-slate-600">
            <i className="ri-filter-3-line mr-1"></i> Filter
          </Button>
          <Button onClick={onNewTask} size="sm" className="bg-primary text-white">
            <i className="ri-add-line mr-1"></i> New Task
          </Button>
        </div>
      </div>
    </div>
  );
}
