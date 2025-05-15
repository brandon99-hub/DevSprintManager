import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTaskSchema, insertSprintSchema, updateTaskSchema, updateSprintSchema } from "@shared/schema";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-strategy";
import session from "express-session";
import crypto from "crypto";
import PgSession from "connect-pg-simple";
import { pool } from "./db";
import { WebSocketServer, WebSocket } from 'ws';

// Define session store
const PostgresStore = PgSession(session);

// Configure passport for GitHub OAuth
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different types of messages
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    // Send initial connection success message
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
  });
  
  // Broadcast function to send updates to all clients
  const broadcastUpdate = (eventType: string, data: any) => {
    const message = JSON.stringify({
      type: eventType,
      data,
      timestamp: Date.now()
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
  
  // Session configuration
  app.use(
    session({
      store: new PostgresStore({
        pool,
        tableName: "user_sessions",
      }),
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Authentication check middleware
  // For development, we'll allow all requests through
  const ensureAuthenticated = (req: Request, res: Response, next: any) => {
    // In a production environment, we would uncomment this code:
    // if (req.isAuthenticated()) {
    //   return next();
    // }
    // res.status(401).json({ message: "Unauthorized" });
    
    // For now, we'll bypass authentication
    return next();
  };

  // AUTH ROUTES
  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // SPRINT ROUTES
  // Get all sprints
  app.get("/api/sprints", async (req, res) => {
    try {
      const sprints = await storage.getSprints();
      res.json(sprints);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sprints" });
    }
  });
  
  // Get active sprint with tasks
  app.get("/api/sprints/active", async (req, res) => {
    try {
      const sprint = await storage.getActiveSprint();
      if (!sprint) {
        return res.status(404).json({ message: "No active sprint found" });
      }
      res.json(sprint);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active sprint" });
    }
  });
  
  // Get sprint by ID
  app.get("/api/sprints/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const sprint = await storage.getSprintById(Number(id));
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" });
      }
      res.json(sprint);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sprint" });
    }
  });
  
  // Create a new sprint
  app.post("/api/sprints", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSprintSchema.parse(req.body);
      const sprint = await storage.createSprint(validatedData);
      
      // Broadcast sprint creation event
      broadcastUpdate('sprint_created', sprint);
      
      res.status(201).json(sprint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sprint data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sprint" });
    }
  });
  
  // Update a sprint
  app.patch("/api/sprints/:id", ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateSprintSchema.parse(req.body);
      const sprint = await storage.updateSprint(Number(id), validatedData);
      
      // Broadcast sprint update event
      broadcastUpdate('sprint_updated', sprint);
      
      res.json(sprint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sprint data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update sprint" });
    }
  });
  
  // Toggle hackathon mode
  app.post("/api/sprints/:id/toggle-hackathon", ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { hackathonMode } = req.body;
      
      if (typeof hackathonMode !== 'boolean') {
        return res.status(400).json({ message: "hackathonMode must be a boolean" });
      }
      
      const sprint = await storage.toggleSprintHackathonMode(Number(id), hackathonMode);
      
      // Broadcast hackathon mode change event
      broadcastUpdate('sprint_hackathon_mode_toggled', {
        sprintId: sprint.id,
        hackathonMode: sprint.hackathonMode,
        sprint
      });
      
      res.json(sprint);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle hackathon mode" });
    }
  });
  
  // TASK ROUTES
  // Get all tasks or by sprint ID
  app.get("/api/tasks", async (req, res) => {
    try {
      const sprintId = req.query.sprintId ? Number(req.query.sprintId) : undefined;
      const tasks = await storage.getTasks(sprintId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tasks" });
    }
  });
  
  // Get task by ID
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getTaskById(Number(id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to get task" });
    }
  });
  
  // Create a new task
  app.post("/api/tasks", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      
      // Broadcast task creation event to all connected clients
      broadcastUpdate('task_created', task);
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  // Update a task
  app.patch("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateTaskSchema.parse(req.body);
      const task = await storage.updateTask(Number(id), validatedData);
      
      // Broadcast task update event to all connected clients
      broadcastUpdate('task_updated', task);
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  
  // Update a task status (for drag-and-drop)
  app.patch("/api/tasks/:id/status", ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['backlog', 'todo', 'inprogress', 'review', 'done'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const task = await storage.updateTaskStatus(Number(id), status);
      
      // Broadcast task status change event to all connected clients
      broadcastUpdate('task_status_changed', {
        taskId: task.id,
        oldStatus: task.status, // This will actually be the new status already
        newStatus: status,
        task
      });
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task status" });
    }
  });
  
  // Delete a task
  app.delete("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const numericId = Number(id);
      
      // Get the task before deleting it so we can include its details in the broadcast
      const task = await storage.getTaskById(numericId);
      
      await storage.deleteTask(numericId);
      
      // Broadcast task deletion event to all connected clients
      if (task) {
        broadcastUpdate('task_deleted', { 
          taskId: numericId,
          taskDetails: task 
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  
  // DEPLOYMENT ROUTES
  // Create a new deployment for a task
  app.post("/api/deployments", async (req, res) => {
    try {
      const { taskId, status, url } = req.body;
      
      if (!taskId || !status) {
        return res.status(400).json({ message: "taskId and status are required" });
      }
      
      const deployment = await storage.createDeployment({
        taskId,
        status,
        url,
        completedAt: null
      });
      
      // Get the related task for the broadcast
      const task = await storage.getTaskById(taskId);
      
      // Broadcast deployment created event
      broadcastUpdate('deployment_created', {
        deployment,
        task
      });
      
      res.status(201).json(deployment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create deployment" });
    }
  });
  
  // Update deployment status (for webhooks)
  app.post("/api/webhooks/deployment", async (req, res) => {
    try {
      const { deploymentId, status } = req.body;
      
      if (!deploymentId || !status) {
        return res.status(400).json({ message: "deploymentId and status are required" });
      }
      
      const deployment = await storage.updateDeploymentStatus(deploymentId, status);
      res.json(deployment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update deployment status" });
    }
  });
  
  // Webhook receiver for GitHub PR events
  app.post("/api/webhooks/github", async (req, res) => {
    try {
      const payload = req.body;
      const event = req.headers['x-github-event'];
      
      if (event === 'pull_request') {
        const prNumber = payload.pull_request.number;
        const prUrl = payload.pull_request.html_url;
        const prState = payload.pull_request.state;
        const action = payload.action;
        
        // Find tasks with this PR number
        const tasks = await storage.getTasks();
        const matchingTasks = tasks.filter(task => task.githubPrNumber === prNumber);
        
        if (matchingTasks.length > 0) {
          for (const task of matchingTasks) {
            // Update CI status
            let ciStatus = task.ciStatus;
            
            if (action === 'opened' || action === 'reopened') {
              ciStatus = 'pending';
            } else if (action === 'closed' && payload.pull_request.merged) {
              ciStatus = 'merged';
            } else if (action === 'closed') {
              ciStatus = 'closed';
            }
            
            await storage.updateTask(task.id, { 
              githubPrUrl: prUrl,
              ciStatus
            });
          }
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to process GitHub webhook" });
    }
  });

  return httpServer;
}
