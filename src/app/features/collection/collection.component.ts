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
