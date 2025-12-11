import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'vinitpatel8896@gmail.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: '123456789', description: 'User password' })
  password: string;
}
