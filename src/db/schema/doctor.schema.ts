import { real } from 'drizzle-orm/pg-core';
import { pgTable, uuid, varchar, timestamp, boolean, text, numeric, json, foreignKey } from 'drizzle-orm/pg-core';

// Users table
// Doctors table
export const doctorSchema = pgTable('doctors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  image: text('image').notNull(),
  speciality: varchar('speciality', { length: 255 }).notNull(),
  degree: varchar('degree', { length: 255 }).notNull(),
  keywords: text("keywords").array(),
  experience: varchar('experience', { length: 255 }).notNull(),
  about: text('about').notNull(),
  available: boolean('available').default(true),
  fees: numeric('fees', { precision: 10, scale: 2 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  date: numeric('date').notNull(),
  rating: real("rating").default(0),
  slotsBooked: varchar('slots_booked', { length: 255 }).default(''),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});