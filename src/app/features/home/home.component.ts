import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
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

  gamesExplore = signal<any[]>([]);
  currentPage = signal(1);
  loading = signal(false);

  searchTerm = signal('');
  searchResults = signal<any[]>([]);
  isSearching = signal(false);

  searchTotal = signal(0);

  filtersOpen = signal(false);

  selectedGame = signal<any | null>(null);
  gameOpen = signal(false);

  images = signal<string[]>([]);
  currentImageIndex = signal(0);
  carouselInterval: any = null;

  totalPages = computed(() => {
    return Math.ceil(this.searchTotal() / 50) || 1;
  });

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

    this.loadGames(1);
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

  /*autoFillFromIGDB() {
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
  }*/

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

  async loadGames(page: number) {
    try {
      this.loading.set(true);

      const data = await firstValueFrom(this.gamesService.getPopularGames(page));

      this.gamesExplore.set(data.results || []);
      this.searchTotal.set(Number(data.total || 0));
      this.currentPage.set(page);

      this.currentPage.set(page);
    } catch (err) {
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  goToPage(page: number) {
    if (this.isSearching()) {
      this.searchPage(page);
    } else {
      this.loadGames(page);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 1) return [1];

    let start = current - 2;
    let end = current + 2;

    if (start < 1) {
      start = 1;
      end = Math.min(5, total);
    }

    if (end > total) {
      end = total;
      start = Math.max(1, total - 4);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  async onSearch(value: string) {
    this.searchTerm.set(value);

    if (!value || value.length < 2) {
      this.isSearching.set(false);
      this.searchTotal.set(0);
      this.loadGames(1);
      return;
    }

    try {
      this.isSearching.set(true);

      this.currentPage.set(1);

      const data = await firstValueFrom(this.gamesService.searchIGDB(value, 1));

      this.searchResults.set(data.results || []);
      this.searchTotal.set(Number(data.total || 0));
    } catch (err) {
      console.error(err);
    }
  }

  async searchPage(page: number) {
    const data = await firstValueFrom(this.gamesService.searchIGDB(this.searchTerm(), page));

    this.searchResults.set(data.results || []);
    this.currentPage.set(page);
  }

  openGameInfo(game: any) {
    if (this.selectedGame()?.id === game.id && this.gameOpen()) {
      this.gameOpen.set(false);
      return;
    }

    this.selectedGame.set(game);
    this.gameOpen.set(true);

    const imgs: string[] = [];

    if (game.cover?.url) {
      imgs.push('https:' + game.cover.url.replace('t_thumb', 't_cover_big_2x'));
    }

    if (game.screenshots) {
      game.screenshots.slice(0, 5 - imgs.length).forEach((s: any) => {
        imgs.push('https:' + s.url.replace('t_thumb', 't_cover_big_2x'));
      });
    }

    if (game.artworks && imgs.length < 9) {
      game.artworks.slice(0, 9 - imgs.length).forEach((a: any) => {
        imgs.push('https:' + a.url.replace('t_thumb', 't_cover_big_2x'));
      });
    }

    this.images.set(imgs);
    this.currentImageIndex.set(0);

    if (this.carouselInterval) clearInterval(this.carouselInterval);

    if (imgs.length > 0) {
      this.carouselInterval = setInterval(() => {
        this.currentImageIndex.update((i) => (i + 1) % this.images().length);
      }, 3000);
    }
  }

  getShortSummary(text: string | undefined): string {
    if (!text) return 'No description available';

    const short = text.split('.').slice(0, 2).join('.');

    if (short.length > 500) {
      return short.slice(0, 500) + '...';
    }

    return short + '.';
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const sidebar = document.querySelector('.gameinfo-sidebar');

    if (!sidebar) return;

    const target = event.target as Node;

    if (this.gameOpen() && !sidebar.contains(target)) {
      this.gameOpen.set(false);
    }
  }
}
