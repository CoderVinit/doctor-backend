import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

//  name, email, password, address, speciality,degree,experience, about, fees


export class CreateDoctorDto {
    @ApiProperty({ example: 'Dr. John Doe' })
    name: string;
    
    @ApiProperty({ example: 'dr.johndoe@example.com' })
    email: string;
    
    @ApiProperty({ example: 'password123' })
    password: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Doctor Profile image' })
    image?: string;
    
    @ApiProperty({ example: '123 Medical St, Health City' })
    address: string;
    
    @ApiProperty({ example: 10, description: 'Years of experience' })
    experience: number;
    
    @ApiProperty({ example: 'Cardiology' })
    speciality: string;

    @ApiProperty({ example: ['Monday', 'Wednesday', 'Friday'], description: 'Available days' })
    availableDays: string[];

    @ApiProperty({ example: '9:00 AM - 5:00 PM', description: 'Available time slots' })
    availableTimeSlots: string;

    @ApiProperty({ example: 'MD, PhD' })
    degree: string;

    @ApiProperty({ example: 'Experienced cardiologist with a passion for patient care.' })
    about: string;

    @ApiProperty({ example: 150, description: 'Consultation fees in USD' })
    fees: number;
}