import { useState, useEffect, useCallback } from "react";

interface UseSprintTimerProps {
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  percentage: number;
}

export function useSprintTimer({ startDate, endDate, isActive }: UseSprintTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
    percentage: 0,
  });

  const calculateTimeRemaining = useCallback(() => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate if sprint has started yet
    if (now < start) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
        percentage: 0,
      };
    }
    
    // Calculate if sprint has ended
    if (now >= end) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true,
        percentage: 100,
      };
    }
    
    // Calculate remaining time
    const totalDuration = end.getTime() - start.getTime();
    const timeElapsed = now.getTime() - start.getTime();
    const percentageComplete = (timeElapsed / totalDuration) * 100;
    
    const remainingTime = end.getTime() - now.getTime();
    
    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    
    return {
      days,
      hours,
      minutes,
      seconds,
      expired: false,
      percentage: percentageComplete,
    };
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isActive) {
      setTimeRemaining({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
        percentage: 0,
      });
      return;
    }
    
    setTimeRemaining(calculateTimeRemaining());
    
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, calculateTimeRemaining]);

  const formatTimer = () => {
    const { days, hours, minutes, seconds, expired } = timeRemaining;
    
    if (expired) {
      return "Sprint completed";
    }
    
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    ...timeRemaining,
    formatTimer,
  };
}
