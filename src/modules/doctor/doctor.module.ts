import { Module } from "@nestjs/common";
import { DoctorController } from "./doctor.controller";
import { DoctorService } from "./doctor.service";
import { DatabaseModule } from "src/db/database.module";
import { CloudinaryModule } from "src/common/cloudinary/cloudinary.module";



@Module({
    imports: [DatabaseModule,CloudinaryModule],
    controllers: [DoctorController],
    providers: [DoctorService],
    exports: [DoctorService]
})
export class DoctorModule {}