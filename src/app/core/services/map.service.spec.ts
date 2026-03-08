import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MapService } from './map.service';

describe('MapService (independent test)', () => {
  let service: MapService;
  let httpMock: any;

  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
    };

    service = new MapService(httpMock);
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should call API to get game stores', () => {
    service.getGameStores(41, 2, 2000, ['video_games']);

    expect(httpMock.get).toHaveBeenCalled();
    expect(httpMock.get.mock.calls[0][0]).toContain('/map/stores');
  });

  it('should call API to get route', () => {
    service.getRoute(41, 2, 41.3, 2.1);

    expect(httpMock.get).toHaveBeenCalled();
    expect(httpMock.get.mock.calls[0][0]).toContain('/map/route');
  });

  it('should call API to reverse location', () => {
    service.reverseLocation(41, 2);

    expect(httpMock.get).toHaveBeenCalled();
    expect(httpMock.get.mock.calls[0][0]).toContain('/map/location');
  });
});
