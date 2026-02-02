import { Component, AfterViewInit, inject, signal } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from '../../core/services/map.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map;
  private userMarker!: L.Marker;
  private storeMarkers: L.Marker[] = [];
  private routeLayer!: L.GeoJSON;

  mapService = inject(MapService);

  selectedTypes: string[] = [
    'video_games',
    'second_hand',
    'electronics',
    'department_store',
    'shopping_centre',
  ];

  selectedRadius = 10000;

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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.initMap(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => console.error(err),
    );
  }

  private initMap(lat: number, lng: number) {
    this.map = L.map('map').setView([lat, lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.userMarker = L.marker([lat, lng], { draggable: true, icon: this.locationIcon }).addTo(
      this.map,
    );

    this.userMarker.on('dragend', (event) => {
      const pos = (event.target as L.Marker).getLatLng();

      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = undefined!;
      }

      this.updateStores(pos.lat, pos.lng);
    });

    const LocateControl = L.Control.extend({
      onAdd: () => {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
        btn.innerHTML = '\u{1F4CD}';
        btn.style.width = '34px';
        btn.style.height = '34px';
        btn.style.cursor = 'pointer';
        btn.onclick = () => {
          const pos = this.userMarker.getLatLng();
          this.map.setView(pos, 14);
        };
        return btn;
      },
    });

    const SelectShopType = L.Control.extend({
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const select = document.createElement('select');

        select.innerHTML = `
          <option value="all">All types</option>
          <option value="videogames">Videogames</option>
          <option value="electronics">Electronics</option>
          <option value="general">General Stores</option>
        `;

        select.onchange = () => {
          const value = select.value;

          if (value === 'all') {
            this.selectedTypes = [
              'video_games',
              'second_hand',
              'electronics',
              'department_store',
              'shopping_centre',
            ];
          }

          if (value === 'videogames') {
            this.selectedTypes = ['video_games', 'second_hand'];
          }

          if (value === 'electronics') {
            this.selectedTypes = ['electronics'];
          }

          if (value === 'general') {
            this.selectedTypes = ['department_store', 'shopping_centre'];
          }

          const pos = this.userMarker.getLatLng();
          this.updateStores(pos.lat, pos.lng);
        };

        container.appendChild(select);
        L.DomEvent.disableClickPropagation(container);
        return container;
      },
    });

    const SelectRadius = L.Control.extend({
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const select = document.createElement('select');

        select.innerHTML = `
          <option value="2000">2 km</option>
          <option value="5000">5 km</option>
          <option value="10000" selected>10 km</option>
          <option value="20000">20 km</option>
        `;

        select.onchange = () => {
          this.selectedRadius = Number(select.value);
          const pos = this.userMarker.getLatLng();
          this.updateStores(pos.lat, pos.lng);
        };

        container.appendChild(select);
        L.DomEvent.disableClickPropagation(container);
        return container;
      },
    });

    new LocateControl({ position: 'topleft' }).addTo(this.map);
    new SelectShopType({ position: 'topright' }).addTo(this.map);
    new SelectRadius({ position: 'topright' }).addTo(this.map);

    this.updateStores(lat, lng);
  }

  private updateStores(lat: number, lng: number) {
    this.storeMarkers.forEach((m) => this.map.removeLayer(m));
    this.storeMarkers = [];

    this.mapService
      .getGameStores(lat, lng, this.selectedRadius, this.selectedTypes)
      .subscribe((stores) => {
        stores.forEach((store) => {
          const storeUrl =
            store.url ??
            `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;

          const marker = L.marker([store.lat, store.lng], { icon: this.storeIcon })
            .addTo(this.map)
            .bindPopup(`<b><a href="${storeUrl}" target="_blank">${store.name}</a></b>`);

          marker.on('click', () => this.showRouteTo(store.lat, store.lng));
          this.storeMarkers.push(marker);
        });
      });
  }

  private showRouteTo(storeLat: number, storeLng: number) {
    const userPos = this.userMarker.getLatLng();

    const loadingPopup = L.popup()
      .setLatLng([storeLat, storeLng])
      .setContent('Calculating route...')
      .openOn(this.map);

    this.mapService.getRoute(userPos.lat, userPos.lng, storeLat, storeLng).subscribe({
      next: (route) => {
        this.map.removeLayer(loadingPopup);

        if (!route?.geometry) {
          L.popup().setLatLng([storeLat, storeLng]).setContent('Route not found').openOn(this.map);
          return;
        }

        if (this.routeLayer) this.map.removeLayer(this.routeLayer);

        this.routeLayer = L.geoJSON(route.geometry, {
          style: { color: 'blue', weight: 4 },
        }).addTo(this.map);

        const mins = Math.ceil((route.distance / 1000 / 4.5) * 60);
        const km = (route.distance / 1000).toFixed(1);

        L.popup()
          .setLatLng([storeLat, storeLng])
          .setContent(`${km} km, approx. ${mins} min`)
          .openOn(this.map);
      },
      error: (err) => {
        console.error('Error calculating route:', err);
        this.map.removeLayer(loadingPopup);
        L.popup()
          .setLatLng([storeLat, storeLng])
          .setContent('Error calculating route.')
          .openOn(this.map);
      },
    });
  }
}
