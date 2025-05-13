
import {defineStore} from 'pinia';
import L from 'leaflet';
import {Chart, registerables} from "chart.js";
Chart.register(...registerables);


  export const useMapStore = defineStore('map', {
    state: () => ({
      map: null,
      waypoints: [],
      elevations: [],
      markers:[],
      polyline: null,
      layer: null,
      _onMapClick: null,
      distances: [],
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
      // ¡Aquí está la clave! Informa a Leaflet del cambio de tamaño
      //map.invalidateSize()
      async activateRegisterWayPoints() {
        this._onMapClick = async (e) => {
          // Obtener la elevación del punto clicado
          this.waypoints.push(e.latlng);
          this.elevations.push( await getElevation(e.latlng.lat, e.latlng.lng));
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
          // Introducir distancias parciales
          const distanciaAcumulada = this.calcularDistanciaAcumulada();
          this.distances.push(distanciaAcumulada);


          // Dibujar la línea si hay al menos dos waypoints
          if (this.waypoints.length >= 2) {
            if (this.polyline) {
              this.map.removeLayer(this.polyline); // Eliminar la línea anterior
            }
            this.polyline = L.polyline(this.waypoints, { color: 'red' }).addTo(this.map);
          }


        };
        this.map.on('click', this._onMapClick);
        // Escucha el evento de zoom y actualiza los marcadores
        this.map.on('zoomend', () => {
          this.markers.forEach(marker => {
            // Asegúrate de que cada marcador esté correctamente posicionado
            marker.setLatLng(marker.getLatLng());
          });
        });
      },
      actualizarGrafica(){
        const storeGrafica = useGraficChartStore();
        storeGrafica.canvas= document.getElementById('perfilGrafico');
        storeGrafica.distanciasAcumuladas = [...this.distances].map(d => d / 1000);
        storeGrafica.elevaciones= [...this.elevations];
        storeGrafica.conjuntoDatos =
            storeGrafica.distanciasAcumuladas.map((x, i) => ({
              x,
              y: storeGrafica.elevaciones[i]
            }));
        storeGrafica.iniciar()
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
          this.distances = [];
          this.elevations = [];
          this.polyline = null;
        }
      },
      calcularDistanciaAcumulada() {
        let distanciaTotal = 0;

        // Asegúrate de que haya al menos dos marcadores para calcular una distancia
        if (this.markers.length < 1) {
          return 0; // La distancia es 0 si hay menos de dos puntos
        }

        // Itera a través de los marcadores, calculando la distancia entre el actual y el siguiente
        for (let i = 0; i < this.markers.length - 1; i++) {
          const punto1 = this.markers[i].getLatLng();
          const punto2 = this.markers[i + 1].getLatLng();

          // Calcula la distancia entre los dos puntos
          const distanciaSegmento = punto1.distanceTo(punto2);
          distanciaTotal += distanciaSegmento;
        }

        return distanciaTotal;
      },
      calcularDistanciaTotalRuta() {
        let distanciaTotal = this.calcularDistanciaAcumulada();

        // Asegúrate de que haya al menos dos marcadores para calcular una distancia
        if (this.markers.length < 1) {
          return '0,0 km'; // La distancia es 0 si hay menos de dos puntos
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
          this.distances.pop();
          this.elevations.pop();

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

export const useShowGraphic = defineStore('showGraphic', {
  state: () => ({
    oculto: true,
  }),
  actions: {
    toggleMostrar() {
      this.oculto = !this.oculto;
      const valor = this.oculto;
    },
  },
});

export const useGraficChartStore = defineStore('graficaChart', {
  state: () => ({
    chart: null,
    conjuntoDatos: [],
    canvas: null,
    distanciasAcumuladas: [],
    elevaciones: [],
    construyendo: false,
  }),
  actions:{
    iniciar(){
      if (
          !this.canvas ||
          this.conjuntoDatos.length < 2 ||
          this.conjuntoDatos.length !== this.elevaciones.length ||
          this.conjuntoDatos.length !== this.distanciasAcumuladas.length
      ) {

        console.warn('Datos desincronizados o insuficientes para iniciar el gráfico');
        return;
      }
      // Destruye el gráfico existente si ya está creado
      if (this.chart) {
        this.chart.destroy();
        this.chart=null;
        this.chartOptions = null;
      }

      let chartOptions= {
        datasets: [{
          label: 'Elevación (m)',
          data: this.conjuntoDatos,
          borderColor: 'rgb(255,114,53)',
          backgroundColor: 'rgb(255,114,53)',
          showLine: true,
          fill: true,
        }]
      }

      this.chart= new Chart(this.canvas, {
        type: 'line',
        data: chartOptions,
        options: {
          maintainAspectRatio: false,
          parsing:false,
          scales: {
            x: {
              type: 'linear', // Asegúrate de especificar el tipo de escala
              min: 0,
              max: this.distanciasAcumuladas[this.distanciasAcumuladas.length - 1] || 0,
              title: {
                display: true,
                text: 'Distancia Acumulada (km)'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Elevación (m)'
              }
            }
          }
        }
      });
    },
    eliminarChart(){
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
        this.chartOptions = null;
      }
    }
  }

});

  async function getElevation(lat, lng) {
    const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
    const data = await response.json();
    if (data && data.results && data.results.length > 0) {
      return data.results[0].elevation; // Devuelve la elevación
    }
    return null; // Si no hay datos
  }