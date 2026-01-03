import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './modules/auth/auth.module';
import dotenv from 'dotenv';
import { AdminModule } from './modules/admin/admin.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AiModule } from './modules/ai/ai.module';
dotenv.config();

@Module({
  imports: [DatabaseModule, AuthModule, AdminModule, DoctorModule, ScheduleModule.forRoot(), AppointmentsModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
