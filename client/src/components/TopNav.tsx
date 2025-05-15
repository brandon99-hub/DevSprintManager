import React, { useState } from "react";
import { useSprintTimer } from "@/hooks/useSprintTimer";
import { Sprint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TopNavProps {
  toggleSidebar: () => void;
  activeSprint?: Sprint;
  isHackathonMode: boolean;
  toggleHackathonMode: () => void;
}

export default function TopNav({ 
  toggleSidebar, 
  activeSprint, 
  isHackathonMode, 
  toggleHackathonMode 
}: TopNavProps) {
  const [searchText, setSearchText] = useState("");
  
  const sprintTimer = activeSprint 
    ? useSprintTimer({
        startDate: activeSprint.startDate,
        endDate: activeSprint.endDate,
        isActive: activeSprint.isActive,
      }) 
    : null;

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar} 
            className="md:hidden text-slate-500 hover:text-slate-700"
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
          <div className="md:hidden flex items-center gap-2">
            <div className="bg-primary rounded-lg w-6 h-6 flex items-center justify-center text-white">
              <i className="ri-sprint-fill text-sm"></i>
            </div>
            <h1 className="text-md font-bold text-slate-900">DevSprint</h1>
          </div>
          <div className="hidden md:flex">
            <Button variant="ghost" className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
              <span>{activeSprint?.name || "No Active Sprint"}</span>
              <i className="ri-arrow-down-s-line"></i>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Hackathon Mode Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium">Hackathon Mode</span>
            <Switch 
              checked={isHackathonMode} 
              onCheckedChange={toggleHackathonMode} 
              id="hackathon-toggle"
            />
          </div>
          
          {/* Github Connect Button */}
          <Button 
            variant="outline" 
            className="hidden md:flex items-center gap-1 text-slate-600"
            size="sm"
          >
            <i className="ri-github-fill"></i>
            <span>Connected</span>
          </Button>
          
          {/* Search */}
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-9 pr-3 py-1.5 w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>
          
          {/* Sprint Timer */}
          <div className="flex items-center gap-1 text-slate-600 border border-slate-200 rounded-md px-3 py-1.5 bg-white">
            <i className="ri-time-line text-primary"></i>
            <span className="font-mono text-sm font-medium">
              {sprintTimer ? sprintTimer.formatTimer() : "No active sprint"}
            </span>
          </div>
          
          {/* User Menu */}
          <button className="relative flex items-center justify-center">
            <div 
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium" 
            >
              U
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </button>
        </div>
      </div>
    </header>
  );
}
