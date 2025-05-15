import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Bell, Clock, Focus, Pause, Play, RefreshCcw, SkipForward } from 'lucide-react';

type PomodoroStatus = 'idle' | 'focus' | 'break' | 'longBreak';

interface FocusModeProps {
  onTaskComplete?: (taskId: number) => void;
}

export default function FocusMode({ onTaskComplete }: FocusModeProps) {
  // Pomodoro settings
  const [focusDuration, setFocusDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [longBreakDuration, setLongBreakDuration] = useState(15); // minutes
  const [pomodorosUntilLongBreak, setPomodorosUntilLongBreak] = useState(4);
  
  // Pomodoro state
  const [status, setStatus] = useState<PomodoroStatus>('idle');
  const [timeRemaining, setTimeRemaining] = useState(focusDuration * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Fetch tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    select: (data) => data.filter(task => task.status !== 'done'),
  });
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    let totalDuration = 0;
    
    switch (status) {
      case 'focus':
        totalDuration = focusDuration * 60;
        break;
      case 'break':
        totalDuration = breakDuration * 60;
        break;
      case 'longBreak':
        totalDuration = longBreakDuration * 60;
        break;
      default:
        return 0;
    }
    
    return Math.floor(((totalDuration - timeRemaining) / totalDuration) * 100);
  }, [focusDuration, breakDuration, longBreakDuration, status, timeRemaining]);
  
  // Start a focus session
  const startFocus = useCallback(() => {
    setStatus('focus');
    setTimeRemaining(focusDuration * 60);
    setIsRunning(true);
  }, [focusDuration]);
  
  // Start a break
  const startBreak = useCallback(() => {
    if (completedPomodoros % pomodorosUntilLongBreak === 0 && completedPomodoros > 0) {
      setStatus('longBreak');
      setTimeRemaining(longBreakDuration * 60);
    } else {
      setStatus('break');
      setTimeRemaining(breakDuration * 60);
    }
    setIsRunning(autoStartBreaks);
  }, [breakDuration, longBreakDuration, completedPomodoros, pomodorosUntilLongBreak, autoStartBreaks]);
  
  // Skip the current timer
  const skipTimer = useCallback(() => {
    if (status === 'focus') {
      setCompletedPomodoros(prev => prev + 1);
      startBreak();
    } else {
      startFocus();
    }
  }, [status, startBreak, startFocus]);
  
  // Reset the timer
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setStatus('idle');
    setTimeRemaining(focusDuration * 60);
    setCompletedPomodoros(0);
  }, [focusDuration]);
  
  // Handle timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeRemaining === 0) {
      // Timer completed
      if (status === 'focus') {
        // Focus session completed
        setCompletedPomodoros(prev => prev + 1);
        setNotificationMessage('Focus session completed! Time for a break.');
        setShowNotification(true);
        startBreak();
      } else {
        // Break completed
        setNotificationMessage('Break completed! Ready to focus again?');
        setShowNotification(true);
        if (autoStartPomodoros) {
          startFocus();
        } else {
          setIsRunning(false);
          setStatus('idle');
          setTimeRemaining(focusDuration * 60);
        }
      }
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, status, autoStartPomodoros, startBreak, startFocus, focusDuration]);
  
  // Get the current task
  const currentTask = tasks.find(task => task.id.toString() === selectedTaskId);
  
  // Handle task completion
  const handleTaskComplete = () => {
    if (selectedTaskId && onTaskComplete) {
      onTaskComplete(Number(selectedTaskId));
      setSelectedTaskId('');
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Focus Mode</CardTitle>
        <CardDescription>
          Use the Pomodoro Technique to enhance your productivity
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold font-mono mb-2">
            {formatTime(timeRemaining)}
          </div>
          
          <div className="w-full mb-2">
            <Progress value={calculateProgress()} className="h-2" />
          </div>
          
          <div className="text-sm text-muted-foreground mb-4">
            {status === 'focus' ? 'Focus Session' : 
             status === 'break' ? 'Short Break' : 
             status === 'longBreak' ? 'Long Break' : 
             'Ready to Focus'}
          </div>
          
          <div className="flex space-x-2 mb-6">
            {isRunning ? (
              <Button size="sm" variant="outline" onClick={() => setIsRunning(false)}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            ) : (
              <Button size="sm" onClick={() => {
                if (status === 'idle') {
                  startFocus();
                } else {
                  setIsRunning(true);
                }
              }}>
                <Play className="h-4 w-4 mr-1" />
                {status === 'idle' ? 'Start Focus' : 'Resume'}
              </Button>
            )}
            
            <Button size="sm" variant="outline" onClick={skipTimer}>
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
            
            <Button size="sm" variant="outline" onClick={resetTimer}>
              <RefreshCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        
        {/* Task Selection */}
        <div className="space-y-2">
          <Label htmlFor="task-select">Current Task</Label>
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a task to focus on" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map(task => (
                <SelectItem key={task.id} value={task.id.toString()}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {currentTask && (
            <div className="flex mt-2 justify-between items-center">
              <div className="text-sm">Currently working on:</div>
              <div className="font-medium text-sm truncate max-w-[200px]">{currentTask.title}</div>
              <Button size="sm" variant="ghost" onClick={handleTaskComplete}>Complete</Button>
            </div>
          )}
        </div>
        
        {/* Settings */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Focus Duration: {focusDuration} min</Label>
            <Slider 
              className="w-32" 
              value={[focusDuration]} 
              min={5} 
              max={60} 
              step={5} 
              onValueChange={(values) => setFocusDuration(values[0])} 
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Label className="text-sm">Break Duration: {breakDuration} min</Label>
            <Slider 
              className="w-32" 
              value={[breakDuration]} 
              min={1} 
              max={15} 
              step={1} 
              onValueChange={(values) => setBreakDuration(values[0])} 
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Label className="text-sm">Sessions Until Long Break</Label>
            <Slider 
              className="w-32" 
              value={[pomodorosUntilLongBreak]} 
              min={2} 
              max={6} 
              step={1} 
              onValueChange={(values) => setPomodorosUntilLongBreak(values[0])} 
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Label className="text-sm flex items-center">
              <Bell className="h-4 w-4 mr-1" />
              Auto-start Breaks
            </Label>
            <Switch 
              checked={autoStartBreaks} 
              onCheckedChange={setAutoStartBreaks} 
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Label className="text-sm flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Auto-start Pomodoros
            </Label>
            <Switch 
              checked={autoStartPomodoros} 
              onCheckedChange={setAutoStartPomodoros} 
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <div className="text-sm text-muted-foreground">
          Completed Pomodoros: <span className="font-medium">{completedPomodoros}</span>
        </div>
      </CardFooter>
      
      {/* Notification Dialog */}
      <AlertDialog open={showNotification} onOpenChange={setShowNotification}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Time's Up!</AlertDialogTitle>
            <AlertDialogDescription>{notificationMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setShowNotification(false)}>Dismiss</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}