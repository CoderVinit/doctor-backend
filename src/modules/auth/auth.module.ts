import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { DatabaseModule } from "../../db/database.module";
import { CloudinaryModule } from "../../common/cloudinary/cloudinary.module";





@Module({
    imports: [DatabaseModule, CloudinaryModule],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}