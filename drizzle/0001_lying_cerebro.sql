ALTER TABLE "appointments" DROP CONSTRAINT "appointment_user_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointment_doctor_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "user_role" varchar(50) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "symptoms" text;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "keywords" text[];--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "rating" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(50) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doc_id_doctors_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_user_role_users_id_role_fk" FOREIGN KEY ("user_id","user_role") REFERENCES "public"."users"("id","role") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "user_data";