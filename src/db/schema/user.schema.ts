import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
} from 'drizzle-orm/pg-core';

export const userSchema = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  image: text('image'),
  address: varchar('address', { length: 255 }),
  gender: varchar('gender', { length: 50 }).default('not specified'),
  dob: timestamp('dob', { mode: 'date' }).defaultNow(),
  phone: varchar('phone', { length: 20 }).default('0000000000'),
  role: varchar('role', { length: 50 }).default('user').notNull(), // 'user', 'doctor', or 'admin'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});
