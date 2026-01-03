import { Controller, Post} from "@nestjs/common";
import { ApiTags} from "@nestjs/swagger";
import { AppointmentCronService } from "./appointment-cron.service";


@ApiTags('appointment')
@Controller("appointment")
export class AppointmentController {
  constructor(private readonly appointmentCronService: AppointmentCronService) {}
// 🔧 Only for testing
  @Post('cancel-expired')
  runCronManually() {
    return this.appointmentCronService.handleExpiredAppointments();
  }
  
}