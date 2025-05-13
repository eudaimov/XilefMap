<script setup>

import save from '@/assets/save.svg';
import record from '@/assets/record.svg';
import pause from '@/assets/pause.svg';
import deleteAll from '@/assets/delete.svg';
import deleteLastWaypoint from '@/assets/deleteLastWaypoint.svg';
import upload from '@/assets/upload.svg';
import grafica from '@/assets/grafica.svg';
import graficaUpdate from '@/assets/graficaupdate.svg'
import {useMapStore, useShowGraphic, useGraficChartStore} from "../store";
import L from "leaflet";
import { ref, watch} from "vue";

const mapStore = useMapStore();
const graficStore = useGraficChartStore();
const showGraphicStore = useShowGraphic();


//Referencias
const botonGrabar = ref(null);
const botonPausa = ref(null);
const botonGuardar = ref(null)
const botonEliminar = ref(null);
const botonEliminarLast = ref(null);
const botonUpload = ref(null);
const botonGrafica = ref(null);
const distTotalSpan = ref(null);




// Observa cambios en la propiedad "waypoints"
watch(
    () => mapStore.waypoints, // Propiedad a observar
    (newWaypoints, oldWaypoints) => {
      // Ejecuta la acción deseada
      if (newWaypoints.length > 0) {
        botonGuardar.value.classList.remove('desactivado');
        botonEliminar.value.classList.remove('desactivado');
        botonEliminarLast.value.classList.remove('desactivado');
        distTotalSpan.value.innerHTML = mapStore.calcularDistanciaTotalRuta();

      }else{
        botonGuardar.value.classList.add('desactivado');
        botonEliminar.value.classList.add('desactivado');
        botonEliminarLast.value.classList.add('desactivado');
      }

    },
    { deep: true } // Observa cambios profundos en arrays u objetos
);


function crearRuta() {
  botonGrabar.value.classList.toggle('desactivado');
  botonGrabar.value.classList.toggle('ocultar');
  botonPausa.value.classList.toggle('desactivado');
  botonPausa.value.classList.toggle('ocultar');
  mapStore.activateRegisterWayPoints();
}
function detenerRuta() {
  botonGrabar.value.classList.toggle('desactivado');
  botonPausa.value.classList.toggle('desactivado');
  botonGrabar.value.classList.toggle('ocultar');
  botonPausa.value.classList.toggle('ocultar');
  mapStore.deactivateRegisterWayPoints();
}
function deleteRoute() {
  distTotalSpan.value.innerHTML = "0.0 km"
  mapStore.clearWaypoints();
  graficStore.eliminarChart()
}
function deleteLast() {
  mapStore.removeLastWaypoint();
}
function downloadGPX() {

  if (!mapStore.waypoints || mapStore.waypoints.length === 0) {
    console.warn("No hay waypoints para exportar.");
    return;
  }

  let gpxData = '<?xml version="1.0" encoding="UTF-8"?>\n';
  gpxData += '<gpx version="1.1" creator="Mi Aplicación JS">\n';

  // Añadir waypoints
  mapStore.waypoints.forEach((latlng, index) => {
    const elevation = mapStore.elevations[index];
    gpxData += `    <wpt lat="${latlng.lat}" lon="${latlng.lng}">\n`;
    gpxData += `        <name>${index + 1}</name>\n`;
    if (elevation !== undefined && !isNaN(elevation)) {
      gpxData += `        <ele>${parseFloat(elevation).toFixed(2)}</ele>\n`;
    } else {
      gpxData += `        <ele>0.00</ele>\n`; // Valor por defecto si no hay elevación
    }
    gpxData += '    </wpt>\n';
  });

  // Añadir la ruta (trkseg dentro de trk)
  if (mapStore.polyline && mapStore.polyline.getLatLngs().length > 0) {
    gpxData += '    <trk>\n';
    gpxData += '        <name>Ruta ElixMap</name>\n';
    gpxData += '        <trkseg>\n';
    mapStore.polyline.getLatLngs().forEach((latlng,index) => {
      const elevation = mapStore.elevations[index];
      gpxData += `          <trkpt lat="${latlng.lat}" lon="${latlng.lng}">\n`;
      gpxData += `            <ele>${elevation !== undefined && !isNaN(elevation) ? parseFloat(elevation).toFixed(2) : '0.00'}</ele>\n`;
      gpxData += `          </trkpt>\n`;
    });
    gpxData += '        </trkseg>\n';
    gpxData += '     </trk>\n';
  }

  gpxData += '</gpx>\n';

  const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Ruta.gpx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function uploadRoute(event) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.gpx'; // Aceptar solo archivos GPX

  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const gpxData = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxData, "application/xml");

        const trkpts = xmlDoc.getElementsByTagName("trkpt");
        const points = [];

        for (let i = 0; i < trkpts.length; i++) {
          const lat = parseFloat(trkpts[i].getAttribute("lat"));
          const lon = parseFloat(trkpts[i].getAttribute("lon"));
          const eleNode = trkpts[i].getElementsByTagName("ele")[0];
          const ele = eleNode ? parseFloat(eleNode.textContent) : null; // Leer elevación si existe
          points.push({ lat, lon, ele });
        }
        const trazo = L.polyline(points, { color: 'blue' }).addTo(mapStore.map);
        // Ajustar el mapa para que se centre en la polilínea
        const bounds = trazo.getBounds();
        mapStore.map.fitBounds(bounds, { padding: [40, 40] });
      };

      reader.readAsText(file); // Leer el archivo como texto
    }
  });

  input.click(); // Simula el clic en el input
}
function mostrarOcultarGrafica() {
  // Cambia la visibilidad de la gráfica;
  // Si la gráfica está oculta, la muestra y viceversa
  console.info("Esta oculto")
  if(showGraphicStore.oculto){
    mapStore.actualizarGrafica()
  }
  showGraphicStore.toggleMostrar();
}
function actualizarGrafica() {
  if(!showGraphicStore.oculto){
    mapStore.actualizarGrafica()
  }
}
</script>

<template>
  <nav  class="barMenu">
    <ol>

      <li ref="botonGrabar" id="botonGrabar" class="boton desactivado" @click="crearRuta()">
        <img :src="record" class="icono"  alt="Graba">
      </li>
      <li ref="botonPausa" class="boton desactivado ocultar" @click="detenerRuta()">
        <img class="icono" :src="pause" alt="Pausa"/>
      </li>
      <li ref="botonGuardar"  class="boton desactivado" @click="downloadGPX(waypoints, polyline)">
        <img class="icono" :src="save" alt="Guardar" >
      </li>
      <li ref="botonEliminar" class="boton desactivado" @click="deleteRoute()">
        <img class="icono" :src="deleteAll" alt="Eliminar">
      </li>
      <li ref="botonEliminarLast" class="boton desactivado" @click="deleteLast()">
        <img :src="deleteLastWaypoint" class="icono" alt="borrarUltimoWaypoint" title="Borrar último waypoint">
      </li>
      <li ref="botonUpload" @click="uploadRoute()">
        <img :src="upload" class="icono" alt="upload" title="Cargar ruta sobre el mapa"></li>

      <li ref="botonGrafica"  @click="mostrarOcultarGrafica()">
        <img :src="grafica" alt="grafica" title="Mostrar Gráfica" class="icono">
      </li>
      <li ref="botonGraficaUpdate" @click="actualizarGrafica()">
        <img :src="graficaUpdate" alt="graficaUpdate" title="Actualizar Gráfica" class="icono">
      </li>
      <li>
        T: <span ref="distTotalSpan">0,0 km</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.boton{
  transition: opacity 1s ease;
  opacity: 100%;
}
#botonGrabar:hover{
  opacity: 100% !important;
}
.icono{
  width: 6vh;
  height: 6vh;
  background: #817e7e;
  border-radius: 0.3rem;
  cursor: pointer;
}
.desactivado{
  opacity: 50% !important;
}
.ocultar{
  display: none;
}


</style>