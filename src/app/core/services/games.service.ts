import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameModel } from '../models/game.model';
import { firstValueFrom } from 'rxjs';

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

  async getUserGames(): Promise<GameModel[]> {
    return await firstValueFrom(this.http.get<GameModel[]>(this.apiUrl));
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

  async deleteGame(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    this.games.update((list) => list.filter((g) => g.id !== id));
  }

  getPopularGames(page: number) {
    return this.http.get<{ results: any[]; total: number }>(
      `${this.apiUrl}/igdb/popular?page=${page}`,
    );
  }

  searchIGDB(name: string, page: number = 1) {
    return this.http.get<{ results: any[]; total: number }>(`${this.apiUrl}/igdb/search`, {
      params: { name, page },
    });
  }

  getGameDetails(igdbId: number) {
    return this.http.get<any>(`${this.apiUrl}/games/igdb/game/${igdbId}`);
  }
}
