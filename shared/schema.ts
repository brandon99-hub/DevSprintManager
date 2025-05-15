import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'todo',
  'inprogress',
  'review', 
  'done'
]);

export const taskTypeEnum = pgEnum('task_type', [
  'frontend',
  'backend',
  'integration',
  'research',
  'bugfix',
  'design',
  'documentation',
  'testing',
  'other'
]);

export const deploymentStatusEnum = pgEnum('deployment_status', [
  'pending',
  'running',
  'success',
  'failed',
  'canceled',
  'skipped'
]);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  githubId: text("github_id"),
  githubUsername: text("github_username"),
  githubAccessToken: text("github_access_token"),
});

export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  hackathonMode: boolean("hackathon_mode").default(false),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").default('backlog').notNull(),
  type: taskTypeEnum("type").default('other').notNull(),
  dueDate: timestamp("due_date"),
  githubPrUrl: text("github_pr_url"),
  githubPrNumber: integer("github_pr_number"),
  ciStatus: text("ci_status"),
  progress: integer("progress").default(0),
  assigneeId: integer("assignee_id").references(() => users.id, { onDelete: 'set null' }),
  sprintId: integer("sprint_id").references(() => sprints.id, { onDelete: 'cascade' }),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: 'cascade' }),
  status: deploymentStatusEnum("status").default('pending'),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const sprintsRelations = relations(sprints, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  sprint: one(sprints, {
    fields: [tasks.sprintId],
    references: [sprints.id],
  }),
  deployments: many(deployments),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  task: one(tasks, {
    fields: [deployments.taskId],
    references: [tasks.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  avatar: true,
  githubId: true,
  githubUsername: true,
  githubAccessToken: true,
});

export const insertSprintSchema = createInsertSchema(sprints).pick({
  name: true,
  description: true,
  startDate: true,
  endDate: true,
  isActive: true,
  hackathonMode: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  type: true,
  dueDate: true,
  githubPrUrl: true,
  githubPrNumber: true,
  ciStatus: true,
  progress: true,
  assigneeId: true,
  sprintId: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).pick({
  taskId: true,
  status: true,
  url: true,
  completedAt: true,
});

// Update Schemas
export const updateTaskSchema = insertTaskSchema.partial();
export const updateSprintSchema = insertSprintSchema.partial();

// Select Schemas
export const selectUserSchema = createSelectSchema(users);
export const selectSprintSchema = createSelectSchema(sprints);
export const selectTaskSchema = createSelectSchema(tasks);
export const selectDeploymentSchema = createSelectSchema(deployments);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSprint = z.infer<typeof insertSprintSchema>;
export type Sprint = typeof sprints.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deployments.$inferSelect;

export type TaskWithRelations = Task & {
  assignee?: User;
  deployments?: Deployment[];
};

export type SprintWithTasks = Sprint & {
  tasks: TaskWithRelations[];
};
