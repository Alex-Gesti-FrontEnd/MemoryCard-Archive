import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private api = 'http://localhost:3000/api/games';

  constructor(private http: HttpClient) {}

  reverseLocation(lat: number, lng: number) {
    return this.http.get<{ address: string; country?: string; city?: string }>(
      `${this.api}/map/location?lat=${lat}&lng=${lng}`,
    );
  }

  getGameStores(lat: number, lng: number, radius: number, types: string[]) {
    const params = new URLSearchParams({
      lat: `${lat}`,
      lng: `${lng}`,
      radius: `${radius}`,
      types: types.join(','),
    });

    return this.http.get<any[]>(`${this.api}/map/stores?${params}`);
  }

  getRoute(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    return this.http.get<{ duration: number; distance: number; geometry: any }>(
      `${this.api}/map/route?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`,
    );
  }
}
