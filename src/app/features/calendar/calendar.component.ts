import { Component, computed, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, FormatterInput, EventInput } from '@fullcalendar/core';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

import { GamesService } from '../../core/services/games.service';

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

  games = this.gamesService.games;

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
  } | null>(null);

  events = computed<EventInput[]>(() => {
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
            name: game.name,
            image: game.image,
            platform: game.platform,
            age,
          },
        });
      }

      return events;
    });
  });

  calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

    initialView: 'dayGridMonth',

    headerToolbar: {
      left: 'prevYear,prev,next,nextYear today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },

    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
    },

    locale: esLocale,
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
      });
    },

    events: this.events(),
  }));

  closePopup() {
    this.selectedEvent.set(null);
  }
}
