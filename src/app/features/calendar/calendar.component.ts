import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, FormatterInput } from '@fullcalendar/core';
import { DateTime } from 'luxon';

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

  events = computed(() => []);

  calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

    initialView: 'dayGridMonth',

    headerToolbar: {
      left: 'prev,next today',
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

    titleFormat: (dateInfo: any) => {
      const rawDate = dateInfo?.date || dateInfo?.start;
      const date = new Date(rawDate);
      if (isNaN(date.getTime())) return '';

      const month = date.toLocaleString('es-ES', { month: 'long' });
      const year = date.getFullYear();
      return month.charAt(0).toUpperCase() + month.slice(1) + ' ' + year;
    },

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

    events: this.events(),
  }));
}
