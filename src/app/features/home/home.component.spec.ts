import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { signal } from '@angular/core';
import { HomeComponent } from './home.component';
import { GamesService } from '../../core/services/games.service';
import { GameModel } from '../../core/models/game.model';

// Mock simplificado de GamesService
class MockGamesService {
  games = signal<GameModel[]>([]);
  fetchGames = vi.fn(() => {
    this.games.set([
      {
        id: 1,
        name: 'Mock Game',
        platform: 'PC',
        region: 'PAL',
        genre: 'Action',
        releaseDate: '2020-01-01',
        avgPrice: 50,
        image: '',
      },
    ]);
  });
  addGame = vi.fn();
  updateGame = vi.fn();
  deleteGame = vi.fn();
}

describe('HomeComponent (TestBed injection context)', () => {
  let component: HomeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormBuilder, { provide: GamesService, useClass: MockGamesService }],
    });

    // Crear el componente dentro del contexto de inyección
    TestBed.runInInjectionContext(() => {
      component = new HomeComponent();
    });
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch games on init', () => {
    component.ngOnInit();
    expect(component.games().length).toBe(1);
  });

  it('should toggle form', () => {
    expect(component.showForm()).toBe(false);
    component.toggleForm();
    expect(component.showForm()).toBe(true);
    component.toggleForm();
    expect(component.showForm()).toBe(false);
  });

  it('should add a game', () => {
    const game: GameModel = {
      id: 2,
      name: 'Test Game',
      platform: 'Switch',
      region: 'PAL',
      genre: 'Adventure',
      releaseDate: '2021-01-01',
      avgPrice: 60,
      image: '',
    };
    component.form.patchValue(game);
    component.addGame();
    expect((component as any).gamesService.addGame).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Game',
        platform: 'Switch',
        region: 'PAL',
        genre: 'Adventure',
        releaseDate: '2021-01-01',
        avgPrice: 60,
        image: '',
      }),
    );
  });

  it('should edit a game', () => {
    const game: GameModel = {
      id: 1,
      name: 'Mock Game',
      platform: 'PC',
      region: 'PAL',
      genre: 'Action',
      releaseDate: '2020-01-01',
      avgPrice: 50,
      image: '',
    };
    component.editGame(game);
    expect(component.editingId()).toBe(game.id);
    expect(component.showForm()).toBe(true);
  });

  it('should delete a game', () => {
    component.deleteGame(1);
    expect((component as any).gamesService.deleteGame).toHaveBeenCalledWith(1);
  });
});
