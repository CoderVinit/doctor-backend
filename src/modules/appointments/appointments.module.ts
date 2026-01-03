import { Module } from '@nestjs/common';
import { AppointmentController } from './appointments.controller';
import { AppointmentService } from './appointments.service';
import { AppointmentCronService } from './appointment-cron.service';

@Module({
	controllers: [AppointmentController],
	providers: [AppointmentService, AppointmentCronService],
	exports: [AppointmentService],
})
export class AppointmentsModule {}
// This file has been renamed to appointments.module.ts. Please use that file instead.
