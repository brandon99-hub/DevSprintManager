import { useState, useEffect, useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';
import { Task, Sprint } from '@/lib/types';

type WebSocketEventType = 
  | 'connected'
  | 'task_created'
  | 'task_updated'
  | 'task_status_changed'
  | 'task_deleted'
  | 'sprint_created'
  | 'sprint_updated'
  | 'sprint_hackathon_mode_toggled'
  | 'deployment_created'
  | 'deployment_status_updated';

interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: number;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    const onOpen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Send ping to server every 30 seconds to keep connection alive
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      }, 30000);
      
      return () => clearInterval(interval);
    };
    
    const onMessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        // Handle different message types
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    const onClose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    
    const onError = (error: Event) => {
      console.error('WebSocket error:', error);
    };
    
    ws.addEventListener('open', onOpen);
    ws.addEventListener('message', onMessage);
    ws.addEventListener('close', onClose);
    ws.addEventListener('error', onError);
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('message', onMessage);
      ws.removeEventListener('close', onClose);
      ws.removeEventListener('error', onError);
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);
  
  // Handle WebSocket messages and update cache accordingly
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    const { type, data } = message;
    
    switch (type) {
      case 'connected':
        // Connection established, no action needed
        break;
        
      case 'task_created':
        // Invalidate tasks list query to refetch with new task
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        break;
        
      case 'task_updated':
      case 'task_status_changed':
        // Update the task in the cache
        queryClient.setQueryData(
          ['/api/tasks', data.task.id.toString()], 
          data.task
        );
        // Also invalidate the tasks list
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        break;
        
      case 'task_deleted':
        // Remove task from cache
        queryClient.removeQueries({ queryKey: ['/api/tasks', data.taskId.toString()] });
        // Invalidate tasks list
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        break;
        
      case 'sprint_created':
        // Invalidate sprints list
        queryClient.invalidateQueries({ queryKey: ['/api/sprints'] });
        break;
        
      case 'sprint_updated':
      case 'sprint_hackathon_mode_toggled':
        // Update sprint in cache
        queryClient.setQueryData(
          ['/api/sprints', data.sprint.id.toString()], 
          data.sprint
        );
        // Also invalidate sprints list
        queryClient.invalidateQueries({ queryKey: ['/api/sprints'] });
        // Invalidate active sprint if this is the active one
        if (data.sprint.isActive) {
          queryClient.invalidateQueries({ queryKey: ['/api/sprints/active'] });
        }
        break;
        
      case 'deployment_created':
      case 'deployment_status_updated':
        // Invalidate the associated task to get updated deployment info
        queryClient.invalidateQueries({ 
          queryKey: ['/api/tasks', data.task.id.toString()] 
        });
        break;
        
      default:
        console.log('Unknown message type:', type);
    }
  }, []);
  
  // Send a message to the WebSocket server
  const sendMessage = useCallback((data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, [socket]);
  
  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage
  };
}