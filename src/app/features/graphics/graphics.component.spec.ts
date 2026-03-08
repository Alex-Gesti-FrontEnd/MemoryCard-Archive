import { describe, it, expect, beforeEach } from 'vitest';

describe('GraphicsComponent (independent mock test)', () => {
  let component: any;

  beforeEach(() => {
    component = {
      priceData: () => [10, 20, 35, 40, 55],

      getNiceStep: (range: number) => {
        const roughStep = range / 10;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const niceSteps = [1, 2, 5, 10];
        for (const step of niceSteps) {
          if (roughStep <= step * magnitude) return step * magnitude;
        }
        return 10 * magnitude;
      },

      createChartData: function () {
        const prices = this.priceData()
          .filter((p: number) => p > 0 && p < 1000)
          .sort((a: number, b: number) => a - b);
        if (!prices.length) return null;

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
        prices.forEach((p: number) => {
          let idx = Math.floor((p - minRounded) / binSize);
          if (idx >= binsCount) idx = binsCount - 1;
          counts[idx]++;
        });

        return { labels, counts };
      },
    };
  });

  it('should calculate nice step correctly', () => {
    const step = component.getNiceStep(87);
    expect(step).toBeGreaterThan(0);
  });

  it('should create chart data from priceData', () => {
    const data = component.createChartData();
    expect(data).toHaveProperty('labels');
    expect(data).toHaveProperty('counts');
    expect(data.counts.reduce((a: number, b: number) => a + b, 0)).toBe(
      component.priceData().length,
    );
  });
});
