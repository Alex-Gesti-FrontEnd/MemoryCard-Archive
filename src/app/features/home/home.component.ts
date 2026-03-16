import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

import { GamesService } from '../../core/services/games.service';
import { GameModel } from '../../core/models/game.model';

type GameVersion = {
  platform: string;
  region: string;
  releaseDate: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gamesService = inject(GamesService);

  private router = inject(Router);
  private authService = inject(AuthService);

  showForm = signal(false);
  editingId = signal<number | null>(null);

  games = this.gamesService.games;

  platforms = signal<string[]>([]);
  platformsData = signal<GameVersion[]>([]);

  regions = signal(['PAL', 'NTSC-U', 'NTSC-J', 'Worldwide']);

  loadingPrice = signal(false);

  sortBy = signal<'id' | 'name' | 'releaseDate' | 'avgPrice' | null>(null);
  sortDesc = signal(false);

  gameCount = computed(() => this.games().length);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    platform: ['', Validators.required],
    region: ['', Validators.required],
    genre: ['', Validators.required],
    releaseDate: ['', Validators.required],
    avgPrice: [0, Validators.required],
    image: [''],
  });

  ngOnInit(): void {
    const token = this.authService.token();

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.gamesService.fetchGames();
  }

  sortedGames = computed(() => {
    const gamesArray = [...this.games()];
    const key = this.sortBy();

    if (!key) return gamesArray;

    const sorted = gamesArray.sort((a, b) => {
      let valA: any = a[key] ?? '';
      let valB: any = b[key] ?? '';

      if (key === 'avgPrice') {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (key === 'releaseDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (typeof valA === 'string') {
        return valA.localeCompare(valB);
      }

      return valA - valB;
    });

    return this.sortDesc() ? sorted.reverse() : sorted;
  });

  toggleSort(key: 'id' | 'name' | 'releaseDate' | 'avgPrice') {
    if (this.sortBy() === key) {
      this.sortDesc.update((v) => !v);
    } else {
      this.sortBy.set(key);
      this.sortDesc.set(false);
    }
  }

  addGame() {
    if (this.form.invalid) return;

    const gameData = this.form.getRawValue() as GameModel;

    if (this.editingId()) {
      this.gamesService.updateGame(this.editingId()!, gameData);
      this.editingId.set(null);
    } else {
      this.gamesService.addGame(gameData);
    }

    this.resetForm();
  }

  editGame(game: GameModel) {
    this.editingId.set(game.id);
    this.form.patchValue(game);
    this.showForm.set(true);
  }

  deleteGame(id: number) {
    this.gamesService.deleteGame(id);
  }

  toggleForm() {
    this.showForm.update((v) => !v);

    if (!this.showForm()) {
      this.resetForm();
    }
  }

  private resetForm() {
    this.editingId.set(null);
    this.form.reset();
    this.platforms.set([]);
    this.platformsData.set([]);
  }

  autoFillFromIGDB() {
    const name = this.form.value.name;
    if (!name) return;

    this.gamesService.searchIGDB(name).subscribe((data) => {
      const versions: GameVersion[] = (data.release_dates ?? [])
        .map(
          (r: any): GameVersion => ({
            platform: r.platform?.name ?? '',
            region: r.region ?? '',
            releaseDate: r.date ? new Date(r.date * 1000).toISOString().slice(0, 10) : '',
          }),
        )
        .filter((v: GameVersion) => v.platform);

      this.platformsData.set(versions);

      this.platforms.set(Array.from(new Set(versions.map((v) => v.platform))));

      this.form.patchValue({
        name: data.name,
        genre: data.genres?.map((g: any) => g.name).join(', ') ?? '',
        releaseDate: '',
        image: data.cover ? `https:${data.cover.url.replace('t_thumb', 't_cover_big')}` : '',
        platform: '',
        region: '',
      });
    });
  }

  onPlatformChange(selected: string) {
    const version = this.platformsData().find((v) => v.platform === selected);

    if (!version) return;

    this.form.patchValue({
      platform: version.platform,
      releaseDate: version.releaseDate,
    });
  }

  onRegionChange(selected: string) {
    this.form.patchValue({ region: selected });
  }

  async fetchEbayPrice() {
    const { name, platform, region } = this.form.value;

    if (!name || !platform || !region) return;

    try {
      this.loadingPrice.set(true);

      const data = await firstValueFrom(this.gamesService.getEbayPrice(name, platform, region));

      this.form.patchValue({
        avgPrice: data.median,
      });
    } catch (err) {
      console.error(err);
      alert('No price data found.');
    } finally {
      this.loadingPrice.set(false);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
