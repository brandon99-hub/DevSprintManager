import React, { useState } from "react";
import Column from "./Column";
import { Task, TaskStatus } from "@/lib/types";
import { useTaskDragDrop } from "@/hooks/useTaskDragDrop";
import CreateTaskDialog from "../dialogs/CreateTaskDialog";

interface KanbanBoardProps {
  tasks: Task[];
  sprintId?: number;
  refetchTasks: () => void;
}

export default function KanbanBoard({ 
  tasks, 
  sprintId,
  refetchTasks
}: KanbanBoardProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const { isDragging, handleDragStart, handleDragEnd, handleDragOver, handleDrop } = useTaskDragDrop();

  const columns = [
    { id: 'backlog' as TaskStatus, title: 'Backlog', colorClass: 'bg-slate-300' },
    { id: 'todo' as TaskStatus, title: 'To-Do', colorClass: 'bg-warning' },
    { id: 'inprogress' as TaskStatus, title: 'In Progress', colorClass: 'bg-primary' },
    { id: 'review' as TaskStatus, title: 'Review', colorClass: 'bg-secondary' },
    { id: 'done' as TaskStatus, title: 'Done', colorClass: 'bg-success' }
  ];

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <>
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex p-4 h-full gap-5 min-w-max">
          {columns.map(column => (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              colorClass={column.colorClass}
              tasks={getTasksByStatus(column.id)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              refetchTasks={refetchTasks}
            />
          ))}
        </div>
      </div>

      <CreateTaskDialog 
        isOpen={isCreateTaskOpen} 
        onClose={() => setIsCreateTaskOpen(false)} 
        sprintId={sprintId}
        onTaskCreated={refetchTasks}
      />
    </>
  );
}
