import React from "react";
import { Link, useLocation } from "wouter";
import { Sprint } from "@/lib/types";
import { useSprintTimer } from "@/hooks/useSprintTimer";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSprint?: Sprint;
}

export default function Sidebar({ isOpen, onClose, activeSprint }: SidebarProps) {
  const [location] = useLocation();
  
  const sprintTimer = activeSprint 
    ? useSprintTimer({
        startDate: activeSprint.startDate,
        endDate: activeSprint.endDate,
        isActive: activeSprint.isActive,
      }) 
    : null;
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: "ri-dashboard-line" },
    { path: "/github-prs", label: "GitHub PRs", icon: "ri-git-branch-line" },
    { path: "/team", label: "Team", icon: "ri-group-line" },
    { path: "/focus", label: "Focus Mode", icon: "ri-timer-line" },
    { path: "/sprint-history", label: "Sprint History", icon: "ri-history-line" },
    { path: "/settings", label: "Settings", icon: "ri-settings-line" },
  ];

  const sidebarClasses = isOpen 
    ? "fixed inset-0 z-40 md:relative md:flex flex-col w-64 bg-white border-r border-slate-200 h-full"
    : "hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full";

  return (
    <aside className={sidebarClasses}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-primary rounded-lg w-8 h-8 flex items-center justify-center text-white">
            <i className="ri-sprint-fill text-lg"></i>
          </div>
          <h1 className="text-xl font-bold text-slate-900">DevSprint Planner</h1>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => {
                if (isOpen) onClose();
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                location === item.path
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-600 hover:bg-slate-100 transition-colors"
              }`}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      {activeSprint && (
        <div className="mt-auto p-4 border-t border-slate-200">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <h3 className="font-medium text-sm">Current Sprint</h3>
            </div>
            
            <div className="mb-2">
              <p className="text-xs text-slate-500">{activeSprint.name}</p>
              <p className="font-medium">{activeSprint.description || 'No description'}</p>
            </div>
            
            {sprintTimer && (
              <>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${sprintTimer.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-slate-500">{Math.round(sprintTimer.percentage)}% Complete</p>
                  <p className="text-xs font-medium">
                    {sprintTimer.expired
                      ? "Completed"
                      : `${sprintTimer.days}d ${sprintTimer.hours}h left`}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
