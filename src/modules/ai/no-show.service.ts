import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import LogisticRegression from 'ml-logistic-regression';
import { Matrix } from 'ml-matrix';

export interface AppointmentHistory {
  id: string;
  cancelled: boolean | null;
  isCompleted: boolean | null;
  docId: string;
  slotDate: string;
  slotTime: string;
  payment?: boolean | null;
  amount?: string | null;
}

export interface NoShowPrediction {
  probability: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
  featureImportance: Record<string, number>;
  modelConfidence: number;
}

interface TrainingData {
  features: number[][];
  labels: number[];
}

@Injectable()
export class NoShowPredictionService implements OnModuleInit {
  private readonly logger = new Logger(NoShowPredictionService.name);
  private model: LogisticRegression | null = null;
  private isModelTrained = false;
  private featureNames = [
    'cancellationRate',
    'completionRate',
    'totalAppointments',
    'recentCancellations',
    'daysSinceLastAppointment',
    'isFirstVisitToDoctor',
    'averageLeadTime',
    'paymentRate',
    'morningSlot',
    'afternoonSlot',
    'eveningSlot',
    'isWeekend',
  ];

  onModuleInit() {
    // Initialize with synthetic training data
    // In production, this would be trained on real historical data
    this.trainModelWithSyntheticData();
  }

  private trainModelWithSyntheticData() {
    this.logger.log('Training no-show prediction model...');

    // Generate synthetic training data based on known patterns
    const trainingData = this.generateSyntheticTrainingData(500);

    try {
      const X = new Matrix(trainingData.features);
      const y = Matrix.columnVector(trainingData.labels);

      this.model = new LogisticRegression({
        numSteps: 1000,
        learningRate: 0.1,
      });

      this.model.train(X, y);
      this.isModelTrained = true;
      this.logger.log('Model trained successfully with synthetic data');
    } catch (error) {
      this.logger.error('Failed to train model:', error);
      this.isModelTrained = false;
    }
  }

  private generateSyntheticTrainingData(samples: number): TrainingData {
    const features: number[][] = [];
    const labels: number[] = [];

    for (let i = 0; i < samples; i++) {
      // Generate realistic feature combinations
      const cancellationRate = Math.random();
      const completionRate = Math.random();
      const totalAppointments = Math.floor(Math.random() * 20);
      const recentCancellations = Math.floor(Math.random() * 3);
      const daysSinceLastAppointment = Math.floor(Math.random() * 90);
      const isFirstVisitToDoctor = Math.random() > 0.7 ? 1 : 0;
      const averageLeadTime = Math.floor(Math.random() * 14);
      const paymentRate = Math.random();
      const morningSlot = Math.random() > 0.66 ? 1 : 0;
      const afternoonSlot = morningSlot === 0 && Math.random() > 0.5 ? 1 : 0;
      const eveningSlot = morningSlot === 0 && afternoonSlot === 0 ? 1 : 0;
      const isWeekend = Math.random() > 0.7 ? 1 : 0;

      features.push([
        cancellationRate,
        completionRate,
        Math.min(totalAppointments / 20, 1), // Normalize
        recentCancellations / 3,
        Math.min(daysSinceLastAppointment / 90, 1),
        isFirstVisitToDoctor,
        Math.min(averageLeadTime / 14, 1),
        paymentRate,
        morningSlot,
        afternoonSlot,
        eveningSlot,
        isWeekend,
      ]);

      // Calculate label based on realistic no-show patterns
      let noShowProbability = 0.15; // Base rate

      // High cancellation rate increases no-show
      noShowProbability += cancellationRate * 0.3;

      // Low completion rate increases no-show
      noShowProbability += (1 - completionRate) * 0.2;

      // Recent cancellations are strong indicator
      noShowProbability += recentCancellations * 0.15;

      // First visits have higher no-show
      noShowProbability += isFirstVisitToDoctor * 0.1;

      // Longer lead time increases no-show
      noShowProbability += (averageLeadTime / 14) * 0.1;

      // Prepaid appointments have lower no-show
      noShowProbability -= paymentRate * 0.2;

      // Evening slots have higher no-show
      noShowProbability += eveningSlot * 0.05;

      // Weekend appointments have higher no-show
      noShowProbability += isWeekend * 0.1;

      // Clamp and add noise
      noShowProbability = Math.max(0, Math.min(1, noShowProbability));
      noShowProbability += (Math.random() - 0.5) * 0.1;

      labels.push(Math.random() < noShowProbability ? 1 : 0);
    }

    return { features, labels };
  }

  async trainModelWithRealData(historicalAppointments: AppointmentHistory[]) {
    if (historicalAppointments.length < 50) {
      this.logger.warn('Insufficient data for training. Need at least 50 appointments.');
      return;
    }

    this.logger.log(`Training model with ${historicalAppointments.length} real appointments...`);

    const trainingData = this.prepareTrainingData(historicalAppointments);

    try {
      const X = new Matrix(trainingData.features);
      const y = Matrix.columnVector(trainingData.labels);

      this.model = new LogisticRegression({
        numSteps: 1000,
        learningRate: 0.1,
      });

      this.model.train(X, y);
      this.isModelTrained = true;
      this.logger.log('Model retrained successfully with real data');
    } catch (error) {
      this.logger.error('Failed to train model with real data:', error);
    }
  }

  private prepareTrainingData(appointments: AppointmentHistory[]): TrainingData {
    const patientAppointments = new Map<string, AppointmentHistory[]>();

    // Group appointments by some patient identifier (using docId as proxy for demo)
    appointments.forEach(apt => {
      const key = apt.id.substring(0, 8); // Use part of ID as patient proxy
      if (!patientAppointments.has(key)) {
        patientAppointments.set(key, []);
      }
      patientAppointments.get(key)!.push(apt);
    });

    const features: number[][] = [];
    const labels: number[] = [];

    appointments.forEach(apt => {
      const patientHistory = patientAppointments.get(apt.id.substring(0, 8)) || [];
      const priorAppointments = patientHistory.filter(
        a => new Date(a.slotDate) < new Date(apt.slotDate),
      );

      const featureVector = this.extractFeatures(priorAppointments, apt.docId, apt.slotDate, apt.slotTime);
      features.push(featureVector);

      // Label: 1 if no-show (cancelled or not completed), 0 if attended
      const isNoShow = apt.cancelled || !apt.isCompleted;
      labels.push(isNoShow ? 1 : 0);
    });

    return { features, labels };
  }

  extractFeatures(
    appointments: AppointmentHistory[],
    doctorId: string,
    slotDate: string,
    slotTime: string,
  ): number[] {
    const totalAppointments = appointments.length;

    // Cancellation rate
    const cancelledCount = appointments.filter(a => a.cancelled).length;
    const cancellationRate = totalAppointments > 0 ? cancelledCount / totalAppointments : 0;

    // Completion rate
    const completedCount = appointments.filter(a => a.isCompleted).length;
    const nonCancelledCount = appointments.filter(a => !a.cancelled).length;
    const completionRate = nonCancelledCount > 0 ? completedCount / nonCancelledCount : 0.5;

    // Recent cancellations (last 3)
    const recentAppointments = appointments.slice(-3);
    const recentCancellations = recentAppointments.filter(a => a.cancelled).length;

    // Days since last appointment
    let daysSinceLastAppointment = 30;
    if (appointments.length > 0) {
      const lastApt = appointments[appointments.length - 1];
      const lastDate = new Date(lastApt.slotDate);
      const currentDate = new Date(slotDate);
      daysSinceLastAppointment = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    // First visit to doctor
    const doctorVisits = appointments.filter(a => a.docId === doctorId);
    const isFirstVisitToDoctor = doctorVisits.length === 0 ? 1 : 0;

    // Average lead time (not available in current data, use default)
    const averageLeadTime = 7;

    // Payment rate
    const paidAppointments = appointments.filter(a => a.payment).length;
    const paymentRate = totalAppointments > 0 ? paidAppointments / totalAppointments : 0.5;

    // Time slot features
    const hour = this.parseHour(slotTime);
    const morningSlot = hour >= 9 && hour < 12 ? 1 : 0;
    const afternoonSlot = hour >= 12 && hour < 17 ? 1 : 0;
    const eveningSlot = hour >= 17 ? 1 : 0;

    // Weekend feature
    const appointmentDate = new Date(slotDate);
    const dayOfWeek = appointmentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;

    return [
      cancellationRate,
      completionRate,
      Math.min(totalAppointments / 20, 1),
      recentCancellations / 3,
      Math.min(daysSinceLastAppointment / 90, 1),
      isFirstVisitToDoctor,
      Math.min(averageLeadTime / 14, 1),
      paymentRate,
      morningSlot,
      afternoonSlot,
      eveningSlot,
      isWeekend,
    ];
  }

  private parseHour(slotTime: string): number {
    try {
      const [time, period] = slotTime.split(' ');
      let [hours] = time.split(':').map(Number);

      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      return hours;
    } catch {
      return 12; // Default to noon
    }
  }

  calculateNoShowProbability(
    appointments: AppointmentHistory[],
    doctorId: string,
    slotDate?: string,
    slotTime?: string,
  ): NoShowPrediction {
    const factors: string[] = [];
    const currentDate = slotDate || new Date().toISOString().split('T')[0];
    const currentTime = slotTime || '10:00 AM';

    // Extract features for prediction
    const featureVector = this.extractFeatures(appointments, doctorId, currentDate, currentTime);

    let probability: number;
    let modelConfidence = 0.5;

    if (this.isModelTrained && this.model) {
      // Use ML model for prediction
      try {
        const X = new Matrix([featureVector]);
        const prediction = this.model.predict(X);
        const probabilities = this.model.classifiers[0].testExamples(X);

        probability = probabilities.get(0, 0);
        modelConfidence = Math.abs(probability - 0.5) * 2; // Higher when further from 0.5
      } catch (error) {
        this.logger.warn('ML prediction failed, using fallback:', error);
        probability = this.fallbackPrediction(featureVector);
      }
    } else {
      probability = this.fallbackPrediction(featureVector);
    }

    // Analyze feature importance
    const featureImportance = this.analyzeFeatureImportance(featureVector);

    // Generate factors based on features
    this.generateFactors(featureVector, factors);

    // Normalize probability
    probability = Math.max(0, Math.min(1, probability));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (probability < 0.25) {
      riskLevel = 'low';
    } else if (probability < 0.5) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskLevel, factors, featureVector);

    return {
      probability: Math.round(probability * 100) / 100,
      riskLevel,
      factors,
      recommendations,
      featureImportance,
      modelConfidence: Math.round(modelConfidence * 100) / 100,
    };
  }

  private fallbackPrediction(features: number[]): number {
    // Weighted sum fallback when ML model isn't available
    const weights = [0.25, -0.2, -0.1, 0.2, 0.05, 0.1, 0.08, -0.15, -0.05, 0, 0.05, 0.08];
    let probability = 0.2; // Base rate

    for (let i = 0; i < features.length; i++) {
      probability += features[i] * weights[i];
    }

    return probability;
  }

  private analyzeFeatureImportance(features: number[]): Record<string, number> {
    const importance: Record<string, number> = {};

    // Calculate relative importance based on feature values and known impact
    const baseImpact = [0.25, 0.2, 0.1, 0.2, 0.05, 0.1, 0.08, 0.15, 0.05, 0.03, 0.07, 0.08];

    this.featureNames.forEach((name, i) => {
      importance[name] = Math.round(features[i] * baseImpact[i] * 100) / 100;
    });

    return importance;
  }

  private generateFactors(features: number[], factors: string[]) {
    const [
      cancellationRate,
      completionRate,
      totalAppointmentsNorm,
      recentCancellationsNorm,
      ,
      isFirstVisitToDoctor,
      ,
      paymentRate,
      ,
      ,
      eveningSlot,
      isWeekend,
    ] = features;

    if (cancellationRate > 0.3) {
      factors.push(`High cancellation history (${Math.round(cancellationRate * 100)}%)`);
    } else if (cancellationRate > 0.15) {
      factors.push(`Moderate cancellation history (${Math.round(cancellationRate * 100)}%)`);
    }

    if (completionRate < 0.7) {
      factors.push(`Low completion rate (${Math.round(completionRate * 100)}%)`);
    }

    if (totalAppointmentsNorm < 0.15) {
      factors.push('Limited appointment history');
    }

    if (recentCancellationsNorm >= 0.66) {
      factors.push('Recent cancellation pattern detected');
    }

    if (isFirstVisitToDoctor === 1) {
      factors.push('First visit to this doctor');
    }

    if (paymentRate < 0.3) {
      factors.push('Low prepayment history');
    } else if (paymentRate > 0.7) {
      factors.push('Good prepayment history (reduces risk)');
    }

    if (eveningSlot === 1) {
      factors.push('Evening slot (higher no-show tendency)');
    }

    if (isWeekend === 1) {
      factors.push('Weekend appointment (higher no-show tendency)');
    }

    if (factors.length === 0) {
      factors.push('No significant risk factors identified');
    }
  }

  private generateRecommendations(
    riskLevel: 'low' | 'medium' | 'high',
    factors: string[],
    features: number[],
  ): string[] {
    const recommendations: string[] = [];
    const [, , , , , isFirstVisitToDoctor, , paymentRate] = features;

    if (riskLevel === 'high') {
      recommendations.push('Send appointment confirmation request 48 hours before');
      recommendations.push('Send multiple reminders (SMS + Email + App notification)');
      recommendations.push('Consider requiring deposit or prepayment');
      recommendations.push('Add to waitlist backup for double-booking consideration');
      recommendations.push('Schedule follow-up confirmation call');
    } else if (riskLevel === 'medium') {
      recommendations.push('Send reminder 24 hours before appointment');
      recommendations.push('Enable easy rescheduling via app/SMS');
      recommendations.push('Send day-of reminder 2 hours before');
    } else {
      recommendations.push('Standard reminder 24 hours before is sufficient');
      recommendations.push('Consider loyalty rewards for consistent attendance');
    }

    if (isFirstVisitToDoctor === 1) {
      recommendations.push('Send welcome package with clinic directions and parking info');
      recommendations.push('Offer virtual check-in option to reduce wait anxiety');
    }

    if (paymentRate < 0.3) {
      recommendations.push('Offer prepayment discount to incentivize commitment');
    }

    return recommendations;
  }

  analyzePatternsByTimeSlot(appointments: AppointmentHistory[]): Record<string, number> {
    const slotNoShows: Record<string, { total: number; noShows: number }> = {};

    appointments.forEach(apt => {
      if (!slotNoShows[apt.slotTime]) {
        slotNoShows[apt.slotTime] = { total: 0, noShows: 0 };
      }
      slotNoShows[apt.slotTime].total++;
      if (apt.cancelled || !apt.isCompleted) {
        slotNoShows[apt.slotTime].noShows++;
      }
    });

    const result: Record<string, number> = {};
    Object.entries(slotNoShows).forEach(([slot, data]) => {
      result[slot] = data.total > 0 ? Math.round((data.noShows / data.total) * 100) / 100 : 0;
    });

    return result;
  }

  getModelStats(): { isTrained: boolean; featureCount: number; featureNames: string[] } {
    return {
      isTrained: this.isModelTrained,
      featureCount: this.featureNames.length,
      featureNames: this.featureNames,
    };
  }
}
