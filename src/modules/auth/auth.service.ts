import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { UserEntity } from './entity/user.entity';
import { CreateUserDto, LoginDto } from './dto';
import { UpdateUserProfileDto } from './dto/update-profile.dto';
import { userSchema } from 'src/db/schema/user.schema';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { BookAppointmentDto } from './dto/create-appointment';
import { doctorSchema } from 'src/db/schema/doctor.schema';
import { appointmentSchema } from 'src/db/schema/appointment.schema';
import * as schema from 'src/db/schema';
import { CreateDoctorDto } from '../doctor/dto/create-doctor';
import {razorpayInstance} from 'src/utils/helper'
import * as crypto from 'crypto'

@Injectable()
export class AuthService {
  private db: ReturnType<typeof drizzle<typeof schema>>;

  constructor(
    @Inject('DRIZZLE') db: any,
    private cloudinaryService: CloudinaryService,
  ) {
    this.db = db;
  }

  getAuthStatus(): string {
    return 'Authentication Service is running.';
  }

  async register(createUserDto: CreateUserDto) {
    try {
      // Check if user already exists
      const existingUser = await this.db
        .select()
        .from(userSchema)
        .where(eq(userSchema.email, createUserDto.email));

      if (existingUser.length > 0) {
        throw new BadRequestException('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user
      const newUser = await this.db
        .insert(userSchema)
        .values({
          email: createUserDto.email,
          password: hashedPassword,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          phone: createUserDto.phone,
          address: createUserDto.address,
          gender: createUserDto.gender,
          role: createUserDto.role || 'user', // Default to 'user' role
          isActive: true,
        })
        .returning();

      const user = new UserEntity(newUser[0]);

      return {
        success: true,
        message: 'User registered successfully',
        user: user.toJSON() as any,
      };
    } catch (error) {
      throw error;
    }
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{
    success: boolean;
    message: string;
    token: string;
    user: UserEntity;
  }> {
    try {
      // Find user by email
      const result = await this.db
        .select()
        .from(userSchema)
        .where(eq(userSchema.email, loginDto.email));

      if (result.length === 0) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const user = result[0];

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate JWT token with role
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
      );

      const userEntity = new UserEntity(user);

      return {
        success: true,
        message: 'Login successful',
        token,
        user: userEntity.toJSON() as any,
      };
    } catch (error) {
      throw error;
    }
  }

  async getProfile(
    userId: string,
  ): Promise<{ success: boolean; message: string; userData: any }> {
    try {
      const result = await this.db.query.userSchema.findMany({
        where: eq(userSchema.id, userId),
        columns: {
          password: false, // Exclude password
        },
      });

      if (result.length === 0) {
        throw new UnauthorizedException('User not found');
      }

      return {
        success: true,
        message: 'Profile fetched successfully',
        userData: result[0],
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserProfileDto,
    imageFile?: any,
  ): Promise<{ success: boolean; message: string; user: UserEntity }> {
    try {
      console.log('updateUserDto', imageFile);
      const user = await this.db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, userId));

      if (user.length === 0) {
        throw new UnauthorizedException('User not found');
      }

      const updateData: any = {};

      // Update basic fields if provided
      if (updateUserDto.firstName) updateData.firstName = updateUserDto.firstName;
      if (updateUserDto.phone) updateData.phone = updateUserDto.phone;
      if (updateUserDto.address) updateData.address = updateUserDto.address;
      if (updateUserDto.dob) updateData.dob = new Date(updateUserDto.dob);
      if (updateUserDto.gender) updateData.gender = updateUserDto.gender;

      // Upload image to Cloudinary if provided
      if (imageFile) {
        try {
          const imageUrl = await this.cloudinaryService.uploadImage(
            imageFile.buffer,
          );
          updateData.image = imageUrl;
        } catch (error) {
          throw new BadRequestException(
            `Image upload failed: ${error.message}`,
          );
        }
      }

      // Update user in database
      const updatedUser = await this.db
        .update(userSchema)
        .set(updateData)
        .where(eq(userSchema.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        throw new BadRequestException('Failed to update profile');
      }

      const userEntity = new UserEntity(updatedUser[0]);

      return {
        success: true,
        message: 'Profile updated successfully',
        user: userEntity.toJSON() as any,
      };
    } catch (error) {
      throw error;
    }
  }

  async bookAppointment(
    userId: string,
    appointmentData: BookAppointmentDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const docdata = await this.db
        .select()
        .from(doctorSchema)
        .where(eq(doctorSchema.id, appointmentData.docId));

      console.log('doctor data', docdata);

      if (docdata.length === 0) {
        throw new BadRequestException('Doctor not found');
      }

      if (!docdata[0].available) {
        throw new BadRequestException(
          'Doctor is not available for appointment',
        );
      }

      let slotsBooked = docdata[0].slotsBooked
        ? docdata[0].slotsBooked.split(',')
        : [];

      if (slotsBooked.includes(appointmentData.slotDate)) {
        throw new BadRequestException(
          'Slot already booked, please choose another slot',
        );
      }

      slotsBooked.push(appointmentData.slotDate);

      const updatedSlots = slotsBooked.join(',');

      const updatedDoctor = await this.db
        .update(doctorSchema)
        .set({ slotsBooked: updatedSlots })
        .where(eq(doctorSchema.id, appointmentData.docId))
        .returning();

      if (updatedDoctor.length === 0) {
        throw new BadRequestException('Failed to book appointment');
      }

      await this.db.insert(appointmentSchema).values({
        userId: userId,
        docId: appointmentData.docId,
        slotDate: appointmentData.slotDate,
        slotTime: appointmentData.slotTime,
        amount: String(updatedDoctor[0].fees),
        date: String(Date.now()),
        cancelled: appointmentData.cancelled || false,
        payment: appointmentData.payment || false,
        isCompleted: appointmentData.isCompleted || false,
      });

      return { success: true, message: 'Appointment booked successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error?.message || 'Failed to book appointment',
      );
    }
  }

  async appintmentList(
    userId: string,
  ): Promise<{ success: boolean; message: string; appointments: any[] }> {
    try {
      const user = await this.db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new UnauthorizedException('User not found');
      }

      const appointments = await this.db.query.appointmentSchema.findMany({
        where: eq(appointmentSchema.userId, userId),
        with: {
          doctor: {
            columns: {
              password: false, // Exclude password
            },
          },
        },
      });

      console.log('appointments', appointments);

      return {success:true, message: 'Fetched appointments successfully', appointments };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(
        error?.message || 'Failed to fetch appointments',
      );
    }
  }

  async cancelAppointment(appointmentId: string): Promise<{success: boolean; message: string }> {
    try {
      const appointment = await this.db
        .select()
        .from(appointmentSchema)
        .where(eq(appointmentSchema.id, appointmentId))
        .limit(1);

      console.log('appointment', appointment);

      if (appointment.length === 0) {
        throw new BadRequestException('Appointment not found');
      }

      const docData = await this.db
        .select()
        .from(doctorSchema)
        .where(eq(doctorSchema.id, appointment[0].docId))
        .limit(1);

      if (docData.length === 0) {
        throw new BadRequestException('Doctor not found');
      }

      let slotsBooked = docData[0].slotsBooked
        ? docData[0].slotsBooked.split(',')
        : [];

      slotsBooked = slotsBooked.filter(
        (slot) => slot !== appointment[0].slotDate,
      );

      const updatedSlots = slotsBooked.join(',');
      const updatedDoctor = await this.db
        .update(doctorSchema)
        .set({ slotsBooked: updatedSlots })
        .where(eq(doctorSchema.id, appointment[0].docId))
        .returning();

      if (updatedDoctor.length === 0) {
        throw new BadRequestException("Failed to update doctor's slots");
      }

      await this.db
        .update(appointmentSchema)
        .set({ cancelled: true })
        .where(eq(appointmentSchema.id, appointmentId));

      return {success: true, message: 'Appointment cancelled successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error?.message || 'Failed to cancel appointment',
      );
    }
  }

  async getDoctorList(): Promise<{
    success: boolean;
    message: string;
    doctors: any[];
  }> {
    try {
      const doctors = await this.db
        .select({
          id: doctorSchema.id,
          name: doctorSchema.name,
          email: doctorSchema.email,
          image: doctorSchema.image,
          speciality: doctorSchema.speciality,
          degree: doctorSchema.degree,
          experience: doctorSchema.experience,
          about: doctorSchema.about,
          available: doctorSchema.available,
          fees: doctorSchema.fees,
          address: doctorSchema.address,
          date: doctorSchema.date,
          slots_booked: doctorSchema.slotsBooked,
          createdAt: doctorSchema.createdAt,
          updatedAt: doctorSchema.updatedAt,
        })
        .from(doctorSchema)
        .where(eq(doctorSchema.available, true));

      return {
        success: true,
        message: 'Fetched doctors successfully',
        doctors,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to fetch doctors',
      );
    }
  }


  

  async verifyRazorpayPayment(userId:string,payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }):Promise<{success:boolean;message:string}> {
    try {

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
      
   


      const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY!)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');


      if(expectedSignature !== razorpay_signature){
        throw new BadRequestException("Invalid payment Signature")
      }

         const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);


        const appointmentId = (orderInfo.receipt ?? "").replace("receipt_order_", "");

      if(orderInfo.status === 'paid'){
        await this.db
        .update(appointmentSchema)
        .set({ payment: true })
        .where(eq(appointmentSchema.id, appointmentId))
        .returning();


        return {
          success:true,
          message:"Payment Successfull"
        }
      }
      else{
        throw new BadRequestException("Payment Failed")
      }
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Payment verification failed',
      );
    }
  }


  async initiateRazorpayPayment(body:{appointmentId:string}):Promise<{success:boolean;message:string;order:any}> {
    try {

      const {appointmentId} = body;

      const appointment = await this.db.query.appointmentSchema.findMany({
        where: eq(appointmentSchema.id, appointmentId),
        with:{
          doctor:{
            columns:{
              password:false
            }
          },
          user:{
            columns:{
              password:false
            }
          }
        }
      })


      if (appointment.length === 0) {
        throw new BadRequestException('Appointment not found');
      }

      let appointmentData = appointment[0];

      if(appointmentData.cancelled){
        throw new BadRequestException('Appointment is cancelled');
      }


      const amount = appointmentData.amount;

      const order = await razorpayInstance.orders.create({
        amount: Number(amount) * 100, // Amount in paise
        currency: "INR",
        receipt: `${appointmentData.id}`,
      });

      return {
        success:true,
        message:'Razorpay order created successfully',
        order: order
      }
    } catch (error) {
      throw new BadRequestException(
        error?.error?.description || error?.message || 'Failed to create Razorpay order',
      );
      
    }
  }

}
