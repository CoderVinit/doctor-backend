import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/db/database.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { DoctorRecommendationService } from "./doctor-recommendation.service";
import { SlotRecommendationService } from "./slot-recommendation.service";
import { NoShowPredictionService } from "./no-show.service";

@Module({
  imports: [DatabaseModule],
  controllers: [AiController],
  providers: [
    AiService,
    DoctorRecommendationService,
    SlotRecommendationService,
    NoShowPredictionService,
  ],
  exports: [AiService],
})
export class AiModule {}