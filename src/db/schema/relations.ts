import { relations } from 'drizzle-orm';
import { userSchema } from './user.schema';
import { doctorSchema } from './doctor.schema';
import { appointmentSchema } from './appointment.schema';

// Relations: one doctor can have many appointments
export const doctorRelations = relations(doctorSchema, ({ many }) => ({
  appointments: many(appointmentSchema),
}));

// Relations: one user can have many appointments
export const userRelations = relations(userSchema, ({ many }) => ({
  appointments: many(appointmentSchema),
}));

// Relations: one appointment is linked to one user and one doctor
export const appointmentRelations = relations(appointmentSchema, ({ one }) => ({
  user: one(userSchema, {
    fields: [appointmentSchema.userId],
    references: [userSchema.id],
  }),
  doctor: one(doctorSchema, {
    fields: [appointmentSchema.docId],
    references: [doctorSchema.id],
  }),
}));
