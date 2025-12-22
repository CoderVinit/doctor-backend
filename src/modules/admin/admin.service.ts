import { Injectable, UnauthorizedException, Inject, BadRequestException, ConflictException, Req } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { LoginDto } from '../auth/dto';
import { CreateDoctorDto } from '../doctor/dto/create-doctor';
import { doctorSchema } from '../../db/schema/doctor.schema';
import { appointmentSchema } from '../../db/schema/appointment.schema';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { userSchema } from 'src/db/schema';

@Injectable()
export class AdminService {
  constructor(@Inject('DRIZZLE') private db: any, private readonly cloudinaryService: CloudinaryService) {}
  async login(loginDto: LoginDto): Promise<{success:boolean, message: string; token: string; admin: { email: string; role: string } }> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      // Validate that admin credentials are configured
      if (!adminEmail || !adminPassword) {
        throw new Error('Admin credentials not configured in environment variables');
      }

      // Validate credentials
      if (loginDto.email !== adminEmail || loginDto.password !== adminPassword) {
        throw new UnauthorizedException('Invalid admin credentials');
      }

      // Generate JWT token with admin role
      const token = jwt.sign(
        { email: adminEmail, role: 'admin' },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d' }
      );

      return {
        success:true,
        message: 'Admin login successful',
        token,
        admin: {
          email: adminEmail,
          role: 'admin',
        },
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(error?.message || 'Admin login failed');
    }
  }

  async addDoctor(doctorDto: CreateDoctorDto, image?: Express.Multer.File): Promise<{success: boolean; message: string; doctor: any }> {
    try {
      // Validate required fields
      if (!doctorDto.name || !doctorDto.email || !doctorDto.password || !doctorDto.speciality || !doctorDto.degree) {
        throw new BadRequestException('Missing required fields: name, email, password, specialty, degree');
      }

      // Check if doctor already exists
      const existingDoctor = await this.db
        .select()
        .from(doctorSchema)
        .where(eq(doctorSchema.email, doctorDto.email));

      if (existingDoctor.length > 0) {
        throw new ConflictException('Doctor with this email already exists');
      }

      let imageUrl = '';

      if (image) {
        try {
          // Pass the Multer file object so CloudinaryService can handle buffer or path
          imageUrl = await this.cloudinaryService.uploadImage(image);
        } catch (error: any) {
          throw new BadRequestException(`Image upload failed: ${error.message}`);
        }
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(doctorDto.password, salt);

      // Prepare doctor data
      const newDoctor = {
        name: doctorDto.name,
        email: doctorDto.email,
        password: hashedPassword,
        address: doctorDto.address || '',
        speciality: doctorDto.speciality,
        degree: doctorDto.degree,
        experience: String(doctorDto.experience || 0),
        about: doctorDto.about || '',
        fees: String(doctorDto.fees || 0),
        image: imageUrl || "", // Default empty image, can be updated via upload
        available: true,
        date: String(Date.now()),
        slotsBooked: '',
      };

      // Insert doctor into database
      const result = await this.db
        .insert(doctorSchema)
        .values(newDoctor)
        .returning();

      // Remove sensitive data from response
      const doctorResponse = { ...result[0] };
      delete doctorResponse.password;

      return {
        success:true,
        message: 'Doctor added successfully',
        doctor: doctorResponse,
      };
    } catch (error: any) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error?.message || 'Failed to add doctor');
    }
  }


  async getDoctors(doctorDto: Partial<CreateDoctorDto>): Promise<{success:boolean;message: string; doctors: any[]}> {
    try {
     
      const doctors = await this.db
        .select()
        .from(doctorSchema)

      return {
        success:true,
        message: 'Doctors retrieved successfully',
        doctors: doctors,
      }
      
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to retrieve doctors'); 
    }
  }


  async changeAvailability(docId: string): Promise<{success: boolean; message: string}> {
    try {

      console.log('Toggling availability for doctor ID:', docId);

      const doctor = await this.db
        .select()
        .from(doctorSchema)
        .where(eq(doctorSchema.id, docId))
        .limit(1);

      if (doctor.length === 0) {
        throw new BadRequestException('Doctor not found');
      }

      await this.db
        .update(doctorSchema)
        .set({ available: !doctor[0].available })
        .where(eq(doctorSchema.id, docId));

      return {
        success:true,
        message: 'Doctor availability updated successfully',
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error?.message || 'Failed to update doctor availability');
    }
  }


  async getAllAppointments(): Promise<{success: boolean; message: string; appointments: any[] }> {
    try {
      
      const appointments = await this.db.query.appointmentSchema.findMany({
        with: {
          user: {
            columns: {
              firstName: true,
              email: true,
              gender: true,
              dob: true,
            }
          },
          doctor: {
            columns: {
              name: true,
              email: true,
              speciality: true,
              degree: true,
              image: true,
              fees: true,
            }
          },
        },
      })

      return {
        success: true,
        message: 'Appointments retrieved successfully',
        appointments: appointments,
      }
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to retrieve appointments');
    }
  }

  async cancelAppointment(appointmentId: string): Promise<{ message: string }> {
    try {
      
      const appointment = await this.db
        .select()
        .from(appointmentSchema)
        .where(eq(appointmentSchema.id, appointmentId))
        .limit(1);

        console.log('Appointment fetched for cancellation:', appointment);

      if (appointment.length === 0) {
        throw new BadRequestException('Appointment not found');
      }

      await this.db
        .update(appointmentSchema)
        .set({ cancelled: true })
        .where(eq(appointmentSchema.id, appointmentId));

      const doctorData = await this.db
        .select()
        .from(doctorSchema)
        .where(eq(doctorSchema.id, appointment[0].docId))
        .limit(1);

      console.log('Doctor data fetched for appointment cancellation:', doctorData);

      if (doctorData.length > 0) {
        const doctor = doctorData[0];

        const slotBookedArray = doctor.slotsBooked? doctor.slotsBooked.split(',') : [];
        const index = slotBookedArray.indexOf(appointment[0].slotDate);
        if (index > -1) {
          slotBookedArray.splice(index, 1); // Remove the booked slot
        }
        const updatedSlotsBooked = slotBookedArray.join(',');

        await this.db
          .update(doctorSchema)
          .set({ slotsBooked: updatedSlotsBooked })
          .where(eq(doctorSchema.id, doctor.id));
      }

      return {
        message: 'Appointment cancelled successfully',
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error?.message || 'Failed to cancel appointment');
    }
  }

  async adminDashboard():Promise<{success:boolean,message:string;data:any}> {
    try {
      const doctors = await this.db
        .select()
        .from(doctorSchema);

      const appointments = await this.db.query.appointmentSchema.findMany({
        with: {
          user: {
            columns: {
              firstName: true,
              email: true, gender: true,
            }
          },
          doctor: {
            columns: {
              name: true,
              email: true,
              speciality: true,
              degree: true,
              image: true,
              fees: true,
            }
          },
        },
      })

      const users = await this.db
        .select()
        .from(userSchema);

      const data = {
        doctors:doctors.length,
            patients:users.length,
            appointments:appointments.length,
            latestAppointments:appointments.reverse().slice(0,5)
      };
      return {    
        success:true,    
        message: 'Admin dashboard data retrieved successfully',
        data,
      }

    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to retrieve admin dashboard data');
    }
  }

}
