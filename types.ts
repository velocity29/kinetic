
export type TrackCategory = 'AI' | 'QuickBooks' | 'Excel' | 'Insurance' | 'Speech' | 'Applications' | 'Tech';

export interface SyllabusModule {
  id: string;
  title: string;
  track: TrackCategory;
  resourceLink?: string;
}

export interface Task {
  id: string;
  title: string;
  category: 'Jobs' | 'Deep Work' | 'Vocal' | 'Discord' | 'Audit' | 'Curriculum';
  completed: boolean;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  appliedDate: string;
  status: 'Applied' | 'Interviewing' | 'Rejected' | 'Offer';
  notes: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  dateEarned: string;
  link?: string;
}

export interface CurriculumDay {
  day: number;
  focus: string;
  summary: string; // New: Brief summary of the day's goals
  moduleIds: string[];
}

export interface MissionDocument {
  id: string;
  name: string;
  url: string;
}

export interface DayLog {
  notes: string;
  documents: MissionDocument[];
}

export interface AppState {
  isSetupComplete: boolean;
  userGoals: string;
  startDate: string; // ISO string for Jan 2nd 2025
  tasks: Task[];
  applications: JobApplication[];
  certificates: Certificate[];
  completedModuleIds: string[];
  masterSyllabus: SyllabusModule[];
  curriculumDays: CurriculumDay[];
  dayLogs: Record<number, DayLog>;
  lastUpdated: string;
}
