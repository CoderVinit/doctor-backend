import { Controller, Get, Post, Body, UseGuards, Req, Put, UseInterceptors, UploadedFile, Param } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiParam } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CreateUserDto, LoginDto } from "./dto";
import { UpdateUserProfileDto } from "./dto/update-profile.dto";
import { AuthGuard } from "./guards";
import type { Request } from "express";
import { BookAppointmentDto } from "./dto/create-appointment";

@ApiTags('auth')
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("status")
  @ApiOperation({ summary: 'Check auth service status' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  getAuthStatus(): string {
    return "Auth service is running";
  }

  @Post("register")
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Email already registered' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post("login")
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', schema: { example: { message: 'Login successful', token: 'jwt-token', user: {} } } })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("get-speciality")
  async getDocSpeciality(){
    return this.authService.getDocSpecialityList();
  }

  @Get("get-profile")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile (requires authentication)' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    return this.authService.getProfile(user.id);
  }

  @Post("update-profile")
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update user profile with optional image upload (requires authentication)' })
  @ApiBody({
    description: 'User profile update data with optional image',
    type: UpdateUserProfileDto,
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or image upload failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserProfileDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ) {
    const user = (req as any).user;
    return this.authService.updateProfile(user.id, updateUserDto, imageFile);
  }

  @Post("book-appointment")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Book an appointment (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Appointment booked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid appointment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bookAppointment(@Req() req: Request, @Body() appointmentData: BookAppointmentDto) {
    const userId = (req as any).user.id;
    return this.authService.bookAppointment(userId, appointmentData);
  }

  @Get("appointment-list")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user appointments (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Fetched appointments successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAppointments(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.authService.appintmentList(userId);
  }


  @Post("cancel-appointment/:id")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel an appointment (requires authentication)' })
  @ApiParam({ name: 'id', description: 'Appointment ID', example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid appointment ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelAppointmentF(@Req() req: Request, @Param('id') appointmentId: string) {
    const userId = (req as any).user.id;
    return this.authService.cancelAppointment(appointmentId);
  }

  @Get("doctor/list")
  @ApiOperation({ summary: 'Get list of doctors' })
  @ApiResponse({ status: 200, description: 'Fetched doctors successfully' })
  async getDoctors() {
    return this.authService.getDoctorList();
  }

 @Post("verifyRazorpay")
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Verify Razorpay payment (requires authentication)' })
@ApiResponse({ status: 200, description: 'Payment verified successfully' })
@ApiResponse({ status: 400, description: 'Payment verification failed' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async verifyRazorpay(
  @Req() req: Request, 
  @Body() body: { 
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
) {
  const userId = (req as any).user.id;
  return this.authService.verifyRazorpayPayment(userId, body);
}



  @Post("payment-razorpay")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate Razorpay payment (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Razorpay order created successfully' })
  @ApiResponse({ status: 400, description: 'Failed to create Razorpay order' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initiateRazorpayPayment(@Req() req: Request, @Body() body: { appointmentId: string }) {
    const userId = (req as any).user.id;
    return this.authService.initiateRazorpayPayment(body);
  }

  
}