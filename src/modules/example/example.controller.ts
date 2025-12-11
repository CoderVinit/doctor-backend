import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';

@ApiTags('example')
@Controller('example')
export class ExampleController {
  @Get('public')
  @ApiOperation({ summary: 'Public endpoint - no auth required' })
  @ApiResponse({ status: 200, description: 'Public data' })
  publicRoute() {
    return { message: 'This is public' };
  }

  @Get('user-only')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('user', 'doctor') // Accessible by both user and doctor
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Accessible by users and doctors' })
  @ApiResponse({ status: 200, description: 'User data' })
  userAndDoctorRoute() {
    return { message: 'Accessible by users and doctors' };
  }

  @Get('user-only-strict')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('user') // Only users
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Only accessible by users' })
  @ApiResponse({ status: 200, description: 'User-only data' })
  userOnlyRoute() {
    return { message: 'Only users can access this' };
  }

  @Get('doctor-only')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('doctor') // Only doctors
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Only accessible by doctors' })
  @ApiResponse({ status: 200, description: 'Doctor data' })
  doctorOnlyRoute() {
    return { message: 'Only doctors can access this' };
  }

  @Get('admin-only')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('admin') // Only admins (if you add this role later)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Only accessible by admins' })
  @ApiResponse({ status: 200, description: 'Admin data' })
  adminOnlyRoute() {
    return { message: 'Only admins can access this' };
  }
}
