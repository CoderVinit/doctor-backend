import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentService } from './appointments.service';

@Injectable()
export class AppointmentCronService {
  private readonly logger = new Logger(AppointmentCronService.name);

  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredAppointments() {
    // ✅ ALWAYS use Date object
    const now = new Date();


    const appointments =
      await this.appointmentService.findActivePaidAppointments();

    let cancelledCount = 0;

    for (const appt of appointments) {
      // parseSlotDateTime already returns UTC Date


      // Indian Standard Time (IST)
      const istDateTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const [istDate, istTime] = istDateTime.split(', ');

      const slotDate = appt.slotDate.replace(/_/g, '/'); // Convert 22_12_2025 to 22/12/2025

      console.log(slotDate, istDate,"date comparison");
      // ✅ Date vs Date comparison
      if (slotDate <= istDate && appt.slotTime < istTime && !appt.cancelled) {
        await this.appointmentService.cancelAppointmentById(appt.id,appt.slotDate);
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
