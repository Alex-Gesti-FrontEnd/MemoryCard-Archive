import { Component, AfterViewInit, inject, signal } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from '../../core/services/map.service';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map;
  mapService = inject(MapService);

  locationText = signal<string>('Detecting location...');

  locationIcon = L.icon({
    iconUrl: 'assets/marker-icon.png',
    iconRetinaUrl: 'assets/marker-icon-2x.png',
    shadowUrl: 'assets/marker-shadow.png',
  });

  ngAfterViewInit() {
    if (!navigator.geolocation) {
      this.locationText.set('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.initMap(lat, lng);
        this.loadLocationInfo(lat, lng);
      },
      (error) => {
        this.locationText.set('No se pudo obtener la ubicación');
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  private initMap(lat: number, lng: number) {
    this.map = L.map('map').setView([lat, lng], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    const marker = L.marker([lat, lng], { draggable: true, icon: this.locationIcon }).addTo(
      this.map
    );

    marker.on('dragend', (event) => {
      const pos = (event.target as L.Marker).getLatLng();
      this.onLocationChanged(pos.lat, pos.lng);
    });

    const LocateControl = L.Control.extend({
      onAdd: () => {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
        btn.innerHTML = '\u{1F4CD}';
        btn.title = 'Centrar en mi ubicación';
        btn.style.width = '34px';
        btn.style.height = '34px';
        btn.style.cursor = 'pointer';

        btn.onclick = () => {
          const pos = marker.getLatLng();
          this.map.setView(pos, 12);
          marker.openPopup();
        };

        return btn;
      },
    });

    new LocateControl({ position: 'topleft' }).addTo(this.map);
  }

  private loadLocationInfo(lat: number, lng: number) {
    this.mapService.reverseLocation(lat, lng).subscribe({
      next: (res) => {
        this.locationText.set(`${res.city ?? ''} ${res.country ?? ''}`.trim());
      },
      error: (err) => {
        console.error('Error getting location info', err);
        this.locationText.set('Unknown location');
      },
    });
  }

  private onLocationChanged(lat: number, lng: number) {
    this.loadLocationInfo(lat, lng);

    this.mapService.saveLocation(lat, lng).subscribe({
      next: (res) => {
        console.log('Location saved:', res);
      },
      error: (err) => {
        console.error('Error saving location', err);
      },
    });
  }
}
