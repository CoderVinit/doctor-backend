import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { appointmentSchema } from '../../db/schema/appointment.schema';
import { userSchema } from '../../db/schema/user.schema';
import { doctorSchema } from '../../db/schema/doctor.schema';

export interface UserContext {
  id: string;
  role: 'user' | 'doctor' | 'admin';
}

@Injectable()
export class DataAccessService {
  constructor(@Inject('DRIZZLE') private db: any) {}

  /**
   * Get appointments based on user role
   * - USER: Can only see their own appointments
   * - DOCTOR: Can only see appointments assigned to them
   * - ADMIN: Can see all appointments
   */
  async getAppointments(userContext: UserContext) {
    switch (userContext.role) {
      case 'user':
        return await this.db.query.appointmentSchema.findMany({
          where: eq(appointmentSchema.userId, userContext.id),
          with: {
            doctor: {
              columns: {
                password: false,
              },
            },
          },
        });

      case 'doctor':
        return await this.db.query.appointmentSchema.findMany({
          where: eq(appointmentSchema.docId, userContext.id),
          with: {
            user: {
              columns: {
                password: false,
              },
            },
          },
        });

      case 'admin':
        return await this.db.query.appointmentSchema.findMany({
          with: {
            user: {
              columns: {
                password: false,
              },
            },
            doctor: {
              columns: {
                password: false,
              },
            },
          },
        });

      default:
        throw new ForbiddenException('Invalid user role');
    }
  }

  /**
   * Get users based on role
   * - USER: Can only see their own profile
   * - DOCTOR: Can see their own profile and patient profiles for their appointments
   * - ADMIN: Can see all users
   */
  async getUsers(userContext: UserContext, targetUserId?: string) {
    switch (userContext.role) {
      case 'user':
        if (targetUserId && targetUserId !== userContext.id) {
          throw new ForbiddenException('Users can only access their own profile');
        }
        return await this.db
          .select()
          .from(userSchema)
          .where(eq(userSchema.id, userContext.id));

      case 'doctor':
        if (targetUserId) {
          // Doctor can see specific user if they have an appointment together
          const hasAppointment = await this.db
            .select()
            .from(appointmentSchema)
            .where(
              and(
                eq(appointmentSchema.docId, userContext.id),
                eq(appointmentSchema.userId, targetUserId)
              )
            )
            .limit(1);

          if (hasAppointment.length === 0) {
            throw new ForbiddenException('Doctor can only access patients they have appointments with');
          }
        }
        return await this.db
          .select()
          .from(userSchema)
          .where(targetUserId ? eq(userSchema.id, targetUserId) : undefined);

      case 'admin':
        return await this.db
          .select()
          .from(userSchema)
          .where(targetUserId ? eq(userSchema.id, targetUserId) : undefined);

      default:
        throw new ForbiddenException('Invalid user role');
    }
  }

  /**
   * Get doctors based on role
   * - USER: Can see all available doctors
   * - DOCTOR: Can see their own profile
   * - ADMIN: Can see all doctors
   */
  async getDoctors(userContext: UserContext, targetDoctorId?: string) {
    switch (userContext.role) {
      case 'user':
        // Users can see all available doctors for booking
        return await this.db
          .select({
            id: doctorSchema.id,
            name: doctorSchema.name,
            email: doctorSchema.email,
            image: doctorSchema.image,
            speciality: doctorSchema.speciality,
            degree: doctorSchema.degree,
            experience: doctorSchema.experience,
            about: doctorSchema.about,
            available: doctorSchema.available,
            fees: doctorSchema.fees,
            address: doctorSchema.address,
          })
          .from(doctorSchema)
          .where(
            and(
              eq(doctorSchema.available, true),
              targetDoctorId ? eq(doctorSchema.id, targetDoctorId) : undefined
            )
          );

      case 'doctor':
        // Doctors can only see their own profile
        if (targetDoctorId && targetDoctorId !== userContext.id) {
          throw new ForbiddenException('Doctors can only access their own profile');
        }
        return await this.db
          .select()
          .from(doctorSchema)
          .where(eq(doctorSchema.id, userContext.id));

      case 'admin':
        return await this.db
          .select()
          .from(doctorSchema)
          .where(targetDoctorId ? eq(doctorSchema.id, targetDoctorId) : undefined);

      default:
        throw new ForbiddenException('Invalid user role');
    }
  }

  /**
   * Check if user can access a specific appointment
   */
  async canAccessAppointment(userContext: UserContext, appointmentId: string): Promise<boolean> {
    const appointment = await this.db
      .select()
      .from(appointmentSchema)
      .where(eq(appointmentSchema.id, appointmentId))
      .limit(1);

    if (appointment.length === 0) {
      return false;
    }

    const apt = appointment[0];

    switch (userContext.role) {
      case 'user':
        return apt.userId === userContext.id;
      case 'doctor':
        return apt.docId === userContext.id;
      case 'admin':
        return true;
      default:
        return false;
    }
  }
}
