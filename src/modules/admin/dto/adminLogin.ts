import { ApiProperty } from "@nestjs/swagger";


export class AdminLogin {

    @ApiProperty({ example: 'admin@doctor-app.com' })
    email: string;

    @ApiProperty({ example: 'Admin@12345' })
    password: string;
}