import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MapService {
  private apiUrl = 'http://localhost:3000/api/games';

  constructor(private http: HttpClient) {}

  reverseLocation(lat: number, lng: number) {
    return this.http.get<{
      address: string;
      country?: string;
      city?: string;
    }>(`${this.apiUrl}/map/location?lat=${lat}&lng=${lng}`);
  }

  getGameStores(lat: number, lng: number, radius: number, types: string[]) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      types: types.join(','),
    });

    return this.http.get<
      {
        name: string;
        lat: number;
        lng: number;
        url?: string;
        phone?: string;
        openingHours?: string;
        probability: 'high' | 'medium' | 'low';
      }[]
    >(`http://localhost:3000/api/games/map/stores?${params}`);
  }

  getRoute(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    return this.http.get<{
      duration: number;
      distance: number;
      geometry: any;
    }>(
      `${this.apiUrl}/map/route?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`,
    );
  }
}
