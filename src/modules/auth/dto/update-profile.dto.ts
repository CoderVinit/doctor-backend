import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  firstName?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'User phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St, City, State', description: 'User address' })
  address?: string;

  @ApiPropertyOptional({ example: '1990-01-15', description: 'Date of birth' })
  dob?: string;

  @ApiPropertyOptional({ example: 'male', enum: ['male', 'female', 'other'], description: 'User gender' })
  gender?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Profile image file' })
  image?: string;
}
