
import {defineStore} from 'pinia';
import L from 'leaflet';



  export const useMapStore = defineStore('map', {
    state: () => ({
      map: null,
      waypoints: [],
      markers:[],
      polyline: null,
      layer: null,
      _onMapClick: null,
    }),
    actions: {
      initializeMap(containerId, options) {
        if (!this.map) {
          this.map = L.map(containerId, options);
        }
      },
      setView(lat, lng, zoom) {
        if (this.map) {
          this.map.setView([lat, lng], zoom);
        }
      },
      addTileLayer({ url, options, isWMS }) {
        if (this.layer) {
          this.map.removeLayer(this.layer);
        }
        if (this.map) {
          if (isWMS) {
            this.layer = L.tileLayer.wms(url, options).addTo(this.map);
          } else {
            this.layer= L.tileLayer(url, options).addTo(this.map);
          }
        }
      },
      async activateRegisterWayPoints() {
        this._onMapClick = async (e) => {
          // Obtener la elevación del punto clicado
          this.waypoints.push(e.latlng);
          // Añadir un marcador en el waypoint
          const marker = L.marker(e.latlng, {
            icon: L.icon({
              iconUrl:  './assets/location.svg',
              shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
              iconSize: [25,80],
              iconAnchor: [12, 40],
              popupAnchor: [1, -40],
              shadowSize: [41, 41],
            }),
          })
            .addTo(this.map)
            .bindPopup('Waypoint #' + this.waypoints.length)
            // .openPopup();
          this.markers.push(marker);

          // Dibujar la línea si hay al menos dos waypoints
          if (this.waypoints.length >= 2) {
            if (this.polyline) {
              this.map.removeLayer(this.polyline); // Eliminar la línea anterior
            }
            this.polyline = L.polyline(this.waypoints, { color: 'red' }).addTo(this.map);
          }
          this.waypoints[this.waypoints.length - 1].elevation = await getElevation(e.latlng.lat, e.latlng.lng);

        };
        this.map.on('click', this._onMapClick);
      },
      deactivateRegisterWayPoints() {
        if (this._onMapClick) {
          this.map.off('click', this._onMapClick);
        }
      },
      clearWaypoints() {
        this.waypoints = [];
        if (this.polyline) {
          this.map.removeLayer(this.polyline);
          this.markers.forEach((marker) => {
            this.map.removeLayer(marker); // Eliminar cada marcador
          });
          this.markers= [];
          this.polyline = null;
        }
      },
      calcularDistanciaTotalRuta() {
        let distanciaTotal = 0;

        // Asegúrate de que haya al menos dos marcadores para calcular una distancia
        if (this.markers.length < 2) {
          return '0,0 km'; // La distancia es 0 si hay menos de dos puntos
        }

        // Itera a través de los marcadores, calculando la distancia entre el actual y el siguiente
        for (let i = 0; i < this.markers.length - 1; i++) {
          const punto1 = this.markers[i].getLatLng();
          const punto2 = this.markers[i + 1].getLatLng();

          // Calcula la distancia entre los dos puntos
          const distanciaSegmento = punto1.distanceTo(punto2);
          distanciaTotal += distanciaSegmento;
        }
          const entera = Math.floor(distanciaTotal);
          let metros= 0;
          let km = 0;
          if(entera > 1) {
            const stringMetros = entera.toString();
            metros = stringMetros.slice(-3);
          }
          if(entera>999){
            km = Math.floor(entera / 1000);
          }

        return km +','+ metros+' km'; // Devuelve la distancia total en kilómetros y metros
      },
      removeLastWaypoint() {
        if (this.waypoints.length > 0) {
          // Eliminar el último marcador del mapa
          const lastMarker = this.markers.pop();
          this.map.removeLayer(lastMarker);

          // Eliminar el último waypoint
          this.waypoints.pop();

          // Actualizar la línea dibujada
          if (this.polyline) {
            this.map.removeLayer(this.polyline);
            if (this.waypoints.length >= 2) {
              this.polyline = L.polyline(this.waypoints, { color: 'red' }).addTo(this.map);
            } else {
              this.polyline = null;
            }
          }
        }
      }
    }
  });


  export const useRouteState = defineStore('routeState', {
    state: () => ({
      record: false,
    }),

  });

  async function getElevation(lat, lng) {
    const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
    const data = await response.json();
    if (data && data.results && data.results.length > 0) {
      return data.results[0].elevation; // Devuelve la elevación
    }
    return null; // Si no hay datos
  }