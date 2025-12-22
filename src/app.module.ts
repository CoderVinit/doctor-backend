import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './modules/auth/auth.module';
import dotenv from 'dotenv';
import { AdminModule } from './modules/admin/admin.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentsModule } from './appointments/appointments.module';
dotenv.config();

@Module({
  imports: [DatabaseModule, AuthModule, AdminModule, DoctorModule, ScheduleModule.forRoot(), AppointmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
