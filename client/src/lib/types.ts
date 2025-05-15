// Task related types
export type TaskStatus = 'backlog' | 'todo' | 'inprogress' | 'review' | 'done';

export type TaskType = 
  | 'frontend'
  | 'backend' 
  | 'integration'
  | 'research'
  | 'bugfix'
  | 'design'
  | 'documentation'
  | 'testing'
  | 'other';

export type DeploymentStatus = 
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  githubId?: string;
  githubUsername?: string;
}

export interface Sprint {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hackathonMode: boolean;
}

export interface Deployment {
  id: number;
  taskId: number;
  status: DeploymentStatus;
  url?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  type: TaskType;
  dueDate?: string;
  githubPrUrl?: string;
  githubPrNumber?: number;
  ciStatus?: string;
  progress?: number;
  assigneeId?: number;
  sprintId?: number;
  assignee?: User;
  deployments?: Deployment[];
}

export interface SprintWithTasks extends Sprint {
  tasks: Task[];
}

// Drag and drop related types
export interface DragItem {
  id: number;
  type: string;
  status: TaskStatus;
}

// Column statistics
export interface ColumnStats {
  backlog: number;
  todo: number;
  inprogress: number;
  review: number;
  done: number;
}

// Column configuration type
export interface ColumnConfig {
  id: TaskStatus;
  title: string;
  colorClass: string;
}
