import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesService } from '../../core/services/games.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  games = signal<any[]>([]);
  loading = signal(false);

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

  removeGame(id: number) {
    if (!confirm('Are you sure you want to delete this game?')) return;

    this.gamesService.deleteGame(id).then(() => {
      this.games.update((g) => g.filter((game) => game.id !== id));
    });
  }

  statusFilter = signal<string>('all');
  filteredGames = computed(() => {
    if (this.statusFilter() === 'all') return this.games();
    return this.games().filter((g) => g.status === this.statusFilter());
  });
}
