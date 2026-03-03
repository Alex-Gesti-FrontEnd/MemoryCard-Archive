export interface Reminder {
  id: number;
  title: string;
  date: string;
  notes?: string;
  gameId?: number | null;
}
