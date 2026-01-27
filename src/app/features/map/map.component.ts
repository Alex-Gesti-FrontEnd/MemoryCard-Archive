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

  private userMarker!: L.Marker;
  private storeMarkers: L.Marker[] = [];

  locationIcon = L.icon({
    iconUrl: 'assets/marker-icon.png',
    iconSize: [17.5, 30],
    iconRetinaUrl: 'assets/marker-icon-2x.png',
    shadowUrl: 'assets/marker-shadow.png',
    shadowAnchor: [9, 30],
  });

  storeIcon = L.icon({
    iconUrl: 'assets/marker-store-icon.png',
    iconSize: [12, 20],
    iconRetinaUrl: 'assets/marker-store-icon-2x.png',
    shadowUrl: 'assets/marker-shadow.png',
    shadowAnchor: [6, 20],
  });

  ngAfterViewInit() {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.initMap(lat, lng);
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  private initMap(lat: number, lng: number) {
    this.map = L.map('map').setView([lat, lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.userMarker = L.marker([lat, lng], { draggable: true, icon: this.locationIcon })
      .addTo(this.map)
      .bindPopup('Tu ubicación')
      .openPopup();

    this.userMarker.on('dragend', (event) => {
      const pos = (event.target as L.Marker).getLatLng();
      this.updateStores(pos.lat, pos.lng);
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
          const pos = this.userMarker.getLatLng();
          this.map.setView(pos, 14);
          this.userMarker.openPopup();
        };

        return btn;
      },
    });

    new LocateControl({ position: 'topleft' }).addTo(this.map);

    this.updateStores(lat, lng);
  }

  private updateStores(lat: number, lng: number) {
    const zoom = this.map.getZoom();
    const radius = 10000;

    this.storeMarkers.forEach((m) => this.map.removeLayer(m));
    this.storeMarkers = [];

    this.mapService.getGameStores(lat, lng, radius).subscribe((stores) => {
      stores.forEach((store) => {
        const storeUrl =
          store.url ?? `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;
        const popupContent = `
          <div>
            <b><a href="${storeUrl}" target="_blank">${store.name}</a></b>
          </div>
        `;
        const marker = L.marker([store.lat, store.lng], { icon: this.storeIcon })
          .addTo(this.map)
          .bindPopup(popupContent);

        this.storeMarkers.push(marker);
      });
    });
  }
}
