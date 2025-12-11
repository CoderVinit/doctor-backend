import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { DatabaseModule } from "src/db/database.module";
import { CloudinaryModule } from "src/common/cloudinary/cloudinary.module";
import { CloudinaryService } from "src/common/cloudinary/cloudinary.service";




@Module({
    imports: [DatabaseModule,CloudinaryModule],
  providers: [AdminService],
  exports: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}