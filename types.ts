export enum Period {
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4',
  ANNUAL = 'ANNUAL',
  H1 = 'H1',
  H2 = 'H2'
}

export enum KRStatus {
  ON_TRACK = 'On Track',
  AT_RISK = 'At Risk',
  BEHIND = 'Behind',
  COMPLETED = 'Completed'
}

export interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: KRStatus;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  period: Period;
  keyResults: KeyResult[];
  progress: number; // Calculated percentage 0-100
}

export interface JournalEntry {
  id: string;
  date: string; // ISO String
  content: string;
  mood: number; // 1-10
  energy: number; // 1-10
  aiFeedback?: string;
  tags?: string[];
}

export interface AIUpdateSuggestion {
  objectiveId: string;
  keyResultId: string;
  suggestedValue: number;
  reasoning: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

export type View = 'dashboard' | 'okrs' | 'journal';