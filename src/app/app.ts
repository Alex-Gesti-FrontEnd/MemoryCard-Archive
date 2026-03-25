import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('MemoryCard Archive');

  numCubes = 20;
  cubes = Array.from({ length: this.numCubes }, () => ({
    x: Math.random() * window.innerWidth,
    y: -50 - Math.random() * window.innerHeight,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 8,
    rotationDir: Math.random() < 0.5 ? 1 : -1,
    rotationSpeed: 90 + Math.random() * 180,
  }));
}
