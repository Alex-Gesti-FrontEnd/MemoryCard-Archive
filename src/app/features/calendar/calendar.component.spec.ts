import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarComponent } from './calendar.component';

describe('CalendarComponent (independent test)', () => {
  let component: any;

  beforeEach(() => {
    component = Object.create(CalendarComponent.prototype);
    component.games = () => [
      {
        id: 1,
        name: 'Zelda',
        releaseDate: '2000-11-21',
        image: 'test.jpg',
        platform: 'Nintendo',
      },
    ];
    component.reminders = () => [];
    component.newReminderDate = () => '2025-01-01';
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should generate release events', () => {
    const events = component.generateReleaseEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].title).toContain('Zelda');
  });
});
