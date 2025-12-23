import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentService } from './appointments.service';

@Injectable()
export class AppointmentCronService {
  private readonly logger = new Logger(AppointmentCronService.name);

  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'expire-appointments-cron',
  })
  async handleExpiredAppointments() {
    const nowUtc = new Date();

    const appointments =
      await this.appointmentService.findActivePaidAppointments();

    let cancelledCount = 0;

    for (const appt of appointments) {
      /**
       * slotDate: "22_12_2025"
       * slotTime: "14:30"
       */

      const [day, month, year] = appt.slotDate.split('_').map(Number);
      const [hour, minute] = appt.slotTime.split(':').map(Number);

      // Convert IST slot time → UTC
      const slotUtc = new Date(
        Date.UTC(year, month - 1, day, hour - 5, minute - 30),
      );

      if (slotUtc < nowUtc && !appt.cancelled) {
        await this.appointmentService.cancelAppointmentById(
          appt.id,
          appt.slotDate,
        );
        cancelledCount++;
      }
    }

    if (cancelledCount > 0) {
      this.logger.log(
        `Auto-cancelled ${cancelledCount} expired appointments`,
      );
    }
  }
}
