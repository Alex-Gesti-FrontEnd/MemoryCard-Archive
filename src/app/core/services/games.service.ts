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

  addGame(game: GameModel): Promise<GameModel> {
    return firstValueFrom(this.http.post<GameModel>(this.apiUrl, game)).then((newGame) => {
      this.games.update((old) => [...old, newGame]);
      console.log('Enviando juego:', newGame);
      return newGame;
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

  getPopularGames(page: number, filters?: any) {
    let params: any = { page };

    if (filters) {
      if (filters.platforms?.length) params.platforms = filters.platforms.join(',');
      if (filters.years?.length) params.years = filters.years.join(',');
      if (filters.types?.length) params.types = filters.types.join(',');
    }

    return this.http.get<{ results: any[]; total: number }>(`${this.apiUrl}/igdb/popular`, {
      params,
    });
  }

  searchIGDB(name: string, page: number = 1, filters?: any) {
    let params: any = { name, page };

    if (filters) {
      if (filters.platforms?.length) params.platforms = filters.platforms.join(',');
      if (filters.years?.length) params.years = filters.years.join(',');
      if (filters.types?.length) params.types = filters.types.join(',');
    }

    return this.http.get<{ results: any[]; total: number }>(`${this.apiUrl}/igdb/search`, {
      params,
    });
  }
}
