import { ApiProperty } from "@nestjs/swagger";


export class BookAppointmentDto {

    @ApiProperty({description:"ID of the user booking the appointment", example:"a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"})
    userId: string;

    @ApiProperty({description:"ID of the doctor for the appointment", example:"p5o4n3m2-l1k0-j9i8-h7g6-f5e4d3c2b1a0"})
    docId: string;

    @ApiProperty({description:"Date of the appointment slot", example:"2024-07-15"})
    slotDate: string;

    @ApiProperty({description:"Time of the appointment slot", example:"10:00 AM - 10:30 AM"})
    slotTime: string;

    @ApiProperty({description:"Appointment amount/fees", example:"150.00"})
    amount: string;

    @ApiProperty({description:"Unix timestamp for the appointment", example:"1720982400"})
    date: number;

    @ApiProperty({description:"Whether the appointment is cancelled", example:false, required:false})
    cancelled?: boolean;

    @ApiProperty({description:"Whether payment has been made", example:false, required:false})
    payment?: boolean;

    @ApiProperty({description:"Whether the appointment has been completed", example:false, required:false})
    isCompleted?: boolean;

}