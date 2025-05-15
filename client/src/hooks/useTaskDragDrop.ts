import { useState } from "react";
import { Task, TaskStatus } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useTaskDragDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragStart = (event: React.DragEvent, task: Task) => {
    setIsDragging(true);
    event.dataTransfer.setData("application/json", JSON.stringify(task));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (event: React.DragEvent, targetStatus: TaskStatus) => {
    event.preventDefault();
    
    try {
      const taskJson = event.dataTransfer.getData("application/json");
      if (!taskJson) return;
      
      const task: Task = JSON.parse(taskJson);
      
      // Don't do anything if dropping in the same column
      if (task.status === targetStatus) return;
      
      // Optimistically update the UI
      await queryClient.cancelQueries({ queryKey: ['/api/sprints/active'] });
      
      // Get the previous data to rollback in case of error
      const previousData = queryClient.getQueryData<any>(['/api/sprints/active']);
      
      // Optimistically update cached data
      if (previousData && previousData.tasks) {
        queryClient.setQueryData(['/api/sprints/active'], {
          ...previousData,
          tasks: previousData.tasks.map((t: Task) => 
            t.id === task.id ? { ...t, status: targetStatus } : t
          ),
        });
      }
      
      // Make the API call to update the task status
      await apiRequest("PATCH", `/api/tasks/${task.id}/status`, { status: targetStatus });
      
      // Invalidate queries to refetch the data
      await queryClient.invalidateQueries({ queryKey: ['/api/sprints/active'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDragging(false);
    }
  };

  return {
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}
