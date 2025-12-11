import { pgTable, uuid, varchar, timestamp, boolean, numeric, foreignKey } from 'drizzle-orm/pg-core';

import { userSchema } from './user.schema';
import { doctorSchema } from './doctor.schema';

// Appointments table with relationships
export const appointmentSchema = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  userRole: varchar('user_role', { length: 50 }).notNull().default('user'),
  docId: uuid('doc_id').notNull().references(() => doctorSchema.id),
  slotDate: varchar('slot_date', { length: 100 }).notNull(),
  slotTime: varchar('slot_time', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  date: numeric('date').notNull(),
  cancelled: boolean('cancelled').default(false),
  payment: boolean('payment').default(false),
  isCompleted: boolean('is_completed').default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  userFk: foreignKey({
    columns: [table.userId, table.userRole],
    foreignColumns: [userSchema.id, userSchema.role],
  }),
}));