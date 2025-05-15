CREATE TYPE "public"."deployment_status" AS ENUM('pending', 'running', 'success', 'failed', 'canceled', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('backlog', 'todo', 'inprogress', 'review', 'done');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('frontend', 'backend', 'integration', 'research', 'bugfix', 'design', 'documentation', 'testing', 'other');--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer,
	"status" "deployment_status" DEFAULT 'pending',
	"url" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT false,
	"hackathon_mode" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'backlog' NOT NULL,
	"type" "task_type" DEFAULT 'other' NOT NULL,
	"due_date" timestamp,
	"github_pr_url" text,
	"github_pr_number" integer,
	"ci_status" text,
	"progress" integer DEFAULT 0,
	"assignee_id" integer,
	"sprint_id" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar" text,
	"github_id" text,
	"github_username" text,
	"github_access_token" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprints"("id") ON DELETE cascade ON UPDATE no action;