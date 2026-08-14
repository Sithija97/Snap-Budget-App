CREATE TABLE "recaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"period_type" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"message" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recaps" ADD CONSTRAINT "recaps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recaps_user_id_created_at_idx" ON "recaps" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recaps_user_period_unique_idx" ON "recaps" USING btree ("user_id","period_type","period_start");