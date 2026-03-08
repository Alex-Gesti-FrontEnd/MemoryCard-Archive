import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { GamesService } from './games.service';
import { GameModel } from '../models/game.model';

describe('GamesService (independent mock test)', () => {
  let service: GamesService;

  const mockHttp = {
    get: vi.fn().mockReturnValue({
      subscribe: (fn: any) =>
        fn([
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
        ]),
    }),
    post: vi.fn().mockReturnValue({
      subscribe: (fn: any) =>
        fn({
          id: 2,
          name: 'New Game',
          platform: 'Switch',
          region: 'PAL',
          genre: 'Adventure',
          releaseDate: '2021-01-01',
          avgPrice: 60,
          image: '',
        }),
    }),
    put: vi.fn().mockReturnValue({
      subscribe: (fn: any) =>
        fn({
          id: 1,
          name: 'Updated Game',
          platform: 'PC',
          region: 'PAL',
          genre: 'Action',
          releaseDate: '2020-01-01',
          avgPrice: 55,
          image: '',
        }),
    }),
    delete: vi.fn().mockReturnValue({
      subscribe: (fn: any) => fn({}),
    }),
  };

  beforeEach(() => {
    service = new GamesService(mockHttp as any);
    service.games = signal<GameModel[]>([]);
  });

  it('should fetch games', () => {
    service.fetchGames();
    expect(service.games()).toHaveLength(1);
    expect(service.games()[0].name).toBe('Mock Game');
  });

  it('should add a game', () => {
    const newGame: GameModel = {
      id: 2,
      name: 'New Game',
      platform: 'Switch',
      region: 'PAL',
      genre: 'Adventure',
      releaseDate: '2021-01-01',
      avgPrice: 60,
      image: '',
    };
    service.addGame(newGame);
    expect(service.games()).toContainEqual(newGame);
  });

  it('should update a game', () => {
    const existingGame: GameModel = {
      id: 1,
      name: 'Mock Game',
      platform: 'PC',
      region: 'PAL',
      genre: 'Action',
      releaseDate: '2020-01-01',
      avgPrice: 50,
      image: '',
    };
    service.games.set([existingGame]);
    const updatedGame: GameModel = { ...existingGame, name: 'Updated Game', avgPrice: 55 };
    service.updateGame(1, updatedGame);
    expect(service.games()[0].name).toBe('Updated Game');
    expect(service.games()[0].avgPrice).toBe(55);
  });

  it('should delete a game', () => {
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
    service.games.set([game]);
    service.deleteGame(1);
    expect(service.games()).toHaveLength(0);
  });
});
