import { Component, computed, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, FormatterInput, EventInput } from '@fullcalendar/core';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { GamesService } from '../../core/services/games.service';
import { ReminderService } from '../../core/services/reminder.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CalendarComponent {
  private gamesService = inject(GamesService);
  private reminderService = inject(ReminderService);

  games = this.gamesService.games;
  reminders = this.reminderService.reminders;

  showReminderModal = signal(false);
  newReminderDate = signal<string | null>(null);

  newReminderTitle = signal('');
  newReminderNotes = signal('');

  ngOnInit() {
    this.gamesService.fetchGames();
    this.reminderService.load();
  }

  formattedReminderDate = computed(() => {
    const date = this.newReminderDate();
    if (!date) return '';

    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  });

  private readonly timeFormat: FormatterInput = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  selectedEvent = signal<{
    title: string;
    image: string;
    platform: string;
    age: number;
    type?: 'release' | 'reminder';
    reminderId?: number;
    notes?: string;
  } | null>(null);

  events = computed<EventInput[]>(() => {
    const gameEvents = this.generateReleaseEvents();

    const reminderEvents = this.reminders().map((r) => ({
      id: `reminder-${r.id}`,
      title: `🛒 ${r.title}`,
      start: r.date,
      allDay: true,
      backgroundColor: '#ff9800',
      borderColor: '#ff9800',
      extendedProps: {
        type: 'reminder',
        id: r.id,
        notes: r.notes,
      },
    }));

    return [...gameEvents, ...reminderEvents];
  });

  private generateReleaseEvents() {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 100;

    return this.games().flatMap((game) => {
      if (!game.releaseDate) return [];

      const [releaseYearStr, month, day] = game.releaseDate.split('-');
      const releaseYear = new Date(game.releaseDate).getFullYear();

      const events: EventInput[] = [];

      for (let year = releaseYear; year <= maxYear; year++) {
        const age = year - releaseYear;

        events.push({
          id: `${game.id}-${year}`,
          title: `\u{1F382} ${game.name} (${age} años)`,
          start: `${year}-${month}-${day}`,
          allDay: true,
          backgroundColor: '#1a79d8',
          borderColor: '#1a79d8',
          extendedProps: {
            type: 'release',
            name: game.name,
            image: game.image,
            platform: game.platform,
            age,
          },
        });
      }

      return events;
    });
  }

  calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

    initialView: 'dayGridMonth',

    headerToolbar: {
      left: 'prevYear,prev,next,nextYear today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },

    buttonText: {
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
    },

    dateClick: (info) => {
      this.newReminderDate.set(info.dateStr);
      this.showReminderModal.set(true);
    },

    locale: 'en',
    firstDay: 1,

    selectable: true,
    editable: false,
    nowIndicator: true,

    slotMinTime: '00:00:00',
    slotMaxTime: '24:00:00',

    slotLabelFormat: this.timeFormat,
    eventTimeFormat: this.timeFormat,

    slotLabelContent: (arg) => arg.text + 'h',

    dayMaxEvents: true,
    fixedWeekCount: false,
    showNonCurrentDates: false,

    expandRows: false,
    height: 'auto',

    eventClick: (info) => {
      const type = info.event.extendedProps['type'];

      if (type === 'release') {
        const { name, image, platform, age } = info.event.extendedProps as {
          name: string;
          image: string;
          platform: string;
          age: number;
        };

        this.selectedEvent.set({
          title: name,
          image,
          platform,
          age,
          type: 'release', // 👈 IMPORTANTE
        });
      } else if (type === 'reminder') {
        const { id, notes } = info.event.extendedProps as any;

        this.selectedEvent.set({
          title: info.event.title,
          image: '',
          platform: '',
          age: 0,
          type: 'reminder',
          reminderId: id,
          notes,
        });
      }
    },

    events: this.events(),
  }));

  createReminder() {
    if (!this.newReminderTitle() || !this.newReminderDate()) return;

    this.reminderService.add({
      title: this.newReminderTitle(),
      date: this.newReminderDate()!,
      notes: this.newReminderNotes().trim() || undefined,
      gameId: null,
    });

    this.newReminderTitle.set('');
    this.newReminderNotes.set('');
    this.showReminderModal.set(false);
  }

  closePopup() {
    this.selectedEvent.set(null);
  }

  deleteReminder(id: number) {
    this.reminderService.delete(id);
    this.selectedEvent.set(null);
  }
}
