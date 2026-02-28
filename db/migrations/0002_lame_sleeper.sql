ALTER TABLE "organizations" ADD COLUMN "timezone" text DEFAULT 'Europe/Paris' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "currency" text DEFAULT 'EUR' NOT NULL;