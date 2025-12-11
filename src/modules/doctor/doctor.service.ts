import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { CloudinaryService } from "src/common/cloudinary/cloudinary.service";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { and, eq } from 'drizzle-orm';
import { AdminLogin } from "../admin/dto/adminLogin";
import { doctorSchema } from "../../db/schema/doctor.schema";
import { appointmentSchema } from "src/db/schema";
import { CreateDoctorDto } from "./dto/create-doctor";



@Injectable()
export class DoctorService {
    constructor(@Inject('DRIZZLE') private db: any, private readonly cloudinaryService: CloudinaryService) {}

    async login(loginDto:AdminLogin):Promise<{success:boolean;message:string;token:string;doctor:{email:string;role:string}}> {
        try {
            // Query doctor by email using Drizzle ORM
            const doctors = await this.db
                .select()
                .from(doctorSchema)
                .where(eq(doctorSchema.email, loginDto.email))
                .limit(1);

            if (doctors.length === 0) {
                throw new UnauthorizedException('Doctor not found');
            }

            const doctor = doctors[0];

            // Compare passwords
            const isMatch = await bcrypt.compare(loginDto.password, doctor.password);

            if (!isMatch) {
                throw new UnauthorizedException('Invalid doctor credentials');
            }

            // Generate JWT token
            const token = jwt.sign(
                { email: loginDto.email, role: 'doctor' },
                process.env.DOCTOR_JWT_SECRET,
                { expiresIn: process.env.DOCTOR_JWT_EXPIRES_IN || '7d' }
            );

            return {
                success:true,
                message: 'Doctor login successful',
                token,
                doctor: {
                    email: loginDto.email,
                    role: 'doctor'
                }
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException(error?.message || 'Doctor login failed');
        }
    }


    async getAppointments(doctorEmail:string):Promise<{success:boolean;message:string;appointments:any[]}> {
        try {


            const docData = await this.db
                .select()
                .from(doctorSchema)
                .where(eq(doctorSchema.email, doctorEmail))
                .limit(1);
            
            if(docData.length === 0) {
                throw new UnauthorizedException('Doctor not found');
            }

            const appointments = await this.db.query.appointmentSchema.findMany({
                where: eq(appointmentSchema.docId, docData[0].id), 
                with: {
                    user: {
                        columns: {
                            password: false,
                        }
                    },
                    doctor: {
                        columns: {
                            password: false,
                        }
                    },
                },
            });

            if(appointments.length === 0) {
                return {success:false, message: 'No appointments found for this doctor', appointments: [] };
            }

            return {success:true, message: 'Appointments found', appointments };

            
        } catch (error) {
            throw new UnauthorizedException(error?.message || 'Failed to retrieve appointments');
        }
    }


    async markAppointmentCompleted(body:{appointmentId:string}):Promise<{success:boolean;message:string}> {

        try {

            const {appointmentId} = body;

            const appointment = await this.db
            .update(appointmentSchema)
            .set({ isCompleted: true })
            .where(
                and(
                    eq(appointmentSchema.id, appointmentId),
                    eq(appointmentSchema.isCompleted, false)
                )
            );

            if(appointment.count === 0) {
                throw new UnauthorizedException('No pending appointments found to mark as completed');
            }

            return {success:true, message: 'Appointment marked as completed successfully' };
        } catch (error) {
            if(error instanceof UnauthorizedException) {
                throw error;
            }   
            throw new UnauthorizedException(error?.message || 'Failed to mark appointment as completed');
        }



    }


    async cancelAppointment(body:{appointmentId: string}): Promise<{success:boolean; message: string }> {
        try {
            
            const {appointmentId} = body;

            const appointment = await this.db
                .select()
                .from(appointmentSchema)
                .where(eq(appointmentSchema.id, appointmentId))
                .limit(1);

            if (appointment.length === 0) {
                throw new UnauthorizedException('Appointment not found');
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

            if (doctorData.length > 0) {
                const doctor = doctorData[0];
                   // You can add notification logic here if needed
                const slotBooked = doctor.slotsBooked ? doctor.slotsBooked.split(',') : [];
                const index = slotBooked.indexOf(appointment[0].slotDate);
                if (index > -1) {
                    slotBooked.splice(index, 1); // Remove the booked slot
                }
                const updatedSlotsBooked = slotBooked.join(',');

                await this.db
                    .update(doctorSchema)
                    .set({ slotsBooked: updatedSlotsBooked })
                    .where(eq(doctorSchema.id, doctor.id));
            }


            return {success:true, message: 'Appointment cancelled successfully' };
        } catch (error) {
            throw new UnauthorizedException(error?.message || 'Failed to cancel appointment');
        }
    }


    async doctorDashboard(doctorEmail:string):Promise<{success:boolean;message:string;data:any}> {
        try {

            const doctor = await this.db
                .select()
                .from(doctorSchema)
                .where(eq(doctorSchema.email, doctorEmail))
                .limit(1);

              const appointments = await this.db.query.appointmentSchema.findMany({
                where: eq(appointmentSchema.docId, doctor[0].id), 
                with: {
                  user: {
                    columns: {
                      firstName: true,
                      email: true, gender: true,
                      image: true,
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

             const userIds = appointments.map(app => app.userId);

             const uniqueUserIds = Array.from(new Set(userIds));
        
              const data = {
                    totalPatients: uniqueUserIds.length,
                    appointments:appointments.length,
                    latestAppointments:appointments.reverse().slice(0,5)
              };
              return {    
                success:true,    
                message: 'Admin dashboard data retrieved successfully',
                data,
              }
        } catch (error) {
            throw new UnauthorizedException(error?.message || 'Failed to retrieve doctor dashboard data');
        }
    }

    async getDoctorProfile(doctorEmail:string):Promise<{success:boolean;message:string;doctor:CreateDoctorDto}> {
        try {
            const docData = await this.db.query.doctorSchema.findMany({
                where: eq(doctorSchema.email, doctorEmail),
                columns: {
                    password: false
                }
            })

            if(docData.length === 0) {
                throw new UnauthorizedException('Doctor not found');
            }

            return {
                success:true,
                message: 'Doctor profile data retrieved successfully',
                doctor: docData[0]
            };
        } catch (error) {
            throw new UnauthorizedException(error?.message || 'Failed to retrieve doctor profile data');
        }
    }

    async updateDoctorProfile(doctorEmail:string, updateData:CreateDoctorDto):Promise<{success:boolean;message:string;doctor:CreateDoctorDto}> {
        try {
            const docData = await this.db
                .select()
                .from(doctorSchema)
                .where(eq(doctorSchema.email, doctorEmail))
                .limit(1);


            if(docData.length === 0) {
                throw new UnauthorizedException('Doctor not found');
            }


            await this.db
                .update(doctorSchema)
                .set(updateData)
                .where(eq(doctorSchema.email, doctorEmail));
            

            const updatedDocData = await this.db.query.doctorSchema.findMany({
                where: eq(doctorSchema.email, doctorEmail),
                columns: {
                    password: false
                }
            });
            
            return {
                success:true,
                message: 'Doctor profile updated successfully',
                doctor: updatedDocData[0]
            };
        } catch (error) {

            throw new UnauthorizedException(error?.message || 'Failed to update doctor profile data');
            
        }
    }





}