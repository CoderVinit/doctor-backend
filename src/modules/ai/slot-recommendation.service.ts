import { Injectable } from '@nestjs/common';

export interface TimeSlot {
  time: string;
  score: number;
  label: string;
}

@Injectable()
export class SlotRecommendationService {
  private readonly allSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  ];

  getAvailableSlots(bookedSlots: string[], date: string): TimeSlot[] {
    const availableSlots = this.allSlots.filter(slot => !bookedSlots.includes(slot));
    
    // Score each slot based on various factors
    const scoredSlots = availableSlots.map(slot => ({
      time: slot,
      score: this.calculateSlotScore(slot, date, bookedSlots),
      label: this.getSlotLabel(slot),
    }));

    // Sort by score (highest first)
    return scoredSlots.sort((a, b) => b.score - a.score);
  }

  private calculateSlotScore(slot: string, date: string, bookedSlots: string[]): number {
    let score = 50; // Base score
    const hour = this.parseHour(slot);
    const dayOfWeek = new Date(date).getDay();

    // Prefer mid-morning slots (10-11 AM)
    if (hour >= 10 && hour <= 11) {
      score += 20;
    }
    // Afternoon slots are good too (2-4 PM)
    else if (hour >= 14 && hour <= 16) {
      score += 15;
    }
    // Early morning and late evening less preferred
    else if (hour === 9 || hour >= 18) {
      score -= 10;
    }

    // Weekday bonus
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      score += 10;
    }

    // If surrounding slots are booked, this slot might be less preferred (doctor might be tired)
    const slotIndex = this.allSlots.indexOf(slot);
    const prevSlot = this.allSlots[slotIndex - 1];
    const nextSlot = this.allSlots[slotIndex + 1];
    
    if (prevSlot && bookedSlots.includes(prevSlot) && nextSlot && bookedSlots.includes(nextSlot)) {
      score -= 5; // Sandwiched slot
    }
    
    // Buffer time after lunch is good
    if (slot === '02:00 PM' || slot === '02:30 PM') {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private parseHour(slot: string): number {
    const [time, period] = slot.split(' ');
    let [hours] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours;
  }

  private getSlotLabel(slot: string): string {
    const hour = this.parseHour(slot);
    
    if (hour >= 9 && hour < 12) {
      return 'Morning';
    } else if (hour >= 12 && hour < 14) {
      return 'Lunch';
    } else if (hour >= 14 && hour < 17) {
      return 'Afternoon';
    } else {
      return 'Evening';
    }
  }

  getRecommendedSlot(availableSlots: TimeSlot[]): TimeSlot | null {
    if (availableSlots.length === 0) return null;
    return availableSlots[0]; // Already sorted by score
  }

  getSlotsByPeriod(availableSlots: TimeSlot[]): Record<string, TimeSlot[]> {
    return {
      morning: availableSlots.filter(s => s.label === 'Morning'),
      afternoon: availableSlots.filter(s => s.label === 'Afternoon'),
      evening: availableSlots.filter(s => s.label === 'Evening'),
    };
  }
}
