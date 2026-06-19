CREATE TYPE "public"."diff_type" AS ENUM('removed', 'added', 'context');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TYPE "public"."roast_mode" AS ENUM('honest', 'sarcasm');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('critical', 'warning', 'good', 'needs_serious_help');--> statement-breakpoint
CREATE TABLE "analysis_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"severity" "issue_severity" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"line_start" integer,
	"line_end" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_content" text NOT NULL,
	"language" varchar(32),
	"score" numeric(3, 1),
	"roast_quote" text,
	"roast_mode" "roast_mode" NOT NULL,
	"verdict" "verdict",
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggested_fixes" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_id" integer NOT NULL,
	"diff_type" "diff_type" NOT NULL,
	"code_content" text NOT NULL,
	"line_number" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_issues" ADD CONSTRAINT "analysis_issues_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_fixes" ADD CONSTRAINT "suggested_fixes_issue_id_analysis_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."analysis_issues"("id") ON DELETE cascade ON UPDATE no action;