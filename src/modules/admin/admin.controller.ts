import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { LoginDto } from '../auth/dto';
import { CreateDoctorDto } from '../doctor/dto/create-doctor';
import { AdminAuthGuard } from '../auth/guards/adminauth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminLogin } from './dto/adminLogin';
import { ChangeAvailabilityDto } from './dto/change-availability.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login admin' })
  @ApiBody({ type: AdminLogin })
  @ApiResponse({ status: 200, description: 'Admin login successful' })
  @ApiResponse({ status: 401, description: 'Invalid admin credentials' })
  async login(@Body() loginDto: AdminLogin) {
    return this.adminService.login(loginDto);
  }

  @Post('add-doctor')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a new doctor' })
  @ApiBody({ type: CreateDoctorDto }) // Replace Object with actual DTO for adding a doctor
  @ApiResponse({ status: 201, description: 'Doctor added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  async addDoctor(
    @Body() doctorDto: CreateDoctorDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    // Replace any with actual DTO type
    return this.adminService.addDoctor(doctorDto,image);
  }

  @Get('get-doctors')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiResponse({ status: 200, description: 'List of doctors retrieved successfully' })
  async getDoctors(doctorsDto:CreateDoctorDto) {
    return this.adminService.getDoctors(doctorsDto);
  }

  @Post("change-availability")
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change doctor availability' })
  @ApiBody({ type: ChangeAvailabilityDto })
  @ApiResponse({ status: 200, description: 'Doctor availability updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async changeAvailability(@Body() body: ChangeAvailabilityDto) {
    return this.adminService.changeAvailability(body.docId);
  }


  @Get('appointments')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiResponse({ status: 200, description: 'List of appointments retrieved successfully' })
  async getAppointments() {
    return this.adminService.getAllAppointments();
  }


  @Post('cancel-appointments')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiBody({ type: CancelAppointmentDto })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Appointment not found' })
  async cancelAppointment(@Body() body: CancelAppointmentDto) {
    return this.adminService.cancelAppointment(body.appointmentId);
  }


  @Get('dashboard')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiResponse({ status: 200, description: 'Admin dashboard data retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to retrieve admin dashboard data' })
  async getDashboard() {
    return this.adminService.adminDashboard();
  }

  
}