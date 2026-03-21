import { Component, OnInit, inject } from '@angular/core';
import { GamesService } from '../../core/services/games.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './collection.component.html',
})
export class CollectionComponent implements OnInit {
  private gamesService = inject(GamesService);

  games = this.gamesService.games;

  ngOnInit() {
    this.gamesService.fetchGames();
  }
}
