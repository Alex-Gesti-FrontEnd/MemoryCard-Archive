import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesService } from '../../core/services/games.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameModel } from '../../core/models/game.model';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent implements OnInit {
  private gamesService = inject(GamesService);
  private authService = inject(AuthService);
  private router = inject(Router);

  games = signal<GameModel[]>([]);
  loading = signal(false);

  showDeleteModal = signal(false);
  gameToDelete = signal<GameModel | null>(null);

  statusFilter = signal<string>('all');

  zoomGame = signal<GameModel | null>(null);
  zoomStyle = signal<any>({});
  zoomVisible = signal(false);
  zoomContentVisible = signal(false);

  summaryExpanded = signal(false);

  currentScreenshotIndex = signal(0);
  carouselImages = signal<string[]>([]);
  carouselInterval: any;

  filteredGames = computed(() => {
    if (this.statusFilter() === 'all') return this.games();
    return this.games().filter((g) => g.status === this.statusFilter());
  });

  companiesList = computed(() => {
    const game = this.zoomGame();
    if (!game || !game.companies) return '';

    const names = game.companies
      .map((c: any) => c.company?.name)
      .filter((n: string | undefined): n is string => !!n);

    const uniqueNames = Array.from(new Set(names));

    return uniqueNames.join(', ');
  });

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

  ngOnInit(): void {
    const token = this.authService.token();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadCollection();
  }

  ngOnDestroy(): void {
    this.stopScreenshotCarousel();
  }

  async loadCollection() {
    this.loading.set(true);
    try {
      const data = await this.gamesService.getUserGames();
      this.games.set(data);
    } catch (err) {
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  async openZoom(game: GameModel, event: MouseEvent) {
    if (this.zoomVisible()) return;

    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();

    this.zoomStyle.set({
      position: 'fixed',
      top: rect.top + 'px',
      left: rect.left + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      transition: 'all 0.3s ease',
      zIndex: 1500,
      transform: 'scale(1)',
    });

    this.zoomGame.set(game);
    this.zoomVisible.set(true);
    this.zoomContentVisible.set(false);
    this.startScreenshotCarousel(game);

    setTimeout(() => {
      this.zoomStyle.update((s) => ({
        ...s,
        top: '50%',
        left: '50%',
        width: '80vw',
        maxWidth: '900px',
        height: '60vh',
        maxHeight: '700px',
        transform: 'translate(-50%, -50%)',
      }));

      setTimeout(() => this.zoomContentVisible.set(true), 250);
    }, 50);
  }

  closeZoom(): void {
    const game = this.zoomGame();
    if (!game) return;

    this.zoomContentVisible.set(false);
    this.stopScreenshotCarousel();

    const card = document.querySelector(`.game-card[data-id="${game.id}"]`) as HTMLElement | null;

    if (card) {
      const rect = card.getBoundingClientRect();
      this.zoomStyle.update((s) => ({
        ...s,
        top: rect.top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        transform: 'scale(1)',
      }));

      setTimeout(() => {
        this.zoomVisible.set(false);
        this.zoomGame.set(null);
      }, 300);
    } else {
      this.zoomVisible.set(false);
      this.zoomGame.set(null);
    }
  }

  getCurrentIndex(): number {
    const game = this.zoomGame();
    if (!game) return -1;
    return this.games().findIndex((g) => g.id === game.id);
  }

  showPreviousGame() {
    const index = this.getCurrentIndex();
    if (index > 0) {
      const newGame = this.filteredGames()[index - 1];
      this.zoomGame.set(newGame);
      this.startScreenshotCarousel(newGame);
      this.summaryExpanded.set(false);
    }
  }

  showNextGame() {
    const index = this.getCurrentIndex();
    if (index < this.filteredGames().length - 1) {
      const newGame = this.filteredGames()[index + 1];
      this.zoomGame.set(newGame);
      this.startScreenshotCarousel(newGame);
      this.summaryExpanded.set(false);
    }
  }

  getZoomBackground(): string {
    const game = this.zoomGame();
    if (!game) return '';
    return `
    linear-gradient(to bottom, rgba(0,0,0,0) 25%, rgba(0,0,0,0.9) 80%),
    url('${game.image || 'assets/no-image.png'}')
  `;
  }

  cycleStatus(game: GameModel | null) {
    if (!game) return;
    const next: Record<string, string> = {
      backlog: 'playing',
      playing: 'completed',
      completed: 'backlog',
    };
    game.status = next[game.status || 'backlog'] as 'backlog' | 'playing' | 'completed';

    this.games.update((g) => [...g]);

    this.gamesService.updateGame(game.id!, game);
  }

  getRegionColor(region: string | undefined): string {
    const map: Record<string, string> = {
      PAL: '#3498db',
      'NTSC-U': '#e74c3c',
      'NTSC-J': '#f1c40f',
      'Region Free': '#2ecc71',
    };
    return map[region ?? ''];
  }

  getFormatIcon(format: string | undefined): string {
    const map: Record<string, string> = {
      physical: '&#x1F4BF;',
      digital: '&#x1F5A5;',
    };
    return map[format?.toLowerCase() ?? ''];
  }

  getSummaryText(text: string | null | undefined): string {
    if (!text) return 'No description available';

    if (this.summaryExpanded()) {
      if (text.length <= 500) return text;

      const slice = text.slice(0, 500);
      const lastDot = slice.lastIndexOf('.');

      return lastDot !== -1 ? slice.slice(0, lastDot + 1) : slice + '...';
    } else {
      return this.getShortSummary(text);
    }
  }

  getShortSummary(text: string | null | undefined): string {
    if (!text) return 'No description available';

    const short = text.split('.').slice(0, 3).join('.');

    if (short.length > 100) {
      return short.slice(0, 100) + '...';
    }

    return short + '.';
  }

  toggleSummary() {
    this.summaryExpanded.update((v) => !v);
  }

  startScreenshotCarousel(game: GameModel) {
    const fixUrl = (url: any) => {
      url = url.replace('t_thumb', 't_1080p');

      if (url.startsWith('//')) return 'https:' + url;
      if (url.startsWith('/')) return 'https://tu-backend.com' + url;
      return url;
    };

    const screenshots = Array.isArray(game.screenshots) ? game.screenshots : [];
    const artworks = Array.isArray(game.artworks) ? game.artworks : [];

    const combined = [
      ...screenshots.map((s: any) => fixUrl(s.url)).filter(Boolean),
      ...artworks.map((a: any) => fixUrl(a.url)).filter(Boolean),
    ];

    this.carouselImages.set(combined);

    if (!combined.length) return;

    this.currentScreenshotIndex.set(0);

    if (this.carouselInterval) clearInterval(this.carouselInterval);

    this.carouselInterval = setInterval(() => {
      this.currentScreenshotIndex.update((i) => (i + 1) % combined.length);
    }, 3000);
  }

  stopScreenshotCarousel() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  openDeleteModal(game: GameModel, event: MouseEvent) {
    event.stopPropagation();

    if (this.zoomVisible()) return;

    this.gameToDelete.set(game);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.gameToDelete.set(null);
  }

  confirmDelete() {
    const game = this.gameToDelete();
    if (!game) return;

    this.gamesService.deleteGame(game.id!).then(() => {
      this.games.update((g) => g.filter((x) => x.id !== game.id));
      this.closeDeleteModal();
    });
  }
}
