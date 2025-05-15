import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useQuery } from "@tanstack/react-query";
import { SprintWithTasks } from "@/lib/types";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHackathonMode, setIsHackathonMode] = useState(false);
  
  const { data: activeSprint } = useQuery<SprintWithTasks>({
    queryKey: ['/api/sprints/active'],
  });
  
  const toggleHackathonMode = async () => {
    if (!activeSprint) return;
    
    try {
      const response = await fetch(`/api/sprints/${activeSprint.id}/toggle-hackathon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hackathonMode: !isHackathonMode }),
      });
      
      if (response.ok) {
        setIsHackathonMode(!isHackathonMode);
      }
    } catch (error) {
      console.error("Error toggling hackathon mode:", error);
    }
  };
  
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
        activeSprint={activeSprint}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav 
          toggleSidebar={toggleMobileSidebar} 
          activeSprint={activeSprint}
          isHackathonMode={isHackathonMode}
          toggleHackathonMode={toggleHackathonMode}
        />
        {children}
      </div>
    </div>
  );
}
