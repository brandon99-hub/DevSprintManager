import { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { User, Task, Sprint } from '@/lib/types';
import { 
  RefreshCw, 
  CheckCircle, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Send 
} from 'lucide-react';

type ActivityType = 
  | 'task_created'
  | 'task_updated'
  | 'task_status_changed'
  | 'task_deleted'
  | 'sprint_created'
  | 'sprint_updated'
  | 'sprint_hackathon_mode_toggled'
  | 'deployment_created'
  | 'deployment_status_updated';

interface Activity {
  id: string;
  type: ActivityType;
  timestamp: number;
  data: any;
  message: string;
}

export default function ActivityFeed() {
  const { lastMessage } = useWebSocketContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Add new activities when receiving WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type !== 'connected' && lastMessage.type !== 'pong') {
      const newActivity: Activity = {
        id: `${lastMessage.type}-${lastMessage.timestamp}`,
        type: lastMessage.type as ActivityType,
        timestamp: lastMessage.timestamp,
        data: lastMessage.data,
        message: formatActivityMessage(lastMessage.type as ActivityType, lastMessage.data)
      };
      
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // Keep most recent 20 activities
    }
  }, [lastMessage]);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Feed</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Live
          </Badge>
        </div>
        <CardDescription>Real-time team activity updates</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No recent activity</p>
              <p className="text-xs mt-1">Activities will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function getActivityIcon(type: ActivityType) {
  const iconClass = "h-5 w-5";
  
  switch (type) {
    case 'task_created':
      return <PlusCircle className={`${iconClass} text-green-500`} />;
    case 'task_updated':
      return <Pencil className={`${iconClass} text-blue-500`} />;
    case 'task_status_changed':
      return <RefreshCw className={`${iconClass} text-orange-500`} />;
    case 'task_deleted':
      return <Trash2 className={`${iconClass} text-red-500`} />;
    case 'sprint_created':
      return <PlusCircle className={`${iconClass} text-purple-500`} />;
    case 'sprint_updated':
    case 'sprint_hackathon_mode_toggled':
      return <Pencil className={`${iconClass} text-indigo-500`} />;
    case 'deployment_created':
    case 'deployment_status_updated':
      return <Send className={`${iconClass} text-cyan-500`} />;
    default:
      return <CheckCircle className={`${iconClass} text-gray-500`} />;
  }
}

function formatActivityMessage(type: ActivityType, data: any): string {
  switch (type) {
    case 'task_created':
      return `New task created: "${data.title}"`;
      
    case 'task_updated':
      return `Task updated: "${data.title}"`;
      
    case 'task_status_changed':
      return `Task "${data.task.title}" moved to ${formatStatus(data.newStatus)}`;
      
    case 'task_deleted':
      return `Task "${data.taskDetails.title}" was deleted`;
      
    case 'sprint_created':
      return `New sprint created: "${data.name}"`;
      
    case 'sprint_updated':
      return `Sprint "${data.name}" was updated`;
      
    case 'sprint_hackathon_mode_toggled':
      return `${data.hackathonMode ? 'Activated' : 'Deactivated'} hackathon mode for "${data.sprint.name}"`;
      
    case 'deployment_created':
      return `New deployment created for task "${data.task.title}"`;
      
    case 'deployment_status_updated':
      return `Deployment for "${data.task.title}" is now ${data.deployment.status}`;
      
    default:
      return 'Unknown activity';
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case 'backlog':
      return 'Backlog';
    case 'todo':
      return 'To Do';
    case 'inprogress':
      return 'In Progress';
    case 'review':
      return 'Review';
    case 'done':
      return 'Done';
    default:
      return status;
  }
}