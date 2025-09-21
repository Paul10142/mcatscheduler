export interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  daysLeft: number;
  practiceQuestions?: string;
  cars?: string;
  review?: string;
  isPracticeTest?: boolean;
  isReviewDay?: boolean;
  isBlackout?: boolean;
}

export interface StudyPlanPreview {
  totalDays: number;
  practiceTestCount: number;
  totalStudyHours: number;
  schedule: ScheduleDay[];
}

export interface BlackoutDate {
  date: string;
  reason?: string;
}
