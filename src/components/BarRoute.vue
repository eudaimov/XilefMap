<script setup>

import save from '@/assets/save.svg';
import record from '@/assets/record.svg';
import pause from '@/assets/pause.svg';
import deleteAll from '@/assets/delete.svg';
import deleteLastWaypoint from '@/assets/deleteLastWaypoint.svg';
import upload from '@/assets/upload.svg';
import {useMapStore} from "../store";
import L from "leaflet";
import {ref, watch} from "vue";

const mapStore = useMapStore();

//Referencias
const botonGrabar = ref(null);
const botonPausa = ref(null);
const botonGuardar = ref(null)
const botonEliminar = ref(null);
const botonEliminarLast = ref(null);
const botonUpload = ref(null);


// Observa cambios en la propiedad "waypoints"
watch(
    () => mapStore.waypoints, // Propiedad a observar
    (newWaypoints, oldWaypoints) => {
      console.log('Waypoints actualizados:', newWaypoints);
      // Ejecuta la acción deseada
      if (newWaypoints.length > 0) {
        botonGuardar.value.classList.remove('desactivado');
        botonEliminar.value.classList.remove('desactivado');
        botonEliminarLast.value.classList.remove('desactivado');

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
  mapStore.clearWaypoints();
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
    gpxData += `    <wpt lat="${latlng.lat}" lon="${latlng.lng}">\n`;
    gpxData += `        <name>${index + 1}</name>\n`;
    if (latlng.elevation !== undefined && !isNaN(latlng.elevation)) {
      gpxData += `        <ele>${parseFloat(latlng.elevation).toFixed(2)}</ele>\n`;
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
    mapStore.polyline.getLatLngs().forEach(latlng => {
      gpxData += `          <trkpt lat="${latlng.lat}" lon="${latlng.lng}">\n`;
      gpxData += `            <ele>${latlng.elevation !== undefined && !isNaN(latlng.elevation) ? parseFloat(latlng.elevation).toFixed(2) : '0.00'}</ele>\n`;
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
  width: 50px;
  height: 50px;
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