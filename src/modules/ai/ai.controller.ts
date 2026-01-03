import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { RecommendDoctorsDto, GetOptimalSlotsDto, PredictNoShowDto, HealthInsightsDto } from "./dto/ai.dto";
import { AuthGuard } from "../auth/guards/auth.guard";

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommend-doctors')
  @ApiOperation({ summary: 'Get AI-powered doctor recommendations based on symptoms' })
  @ApiResponse({ status: 200, description: 'List of recommended doctors with match scores' })
  async recommendDoctors(@Body() dto: RecommendDoctorsDto) {
    const doctors = await this.aiService.recommendDoctors(dto.symptoms, dto.limit);
    return {
      success: true,            
      message: 'Doctors recommended successfully',
      data: doctors,
    };
  }

  @Get('optimal-slots')
  @ApiOperation({ summary: 'Get AI-recommended optimal appointment slots' })
  @ApiResponse({ status: 200, description: 'List of available slots ranked by recommendation score' })
  async getOptimalSlots(@Query() dto: GetOptimalSlotsDto) {
    const slots = await this.aiService.getOptimalSlots(dto.doctorId, dto.date);
    return {
      success: true,
      message: 'Optimal slots retrieved successfully',
      data: slots,
    };
  }

  @Post('predict-no-show')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ML-powered prediction of patient no-show probability' })
  @ApiResponse({ status: 200, description: 'No-show prediction with risk factors and feature importance' })
  async predictNoShow(@Body() dto: PredictNoShowDto) {
    const prediction = await this.aiService.predictNoShow(
      dto.userId,
      dto.doctorId,
      dto.slotDate,
      dto.slotTime,
    );
    return {
      success: true,
      message: 'No-show prediction generated using ML model',
      data: prediction,
    };
  }

  @Get('model-stats')
  @ApiOperation({ summary: 'Get ML model statistics and feature information' })
  @ApiResponse({ status: 200, description: 'Model training status and feature list' })
  async getModelStats() {
    const stats = await this.aiService.getModelStats();
    return {
      success: true,
      message: 'Model statistics retrieved',
      data: stats,
    };
  }

  @Post('retrain-model')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrain no-show prediction model with real appointment data' })
  @ApiResponse({ status: 200, description: 'Model retrained successfully' })
  async retrainModel() {
    const result = await this.aiService.retrainModel();
    return {
      success: true,
      message: result.message,
      data: {
        appointmentsUsed: result.appointmentsUsed,
      },
    };
  }

  @Post('health-insights')
  @ApiOperation({ summary: 'Get AI health insights from symptoms' })
  @ApiResponse({ status: 200, description: 'Health insights with severity assessment and recommendations' })
  async getHealthInsights(@Body() dto: HealthInsightsDto) {
    const insights = await this.aiService.getHealthInsights(dto.symptoms);
    return {
      success: true,
      message: 'Health insights generated',
      data: insights,
    };
  }
}