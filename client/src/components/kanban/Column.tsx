import React from "react";
import TaskCard from "./TaskCard";
import { Task, TaskStatus } from "@/lib/types";

interface ColumnProps {
  id: TaskStatus;
  title: string;
  colorClass: string;
  tasks: Task[];
  onDragStart: (event: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent, status: TaskStatus) => void;
  refetchTasks: () => void;
}

export default function Column({
  id,
  title,
  colorClass,
  tasks,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  refetchTasks
}: ColumnProps) {
  return (
    <div 
      className="kanban-column flex flex-col bg-slate-50 rounded-xl border border-slate-200 min-w-[300px]"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, id)}
    >
      <div className="p-3 border-b border-slate-200 bg-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
            <h3 className="font-medium">{title}</h3>
          </div>
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            refetchTasks={refetchTasks}
          />
        ))}
      </div>
    </div>
  );
}
