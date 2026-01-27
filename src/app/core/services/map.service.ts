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

  getGameStores(lat: number, lng: number) {
    return this.http.get<
      {
        name: string;
        lat: number;
        lng: number;
      }[]
    >(`http://localhost:3000/api/games/map/stores?lat=${lat}&lng=${lng}`);
  }
}
