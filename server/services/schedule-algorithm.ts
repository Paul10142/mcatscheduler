import type { InsertStudyPlan } from "@shared/schema";
import type { ScheduleDay } from "../../client/src/lib/study-plan-types";

interface StudyMaterial {
  name: string;
  type: 'practice_questions' | 'cars' | 'practice_test' | 'review';
  priority: number;
  estimatedHours: number;
  isFullDay?: boolean;
}

const STUDY_MATERIALS: StudyMaterial[] = [
  // AAMC Practice Tests (highest priority)
  { name: "AAMC Sample Test", type: "practice_test", priority: 1, estimatedHours: 7.5, isFullDay: true },
  { name: "AAMC FL1", type: "practice_test", priority: 2, estimatedHours: 7.5, isFullDay: true },
  { name: "AAMC FL2", type: "practice_test", priority: 3, estimatedHours: 7.5, isFullDay: true },
  { name: "AAMC FL3", type: "practice_test", priority: 4, estimatedHours: 7.5, isFullDay: true },
  { name: "AAMC FL4", type: "practice_test", priority: 5, estimatedHours: 7.5, isFullDay: true },
  
  // AAMC Question Banks
  { name: "AAMC Question Bank Questions - 100 Questions", type: "practice_questions", priority: 10, estimatedHours: 3 },
  { name: "AAMC Section Bank B/B - 60 Questions", type: "practice_questions", priority: 15, estimatedHours: 2 },
  { name: "AAMC Section Bank P/S - 60 Questions", type: "practice_questions", priority: 16, estimatedHours: 2 },
  { name: "AAMC Section Bank C/P - 60 Questions", type: "practice_questions", priority: 17, estimatedHours: 2 },
  { name: "AAMC Section Bank B/B - 40 Questions", type: "practice_questions", priority: 18, estimatedHours: 1.5 },
  { name: "AAMC Section Bank P/S - 40 Questions", type: "practice_questions", priority: 19, estimatedHours: 1.5 },
  { name: "AAMC Section Bank C/P - 40 Questions", type: "practice_questions", priority: 20, estimatedHours: 1.5 },
  
  // AAMC CARS
  { name: "AAMC CARS Pack 1/2 - 3 passages", type: "cars", priority: 25, estimatedHours: 1 },
  { name: "AAMC CARS Pack 1/2 - 1 passages", type: "cars", priority: 26, estimatedHours: 0.5 },
  
  // General Review
  { name: "Anki Review Cards", type: "review", priority: 100, estimatedHours: 1 },
];

export class ScheduleAlgorithm {
  private studyPlan: InsertStudyPlan;
  private schedule: ScheduleDay[] = [];
  private availableMaterials: StudyMaterial[] = [];
  
  constructor(studyPlan: InsertStudyPlan) {
    this.studyPlan = studyPlan;
    this.availableMaterials = [...STUDY_MATERIALS];
  }

  generateSchedule(): ScheduleDay[] {
    this.schedule = [];
    
    const testDate = new Date(this.studyPlan.testDate);
    const today = new Date();
    const totalDays = Math.ceil((testDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (totalDays <= 0) {
      throw new Error("Test date must be in the future");
    }

    // Generate day-by-day schedule
    for (let i = totalDays; i >= 1; i--) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + (totalDays - i));
      
      const dayOfWeek = this.getDayOfWeek(currentDate);
      const dateStr = this.formatDate(currentDate);
      
      const scheduleDay: ScheduleDay = {
        date: dateStr,
        dayOfWeek,
        daysLeft: i,
      };

      // Check if this is a blackout date
      const isBlackout = this.studyPlan.blackoutDates.some(
        bd => {
          // Convert blackout date to same format as dateStr (M/D)
          const blackoutDate = new Date(bd.date);
          const blackoutDateStr = this.formatDate(blackoutDate);
          return blackoutDateStr === dateStr;
        }
      );

      if (isBlackout) {
        scheduleDay.isBlackout = true;
        scheduleDay.review = "Blackout Day";
        this.schedule.push(scheduleDay);
        continue;
      }

      // Check if this is in the taper period
      if (i <= this.studyPlan.taperDays) {
        scheduleDay.review = "Light Review - Taper Period";
        this.schedule.push(scheduleDay);
        continue;
      }

      // Check if this should be a practice test day
      const dayName = dayOfWeek.toLowerCase();
      if (this.studyPlan.practiceTestDays.includes(dayName)) {
        const practiceTest = this.getNextPracticeTest();
        if (practiceTest) {
          scheduleDay.practiceQuestions = practiceTest.name;
          scheduleDay.isPracticeTest = true;
          scheduleDay.review = "Anki Review Cards";
          this.schedule.push(scheduleDay);
          continue;
        }
      }

      // Check if this should be a review day (day after practice test)
      if (this.schedule.length > 0) {
        const previousDay = this.schedule[this.schedule.length - 1];
        if (previousDay.isPracticeTest) {
          scheduleDay.practiceQuestions = "Review Full Length";
          scheduleDay.isReviewDay = true;
          scheduleDay.cars = this.getNextCARS()?.name;
          scheduleDay.review = "Anki Review Cards";
          this.schedule.push(scheduleDay);
          continue;
        }
      }

      // Regular study day
      const availableHours = this.getAvailableHours(dayOfWeek);
      this.fillRegularStudyDay(scheduleDay, availableHours);
      
      this.schedule.push(scheduleDay);
    }

    return this.schedule.reverse(); // Return in chronological order
  }

  private getDayOfWeek(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private formatDate(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  private getAvailableHours(dayOfWeek: string): number {
    const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
    return isWeekend ? this.studyPlan.weekendHours : this.studyPlan.weekdayHours;
  }

  private getNextPracticeTest(): StudyMaterial | null {
    const practiceTestIndex = this.availableMaterials.findIndex(
      material => material.type === 'practice_test'
    );
    
    if (practiceTestIndex === -1) return null;
    
    return this.availableMaterials.splice(practiceTestIndex, 1)[0];
  }

  private getNextCARS(): StudyMaterial | null {
    const carsIndex = this.availableMaterials.findIndex(
      material => material.type === 'cars'
    );
    
    if (carsIndex === -1) return null;
    
    return this.availableMaterials.splice(carsIndex, 1)[0];
  }

  private getNextPracticeQuestions(): StudyMaterial | null {
    const questionIndex = this.availableMaterials.findIndex(
      material => material.type === 'practice_questions'
    );
    
    if (questionIndex === -1) return null;
    
    return this.availableMaterials.splice(questionIndex, 1)[0];
  }

  private fillRegularStudyDay(scheduleDay: ScheduleDay, availableHours: number): void {
    let remainingHours = availableHours;

    // Allocate practice questions
    if (remainingHours >= 2) {
      const practiceQuestions = this.getNextPracticeQuestions();
      if (practiceQuestions) {
        scheduleDay.practiceQuestions = practiceQuestions.name;
        remainingHours -= practiceQuestions.estimatedHours;
      }
    }

    // Allocate CARS
    if (remainingHours >= 0.5) {
      const cars = this.getNextCARS();
      if (cars) {
        scheduleDay.cars = cars.name;
        remainingHours -= cars.estimatedHours;
      }
    }

    // Always add review
    scheduleDay.review = "Anki Review Cards";
  }

  getPreviewStats() {
    const totalDays = this.schedule.length;
    const practiceTestCount = this.schedule.filter(day => day.isPracticeTest).length;
    
    const totalStudyHours = this.schedule.reduce((total, day) => {
      if (day.isBlackout || (day.daysLeft <= this.studyPlan.taperDays)) return total;
      
      const dayOfWeek = day.dayOfWeek;
      const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
      return total + (isWeekend ? this.studyPlan.weekendHours : this.studyPlan.weekdayHours);
    }, 0);

    return {
      totalDays,
      practiceTestCount,
      totalStudyHours,
      schedule: this.schedule,
    };
  }
}
