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

  filteredGames = computed(() => {
    if (this.statusFilter() === 'all') return this.games();
    return this.games().filter((g) => g.status === this.statusFilter());
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

  openZoom(game: GameModel, event: MouseEvent) {
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

    setTimeout(() => {
      this.zoomStyle.update((s) => ({
        ...s,
        top: '50%',
        left: '50%',
        width: '500px',
        height: '350px',
        transform: 'translate(-50%, -50%)',
      }));

      setTimeout(() => this.zoomContentVisible.set(true), 250);
    }, 50);
  }

  closeZoom(): void {
    const game = this.zoomGame();
    if (!game) return;

    this.zoomContentVisible.set(false);

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
  }

  openDeleteModal(game: GameModel) {
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
