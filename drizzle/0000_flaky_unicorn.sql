ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointment_user_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointment_doctor_fk";
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'users'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "users" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_role_pk" PRIMARY KEY("id","role");--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "user_role" varchar(50) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "symptoms" text;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "keywords" text[];--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "rating" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(50) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doc_id_doctors_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_user_role_users_id_role_fk" FOREIGN KEY ("user_id","user_role") REFERENCES "public"."users"("id","role") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "user_data";