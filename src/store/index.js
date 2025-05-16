import {defineStore} from 'pinia';
import L from 'leaflet';
import {Chart, registerables} from "chart.js";
import 'leaflet.offline';

Chart.register(...registerables);

// Añade estas constantes al inicio del archivo
const MAX_CACHE_SIZE = 1024 * 1024 * 1024; // 1GB en bytes
const CACHE_NAME = 'map-tiles-v1';

// Añade estas funciones auxiliares antes de la definición del store
async function getCacheSize() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    let size = 0;

    for (const key of keys) {
      const response = await cache.match(key);
      const blob = await response.blob();
      size += blob.size;
    }
    return size;
  } catch (error) {
    console.error('Error al calcular tamaño del caché:', error);
    return 0;
  }
}

async function cleanCacheIfNeeded(requiredSpace) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const currentSize = await getCacheSize();

    if (currentSize + requiredSpace > MAX_CACHE_SIZE) {
      const keys = await cache.keys();
      const entries = await Promise.all(
          keys.map(async (key) => {
            const response = await cache.match(key);
            const blob = await response.blob();
            return {
              key,
              size: blob.size,
              lastAccessed: response.headers.get('last-accessed') || 0
            };
          })
      );

      entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

      let freedSpace = 0;
      for (const entry of entries) {
        await cache.delete(entry.key);
        freedSpace += entry.size;
        if (currentSize - freedSpace + requiredSpace <= MAX_CACHE_SIZE) {
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error al limpiar caché:', error);
  }
}


// Función de debounce para optimizar las actualizaciones
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}


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
      isZooming: false,
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
      async addTileLayer({ url, options, isWMS }) {
        if (this.layer) {
          this.map.removeLayer(this.layer);
        }

        if (this.map) {
          if (isWMS) {
            // Para capas WMS, usar caché personalizado
            this.layer = L.tileLayer.wms(url, {
              ...options,
              createTile: async function(coords, done) {
                const tile = document.createElement('img');
                const tileUrl = this.getTileUrl(coords);

                try {
                  const cache = await caches.open(CACHE_NAME);
                  let response = await cache.match(tileUrl);

                  if (response) {
                    // Usar tile cacheado
                    const newHeaders = new Headers(response.headers);
                    newHeaders.set('last-accessed', Date.now());
                    response = new Response(response.body, { headers: newHeaders });
                    cache.put(tileUrl, response.clone());

                    const blob = await response.blob();
                    tile.src = URL.createObjectURL(blob);
                  } else {
                    // Descargar nuevo tile
                    response = await fetch(tileUrl);
                    const blob = await response.blob();

                    await cleanCacheIfNeeded(blob.size);

                    const headers = new Headers();
                    headers.set('last-accessed', Date.now());
                    const cacheResponse = new Response(blob, { headers });
                    await cache.put(tileUrl, cacheResponse);

                    tile.src = URL.createObjectURL(blob);
                  }
                } catch (error) {
                  console.error('Error cargando tile:', error);
                  // Cargar tile sin caché si hay error
                  tile.src = tileUrl;
                }

                done(null, tile);
                return tile;
              }
            }).addTo(this.map);
          } else {
            // Para tiles normales, usar leaflet.offline
            this.layer = L.tileLayer.offline(url, {
              ...options,
              useCache: true,
              crossOrigin: true,
              maxZoom: 19,
              storeName: CACHE_NAME, // Nombre del almacén IndexedDB
              createTile: function(coords, done) {
                const tile = L.TileLayer.prototype.createTile.call(this, coords, done);
                tile.crossOrigin = 'anonymous';
                return tile;
              }
            }).addTo(this.map);

            // Eventos para monitorear el caché
            this.layer.on('offline:below-min-zoom-error', () => {
              console.log('Zoom demasiado alejado para cachear');
            });

            this.layer.on('offline:save-start', async (e) => {
              console.log('Guardando tiles en caché...');
              await cleanCacheIfNeeded(e.storageSize || 0);
            });

            this.layer.on('offline:save-end', async () => {
              const size = await getCacheSize();
              console.log(`Tiles guardados. Tamaño actual del caché: ${(size / 1024 / 1024).toFixed(2)} MB`);
            });
          }
        }
      },

      // ¡Aquí está la clave! Informa a Leaflet del cambio de tamaño
      //map.invalidateSize()
      async activateRegisterWayPoints() {
        // Crear el icono una sola vez fuera del manejador de eventos
        const waypointIcon = L.icon({
          iconUrl: './assets/location.svg',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 80],
          iconAnchor: [12, 40],
          popupAnchor: [1, -40],
          shadowSize: [41, 41],
        });

        // Cache para almacenar elevaciones
        const elevationCache = new Map();

        // Función optimizada para obtener elevación con cache
        const getCachedElevation = async (lat, lng) => {
          const key = `${lat},${lng}`;
          if (elevationCache.has(key)) {
            return elevationCache.get(key);
          }
          const elevation = await getElevation(lat, lng);
          elevationCache.set(key, elevation);
          return elevation;
        };

        // Inicializar la polyline si no existe
        if (!this.polyline) {
          this.polyline = L.polyline([], {
            color: 'red',
            weight: 3
          }).addTo(this.map);
        }

        this._onMapClick = async (e) => {
          // Crear el marcador inmediatamente para feedback visual
          const marker = L.marker(e.latlng, { icon: waypointIcon })
            .addTo(this.map)
            .bindPopup('Waypoint #' + (this.waypoints.length + 1));

          // Actualizar arrays y dibujar polyline inmediatamente
          this.waypoints.push(e.latlng);
          this.markers.push(marker);

          // Actualizar la polyline inmediatamente si hay suficientes puntos
          if (this.waypoints.length >= 2) {
            this.polyline.setLatLngs(this.waypoints);
          }

          // Obtener elevación y distancia en segundo plano
          Promise.all([
            getCachedElevation(e.latlng.lat, e.latlng.lng),
            Promise.resolve(this.calcularDistanciaAcumulada())
          ]).then(([elevation, distancia]) => {
            this.elevations.push(elevation);
            this.distances.push(distancia);
          });
        };

        // Usar un EventListener con opciones de rendimiento
        this.map.on('click', this._onMapClick, {
          passive: true // Mejora el rendimiento en navegadores modernos
        });

        // Manejar el zoom con debounce
        const handleZoomEnd = debounce(() => {
          if (this.markers.length === 0) return;

          if (this.isZooming) {
            this.isZooming = false;
            // Actualizar markers en lotes
            requestAnimationFrame(() => {
              this.markers.forEach(marker => {
                const currentPos = marker.getLatLng();
                if (currentPos) {
                  marker.setLatLng(currentPos);
                }
              });
              // Asegurar que la polyline se mantenga actualizada
              if (this.waypoints.length >= 2) {
                this.polyline.setLatLngs(this.waypoints);
              }
            });
          }
        }, 250);

        this.map.on('zoomstart', () => {
          this.isZooming = true;
        });

        this.map.on('zoomend', handleZoomEnd);
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
      // Actualizar el método clearWaypoints
      clearWaypoints() {
        this.waypoints = [];
        if (this.polyline) {
          this.polyline.setLatLngs([]); // Limpiar los puntos de la polyline
        }
        this.markers.forEach((marker) => {
          this.map.removeLayer(marker);
        });
        this.markers = [];
        this.distances = [];
        this.elevations = [];
      },
      // Optimizar el cálculo de distancia
      calcularDistanciaAcumulada() {
        if (this.markers.length < 2) return 0;

        // Usar reduce para mejor rendimiento
        return this.markers.reduce((total, marker, index, array) => {
          if (index === 0) return 0;
          const punto1 = array[index - 1].getLatLng();
          const punto2 = marker.getLatLng();
          return total + punto1.distanceTo(punto2);
        }, 0);
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
      // Actualizar el método removeLastWaypoint
      removeLastWaypoint() {
        if (this.waypoints.length > 0) {
          // Eliminar el último marcador
          const lastMarker = this.markers.pop();
          this.map.removeLayer(lastMarker);

          // Eliminar el último waypoint y datos relacionados
          this.waypoints.pop();
          this.distances.pop();
          this.elevations.pop();

          // Actualizar la polyline
          if (this.waypoints.length >= 2) {
            this.polyline.setLatLngs(this.waypoints);
          } else if (this.polyline) {
            this.polyline.setLatLngs([]);
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