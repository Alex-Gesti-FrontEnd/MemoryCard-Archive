import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameModel } from '../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class GamesService {
  private apiUrl = 'http://localhost:3000/api/games';

  games = signal<GameModel[]>([]);

  constructor(private http: HttpClient) {}

  fetchGames() {
    this.http.get<GameModel[]>(this.apiUrl).subscribe((data) => this.games.set(data));
  }

  addGame(game: GameModel) {
    this.http.post<GameModel>(this.apiUrl, game).subscribe((newGame) => {
      this.games.update((old) => [...old, newGame]);
    });
  }

  updateGame(id: number, game: GameModel) {
    this.http.put<GameModel>(`${this.apiUrl}/${id}`, game).subscribe((updatedGame) => {
      this.games.update((list) => list.map((g) => (g.id === id ? updatedGame : g)));
    });
  }

  deleteGame(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
      this.games.update((list) => list.filter((g) => g.id !== id));
    });
  }

  getPopularGames(page: number, filters?: any) {
    return this.http.get<any>(`${this.apiUrl}/igdb/popular`, {
      params: {
        page,
        ...filters,
      },
    });
  }

  searchIGDB(name: string, page: number = 1, filters?: any) {
    return this.http.get<any>(`${this.apiUrl}/igdb/search`, {
      params: {
        name,
        page,
        ...filters,
      },
    });
  }

  getEbayPrice(name: string, platform: string, region: string) {
    return this.http.get<{ median: number; count: number; currency: string }>(
      `${this.apiUrl}/price`,
      {
        params: { name, platform, region },
      },
    );
  }
}
