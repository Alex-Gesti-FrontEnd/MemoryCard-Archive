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

  saveLocation(lat: number, lng: number) {
    return this.http.post<{
      id: number;
      lat: number;
      lng: number;
      city?: string;
      country?: string;
    }>(`${this.apiUrl}/map/location`, {
      lat,
      lng,
    });
  }
}
