import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';

export class RecommendDoctorsDto {
  @ApiProperty({ description: 'Patient symptoms description', example: 'I have headache and fever for 3 days' })
  @IsString()
  @IsNotEmpty()
  symptoms: string;

  @ApiPropertyOptional({ description: 'Maximum number of doctors to return', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class GetOptimalSlotsDto {
  @ApiProperty({ description: 'Doctor ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ description: 'Date for slots (YYYY-MM-DD)', example: '2025-01-15' })
  @IsString()
  @IsNotEmpty()
  date: string;
}

export class PredictNoShowDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Doctor ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiPropertyOptional({ description: 'Appointment date (YYYY-MM-DD)', example: '2025-01-15' })
  @IsOptional()
  @IsString()
  slotDate?: string;

  @ApiPropertyOptional({ description: 'Appointment time slot', example: '10:00 AM' })
  @IsOptional()
  @IsString()
  slotTime?: string;
}

export class HealthInsightsDto {
  @ApiProperty({ description: 'Symptoms to analyze', example: 'chest pain and shortness of breath' })
  @IsString()
  @IsNotEmpty()
  symptoms: string;
}
