import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Reminder } from '../models/reminder.model';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private http = inject(HttpClient);

  private _reminders = signal<Reminder[]>([]);
  reminders = this._reminders.asReadonly();

  private apiUrl = 'http://localhost:3000/api/reminders';

  load() {
    this.http.get<Reminder[]>(this.apiUrl).subscribe((r) => this._reminders.set(r));
  }

  add(reminder: Omit<Reminder, 'id'>) {
    return this.http.post<Reminder>(this.apiUrl, reminder).subscribe({
      next: (newReminder) => {
        console.log('Reminder added:', newReminder);
        this._reminders.update((r) => [...r, newReminder]);
      },
      error: (err) => console.error('Error saving reminder:', err),
    });
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this._reminders.update((r) => r.filter((rem) => rem.id !== id));
      },
      error: (err) => console.error('Error deleting reminder:', err),
    });
  }
}
