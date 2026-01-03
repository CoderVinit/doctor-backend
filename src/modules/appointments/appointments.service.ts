// appointments/appointments.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';
import {appointmentSchema} from 'src/db/schema/appointment.schema';

@Injectable()
export class AppointmentService {
    private db: ReturnType<typeof drizzle<typeof schema>>;
    
      constructor(
        @Inject('DRIZZLE') db: any,
      ) {
        this.db = db;
      }

  async findActivePaidAppointments() {
    return await this.db
      .select()
      .from(appointmentSchema)
      .where(
        and(
          eq(appointmentSchema.payment, false),
          eq(appointmentSchema.cancelled, false),
          eq(appointmentSchema.isCompleted, false),
        ),
      );
  }

  // 2️⃣ Cancel appointment by ID
  async cancelAppointmentById(id: string,slotDate:string) {
   try {
    const result = await this.db
      .update(appointmentSchema)
      .set({ cancelled: true })
      .where(eq(appointmentSchema.id, id))
      .returning();

    const doctor = await this.db
      .select()
      .from(schema.doctorSchema)
      .where(eq(schema.doctorSchema.id, result[0].docId))
      .limit(1);

    if (doctor.length > 0) {
      const slotBookedArray = doctor[0].slotsBooked ? doctor[0].slotsBooked.split(',') : [];
      const index = slotBookedArray.indexOf(slotDate);
      if (index > -1) {
        slotBookedArray.splice(index, 1); // Remove the booked slot
      }
      const updatedSlotsBooked = slotBookedArray.join(',');

      await this.db
        .update(schema.doctorSchema)
        .set({ slotsBooked: updatedSlotsBooked })
        .where(eq(schema.doctorSchema.id, doctor[0].id));
    }
    return result;
   } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw new Error('Failed to cancel appointment');
   }
  }
}
