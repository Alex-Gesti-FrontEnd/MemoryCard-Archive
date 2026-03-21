import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

import { GamesService } from '../../core/services/games.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private gamesService = inject(GamesService);

  private router = inject(Router);
  authService = inject(AuthService);

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

  ngOnInit(): void {
    const token = this.authService.token();

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadGames(1);
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

  getGameTypeLabel(type: number | undefined): string {
    const map: Record<number, string> = {
      0: 'Game',
      1: 'DLC',
      2: 'Expansion',
      3: 'Bundle',
      4: 'Expansion',
      8: 'Remake',
      9: 'Remaster',
      10: 'Expanded',
      11: 'Port',
      12: 'Fangame',
    };

    return map[type ?? -1] || 'Other';
  }

  getShortSummary(text: string | undefined): string {
    if (!text) return 'No description available';

    const short = text.split('.').slice(0, 2).join('.');

    if (short.length > 500) {
      return short.slice(0, 500) + '...';
    }

    return short + '.';
  }

  addToCollection(game: any, region: string, format: string) {
    const newGame = {
      name: game.name,
      platform: game.main_platform?.name || 'Unknown',
      region,
      genre: game.genres?.map((g: any) => g.name).join(', ') || '',
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().slice(0, 10)
        : null,
      status: 'backlog',
      format: format.toLowerCase(),
      image: game.cover ? 'https:' + game.cover.url.replace('t_thumb', 't_cover_big') : '',
    };

    this.gamesService.addGame(newGame as any);
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
