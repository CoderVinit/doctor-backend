import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DoctorRecommendationService } from './doctor-recommendation.service';
import { SlotRecommendationService, TimeSlot } from './slot-recommendation.service';
import { NoShowPredictionService, NoShowPrediction } from './no-show.service';
import { doctorSchema } from 'src/db/schema/doctor.schema';
import { appointmentSchema } from 'src/db/schema/appointment.schema';
import { ilike, or, eq, and, sql, desc } from 'drizzle-orm';

@Injectable()
export class AiService {
  constructor(
    @Inject('DRIZZLE')
    private db: NodePgDatabase<Record<string, never>>,
    private doctorRecommendation: DoctorRecommendationService,
    private slotRecommendation: SlotRecommendationService,
    private noShowPrediction: NoShowPredictionService,
  ) {}

  async recommendDoctors(symptoms: string, limit = 5) {
    const keywords = this.doctorRecommendation.extractKeywords(symptoms);
    
    if (keywords.length === 0) {
      // Return top-rated available doctors if no keywords
      return this.db
        .select()
        .from(doctorSchema)
        .where(eq(doctorSchema.available, true))
        .orderBy(desc(doctorSchema.rating))
        .limit(limit);
    }

    // Search doctors by speciality, about, or keywords matching symptoms
    const conditions = keywords.flatMap(keyword => [
      ilike(doctorSchema.speciality, `%${keyword}%`),
      ilike(doctorSchema.about, `%${keyword}%`),
      sql`${keyword} = ANY(${doctorSchema.keywords})`,
    ]);

    const doctors = await this.db
      .select()
      .from(doctorSchema)
      .where(and(eq(doctorSchema.available, true), or(...conditions)))
      .orderBy(desc(doctorSchema.rating))
      .limit(limit);

    // Score and rank doctors
    const scoredDoctors = doctors.map(doctor => ({
      ...doctor,
      matchScore: this.doctorRecommendation.calculateMatchScore(doctor, keywords),
    }));

    return scoredDoctors.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getOptimalSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    // Get doctor's booked slots for the date
    const appointments = await this.db
      .select()
      .from(appointmentSchema)
      .where(
        and(
          eq(appointmentSchema.docId, doctorId),
          eq(appointmentSchema.slotDate, date),
          eq(appointmentSchema.cancelled, false),
        ),
      );

    const bookedSlots = appointments.map(apt => apt.slotTime);
    return this.slotRecommendation.getAvailableSlots(bookedSlots, date);
  }

  async predictNoShow(
    userId: string,
    doctorId: string,
    slotDate?: string,
    slotTime?: string,
  ): Promise<NoShowPrediction> {
    // Get user's appointment history
    const userAppointments = await this.db
      .select()
      .from(appointmentSchema)
      .where(eq(appointmentSchema.userId, userId));

    return this.noShowPrediction.calculateNoShowProbability(
      userAppointments,
      doctorId,
      slotDate,
      slotTime,
    );
  }

  async getModelStats() {
    return this.noShowPrediction.getModelStats();
  }

  async retrainModel() {
    // Get all historical appointments for retraining
    const allAppointments = await this.db.select().from(appointmentSchema);

    await this.noShowPrediction.trainModelWithRealData(allAppointments);

    return {
      success: true,
      message: 'Model retrained successfully',
      appointmentsUsed: allAppointments.length,
    };
  }

  async getHealthInsights(symptoms: string) {
    const keywords = this.doctorRecommendation.extractKeywords(symptoms);
    
    // Map common symptoms to specialities
    const specialityMapping = this.doctorRecommendation.getSpecialityMapping();
    
    const suggestedSpecialities = new Set<string>();
    keywords.forEach(keyword => {
      Object.entries(specialityMapping).forEach(([speciality, symptomKeywords]) => {
        if (symptomKeywords.some(sk => keyword.includes(sk) || sk.includes(keyword))) {
          suggestedSpecialities.add(speciality);
        }
      });
    });

    return {
      extractedKeywords: keywords,
      suggestedSpecialities: Array.from(suggestedSpecialities),
      severity: this.assessSeverity(keywords),
      recommendation: this.getGeneralRecommendation(keywords),
    };
  }

  private assessSeverity(keywords: string[]): 'low' | 'medium' | 'high' {
    const highSeverityKeywords = ['severe', 'emergency', 'bleeding', 'unconscious', 'chest pain', 'breathing'];
    const mediumSeverityKeywords = ['fever', 'pain', 'infection', 'swelling', 'persistent'];
    
    if (keywords.some(k => highSeverityKeywords.some(hk => k.includes(hk)))) {
      return 'high';
    }
    if (keywords.some(k => mediumSeverityKeywords.some(mk => k.includes(mk)))) {
      return 'medium';
    }
    return 'low';
  }

  private getGeneralRecommendation(keywords: string[]): string {
    const severity = this.assessSeverity(keywords);
    
    if (severity === 'high') {
      return 'Your symptoms suggest you should seek immediate medical attention. Please visit an emergency room or call emergency services.';
    }
    if (severity === 'medium') {
      return 'We recommend scheduling an appointment with a specialist soon. In the meantime, rest and stay hydrated.';
    }
    return 'Your symptoms appear mild. Consider booking a consultation if they persist for more than a few days.';
  }
}
