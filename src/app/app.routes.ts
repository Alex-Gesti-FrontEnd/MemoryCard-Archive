import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { MapComponent } from './features/map/map.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { GraphicsComponent } from './features/graphics/graphics.component';
import { LoginComponent } from './features/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'map',
    component: MapComponent,
  },
  {
    path: 'calendar',
    component: CalendarComponent,
  },
  {
    path: 'graphics',
    component: GraphicsComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
