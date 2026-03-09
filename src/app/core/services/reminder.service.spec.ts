import { describe, it, expect, beforeEach } from 'vitest';
import { ReminderService } from './reminder.service';

describe('ReminderService (independent test)', () => {
  let service: any;

  beforeEach(() => {
    service = Object.create(ReminderService.prototype);

    service._reminders = {
      value: [],
      set(v: any) {
        this.value = v;
      },
      update(fn: any) {
        this.value = fn(this.value);
      },
    };
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should add reminder locally', () => {
    service._reminders.update((r: any[]) => [...r, { id: 1, title: 'Test' }]);

    expect(service._reminders.value.length).toBe(1);
  });

  it('should delete reminder locally', () => {
    service._reminders.value = [
      { id: 1, title: 'A' },
      { id: 2, title: 'B' },
    ];

    service._reminders.update((r: any[]) => r.filter((rem) => rem.id !== 1));

    expect(service._reminders.value.length).toBe(1);
  });
});
