ALTER TABLE "budgets" DROP CONSTRAINT "budgets_category_id_categories_id_fk";
--> statement-breakpoint
DROP INDEX "budgets_user_id_month_idx";--> statement-breakpoint
DROP INDEX "budgets_category_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_id_month_unique_idx" ON "budgets" USING btree ("user_id","month");--> statement-breakpoint
ALTER TABLE "budgets" DROP COLUMN "category_id";