ALTER TABLE "appointments" DROP CONSTRAINT "appointment_user_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointment_doctor_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doc_id_doctors_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;