import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'vinitpatel8896@gmail.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: '123456789', description: 'User password' })
  password: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  lastName: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'User phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'User address' })
  address?: string;

  @ApiPropertyOptional({ example: 'male', description: 'User gender' })
  gender?: string;

  @ApiPropertyOptional({ example: 'user', enum: ['user', 'doctor', 'admin'], description: 'User role (user, doctor, or admin)' })
  role?: 'user' | 'doctor' | 'admin';
}
