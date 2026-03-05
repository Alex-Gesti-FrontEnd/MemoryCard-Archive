import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Chart } from 'chart.js';

interface Game {
  id: number;
  name: string;
  platform: string;
  region: string;
}

@Component({
  selector: 'app-graphics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './graphics.component.html',
  styleUrls: ['./graphics.component.scss'],
})
export class GraphicsComponent implements OnInit {
  private http = inject(HttpClient);

  games = signal<Game[]>([]);
  selectedGame = signal<Game | null>(null);
  priceData = signal<number[]>([]);

  histogramChart: Chart | null = null;
  pieChart: Chart | null = null;

  ngOnInit() {
    this.loadGames();
  }

  loadGames() {
    this.http.get<Game[]>('http://localhost:3000/api/games').subscribe({
      next: (games) => this.games.set(games),
      error: (err) => console.error('Error loading games:', err),
    });
  }

  async onSelectGame() {
    const game = this.selectedGame();
    if (!game) return;

    try {
      const response: number[] | undefined = await this.http
        .get<
          number[]
        >(`http://localhost:3000/api/games/ebay-prices?name=${encodeURIComponent(game.name)}&platform=${encodeURIComponent(game.platform)}&region=${encodeURIComponent(game.region)}`)
        .toPromise();

      this.priceData.set(response ?? []);
      this.createCharts();
    } catch (err) {
      console.error('Error fetching eBay prices:', err);
    }
  }

  private createCharts() {
    if (!this.priceData().length) return;

    const prices = [...this.priceData()].sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];

    const binsCount = Math.min(10, Math.ceil(Math.sqrt(prices.length)));
    const binSize = (max - min) / binsCount;

    const labels = Array.from({ length: binsCount }, (_, i) => {
      const start = Math.round(min + i * binSize);
      const end = Math.round(min + (i + 1) * binSize);
      return `${start}-${end} €`;
    });

    const counts = Array(binsCount).fill(0);
    prices.forEach((p) => {
      let idx = Math.floor((p - min) / binSize);
      if (idx >= binsCount) idx = binsCount - 1;
      counts[idx]++;
    });

    // Histogram chart
    if (this.histogramChart) this.histogramChart.destroy();
    const ctx1 = document.getElementById('histogramChart') as HTMLCanvasElement;
    this.histogramChart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Sales count per price range',
            data: counts,
            backgroundColor: '#1a79d8',
          },
        ],
      },
    });

    // Pie chart
    if (this.pieChart) this.pieChart.destroy();
    const ctx2 = document.getElementById('pieChart') as HTMLCanvasElement;
    this.pieChart = new Chart(ctx2, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            label: 'Price distribution',
            data: counts,
            backgroundColor: labels.map((_, i) => `hsl(${(i * 360) / binsCount}, 70%, 50%)`),
          },
        ],
      },
    });
  }
}
