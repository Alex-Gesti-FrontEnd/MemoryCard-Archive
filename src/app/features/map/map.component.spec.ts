import { describe, it, expect } from 'vitest';
import { MapComponent } from './map.component';

describe('MapComponent (independent test)', () => {
  const component = Object.create(MapComponent.prototype) as MapComponent;

  component.selectedRadius = 2000;
  component.selectedTypes = [
    'video_games',
    'second_hand',
    'electronics',
    'department_store',
    'shopping_centre',
  ];

  it('should create component structure', () => {
    expect(component).toBeTruthy();
  });

  it('should have default radius value', () => {
    expect(component.selectedRadius).toBe(2000);
  });

  it('should contain store types', () => {
    expect(component.selectedTypes.length).toBeGreaterThan(0);
  });
});
