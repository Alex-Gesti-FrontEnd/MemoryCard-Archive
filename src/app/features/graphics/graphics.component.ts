import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PieController,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PieController,
  Tooltip,
  Legend,
);

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
  priceCache = new Map<string, number[]>();

  histogramChart: Chart | null = null;
  pieChart: Chart | null = null;

  constructor() {
    effect(() => {
      const prices = this.priceData();
      if (prices.length) this.createCharts();
    });
  }

  ngOnInit() {
    this.loadGames();
  }

  trackById(index: number, game: Game) {
    return game.id;
  }

  async loadGames() {
    try {
      const games = await firstValueFrom(this.http.get<Game[]>('http://localhost:3000/api/games'));
      this.games.set(games);
    } catch (err) {
      console.error('Error loading games:', err);
    }
  }

  async onSelectGame() {
    const game = this.selectedGame();
    if (!game) return;

    const key = `${game.name}-${game.platform}-${game.region}`;

    if (this.priceCache.has(key)) {
      this.priceData.set(this.priceCache.get(key)!);
      return;
    }
    try {
      const prices = await firstValueFrom(
        this.http.get<number[]>(
          `http://localhost:3000/api/games/ebay-prices?name=${encodeURIComponent(game.name)}&platform=${encodeURIComponent(game.platform)}&region=${encodeURIComponent(game.region)}`,
        ),
      );

      const data = prices ?? [];
      this.priceCache.set(key, data);
      this.priceData.set(data);
    } catch (err) {
      console.error('Error fetching eBay prices:', err);
    }
  }

  private getNiceStep(range: number) {
    const roughStep = range / 10;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    for (const step of [1, 2, 5, 10]) {
      if (roughStep <= step * magnitude) return step * magnitude;
    }
    return 10 * magnitude;
  }

  private createCharts() {
    const prices = [...this.priceData()].filter((p) => p > 0 && p < 1000).sort((a, b) => a - b);
    if (!prices.length) return;

    const min = prices[0];
    const max = prices[prices.length - 1];
    const range = max - min;
    const binSize = this.getNiceStep(range);
    const minRounded = Math.floor(min / binSize) * binSize;
    const maxRounded = Math.ceil(max / binSize) * binSize;
    const binsCount = Math.ceil((maxRounded - minRounded) / binSize);

    const labels = Array.from({ length: binsCount }, (_, i) => {
      const start = minRounded + i * binSize;
      const end = start + binSize;
      return `${start}-${end} €`;
    });

    const counts = Array(binsCount).fill(0);
    prices.forEach((p) => {
      let idx = Math.floor((p - minRounded) / binSize);
      if (idx >= binsCount) idx = binsCount - 1;
      counts[idx]++;
    });

    const colors = labels.map((_, i) => `hsl(${(i * 360) / binsCount},70%,50%)`);
    const histogramCanvas = document.getElementById('histogramChart') as HTMLCanvasElement | null;
    const pieCanvas = document.getElementById('pieChart') as HTMLCanvasElement | null;
    if (!histogramCanvas || !pieCanvas) return;

    if (this.histogramChart) {
      this.histogramChart.data.labels = labels;
      this.histogramChart.data.datasets[0].data = counts;
      this.histogramChart.update();
    } else {
      this.histogramChart = new Chart(histogramCanvas, {
        type: 'bar',
        data: { labels, datasets: [{ data: counts, backgroundColor: colors }] },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Price range (€)' } },
            y: { beginAtZero: true, title: { display: true, text: 'Number of sales' } },
          },
        },
      });
    }

    if (this.pieChart) {
      this.pieChart.data.labels = labels;
      this.pieChart.data.datasets[0].data = counts;
      this.pieChart.update();
    } else {
      this.pieChart = new Chart(pieCanvas, {
        type: 'pie',
        data: {
          labels,
          datasets: [{ label: 'Price distribution', data: counts, backgroundColor: colors }],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } },
        },
      });
    }
  }
}
