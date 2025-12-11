import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DoctorService } from "./doctor.service";
import { AdminLogin } from "../admin/dto/adminLogin";
import { DoctorAuthGuard } from "../auth/guards/doctorAuth.guard";
import { CreateDoctorDto } from "./dto/create-doctor";

interface AuthenticatedRequest extends Request {
    userEmail: string;
}

@ApiTags('doctors')
@Controller('doctor')
export class DoctorController {
    constructor(private readonly doctorService: DoctorService) {}

    @Post('login')
      @ApiOperation({ summary: 'Login doctor' })
      @ApiBody({ type: AdminLogin })
      @ApiResponse({ status: 200, description: 'Doctor login successful' })
      @ApiResponse({ status: 401, description: 'Invalid doctor credentials' })
      async login(@Body() loginDto: AdminLogin) {
        return this.doctorService.login(loginDto);
      }

    @Get("appointments")
    @UseGuards(DoctorAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get doctor appointments' })
    @ApiResponse({ status: 200, description: 'List of doctor appointments' })
    async getAppointments(@Req() req: AuthenticatedRequest) {
        const doctorEmail = req.userEmail;
        return this.doctorService.getAppointments(doctorEmail);
    }

    @Post("mark-completed")
    @UseGuards(DoctorAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Mark appointment as completed' })
    @ApiResponse({ status: 200, description: 'Appointment marked as completed' })
    async markAppointmentCompleted(@Body() body:{appointmentId:string}) {
        return this.doctorService.markAppointmentCompleted(body);
    }

    @Post("cancel-appointment")
    @UseGuards(DoctorAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cancel an appointment' })
    @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
    async cancelAppointment(@Body() body:{appointmentId:string}) {
        return this.doctorService.cancelAppointment(body);
    }

    @Get("dashboard")
    @UseGuards(DoctorAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get doctor dashboard data' })
    @ApiResponse({ status: 200, description: 'Doctor dashboard data retrieved successfully' })
    async doctorDashboard(@Req() req: AuthenticatedRequest) {
        const doctorEmail = req.userEmail;
        return this.doctorService.doctorDashboard(doctorEmail);
    } 

    @Get("profile")
    @UseGuards(DoctorAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get doctor profile data' })
    @ApiResponse({ status: 200, description: 'Doctor profile data retrieved successfully' })
    async getDoctorProfile(@Req() req: AuthenticatedRequest) {
        const doctorEmail = req.userEmail;
        return this.doctorService.getDoctorProfile(doctorEmail);
    }

    @Post("update-profile")
    @UseGuards(DoctorAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update doctor profile data' })
    @ApiResponse({ status: 200, description: 'Doctor profile data updated successfully' })
    async updateDoctorProfile(@Req() req: AuthenticatedRequest, @Body() updateData: CreateDoctorDto) {
        const doctorEmail = req.userEmail;
        return this.doctorService.updateDoctorProfile(doctorEmail, updateData);
    }


}