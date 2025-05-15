import { 
  users, type User, type InsertUser, 
  sprints, type Sprint, type InsertSprint, 
  tasks, type Task, type InsertTask, type UpdateTaskSchema, type TaskWithRelations,
  deployments, type Deployment, type InsertDeployment,
  type SprintWithTasks,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGithubId(githubId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Sprint operations
  getSprints(): Promise<Sprint[]>;
  getSprintById(id: number): Promise<Sprint | undefined>;
  getActiveSprint(): Promise<SprintWithTasks | undefined>;
  createSprint(sprint: InsertSprint): Promise<Sprint>;
  updateSprint(id: number, sprint: Partial<InsertSprint>): Promise<Sprint>;
  toggleSprintHackathonMode(id: number, hackathonMode: boolean): Promise<Sprint>;
  
  // Task operations
  getTasks(sprintId?: number): Promise<TaskWithRelations[]>;
  getTaskById(id: number): Promise<TaskWithRelations | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  updateTaskStatus(id: number, status: string): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  
  // Deployment operations
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeploymentStatus(id: number, status: string): Promise<Deployment>;
  getDeploymentsByTaskId(taskId: number): Promise<Deployment[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByGithubId(githubId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.githubId, githubId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Sprint operations
  async getSprints(): Promise<Sprint[]> {
    return db.select().from(sprints).orderBy(desc(sprints.startDate));
  }
  
  async getSprintById(id: number): Promise<Sprint | undefined> {
    const [sprint] = await db.select().from(sprints).where(eq(sprints.id, id));
    return sprint || undefined;
  }
  
  async getActiveSprint(): Promise<SprintWithTasks | undefined> {
    const [sprint] = await db.select().from(sprints).where(eq(sprints.isActive, true));
    
    if (!sprint) {
      return undefined;
    }
    
    const sprintTasks = await db.query.tasks.findMany({
      where: eq(tasks.sprintId, sprint.id),
      with: {
        assignee: true,
        deployments: true
      },
      orderBy: [asc(tasks.status)]
    });
    
    return {
      ...sprint,
      tasks: sprintTasks
    };
  }
  
  async createSprint(insertSprint: InsertSprint): Promise<Sprint> {
    // If this sprint is active, deactivate all other sprints
    if (insertSprint.isActive) {
      await db
        .update(sprints)
        .set({ isActive: false })
        .where(eq(sprints.isActive, true));
    }
    
    const [sprint] = await db
      .insert(sprints)
      .values(insertSprint)
      .returning();
    return sprint;
  }
  
  async updateSprint(id: number, updateSprint: Partial<InsertSprint>): Promise<Sprint> {
    // If this sprint is being activated, deactivate all other sprints
    if (updateSprint.isActive) {
      await db
        .update(sprints)
        .set({ isActive: false })
        .where(eq(sprints.isActive, true));
    }
    
    const [sprint] = await db
      .update(sprints)
      .set(updateSprint)
      .where(eq(sprints.id, id))
      .returning();
    return sprint;
  }
  
  async toggleSprintHackathonMode(id: number, hackathonMode: boolean): Promise<Sprint> {
    const [sprint] = await db
      .update(sprints)
      .set({ hackathonMode })
      .where(eq(sprints.id, id))
      .returning();
    return sprint;
  }

  // Task operations
  async getTasks(sprintId?: number): Promise<TaskWithRelations[]> {
    const query = sprintId 
      ? eq(tasks.sprintId, sprintId)
      : sql`TRUE`;
    
    return db.query.tasks.findMany({
      where: query,
      with: {
        assignee: true,
        deployments: true
      },
      orderBy: [asc(tasks.status)]
    });
  }
  
  async getTaskById(id: number): Promise<TaskWithRelations | undefined> {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
      with: {
        assignee: true,
        deployments: true
      }
    });
    
    return task || undefined;
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }
  
  async updateTask(id: number, updateTask: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(updateTask)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }
  
  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ status: status as any })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }
  
  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
  
  // Deployment operations
  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const [deployment] = await db
      .insert(deployments)
      .values(insertDeployment)
      .returning();
    return deployment;
  }
  
  async updateDeploymentStatus(id: number, status: string): Promise<Deployment> {
    const now = new Date();
    const completedAt = ['success', 'failed', 'canceled'].includes(status) ? now : null;
    
    const [deployment] = await db
      .update(deployments)
      .set({ 
        status: status as any,
        completedAt: completedAt
      })
      .where(eq(deployments.id, id))
      .returning();
    return deployment;
  }
  
  async getDeploymentsByTaskId(taskId: number): Promise<Deployment[]> {
    return db
      .select()
      .from(deployments)
      .where(eq(deployments.taskId, taskId))
      .orderBy(desc(deployments.createdAt));
  }
}

export const storage = new DatabaseStorage();
