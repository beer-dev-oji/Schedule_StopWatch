export interface TimeEntry {
  id: string;
  taskName: string;
  category?: string;
  startTime: string; // ISO string (JST formatted for display)
  endTime: string;   // ISO string (JST formatted for display)
  durationSeconds: number; // in seconds
  note?: string;
  createdAt: number; // timestamp
}

export type ViewMode = 'split' | 'timer' | 'records' | 'widget';
