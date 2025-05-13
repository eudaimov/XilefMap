<style scoped>

.menu-desplegable {
  list-style: none;
  padding: 0;
  margin: 0;
}

.categoria {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f0f0f0;
  cursor: pointer;
  user-select: none;
}

.categoria:hover {
  background-color: #e0e0e0;
}

.flecha {
  transition: transform 0.3s ease;
}

.flecha.rotada {
  transform: rotate(180deg);
}

.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  background-color: white;
  padding: 0;
  margin: 0;
}

.submenu.activo {
  max-height: 500px; /* Altura máxima del menú desplegado */
}

.submenu li {
  padding: 8px 20px;
  cursor: pointer;
}

.submenu li:hover {
  background-color: rgba(221, 241, 251, 0.49);
}
.seleccionado {
  font-weight: bold;
  background-color: #ddf1fb;
}

</style>
<template>
  <BarTitle/>
  <BarRoute/>
  <div ref="areaAplication" class="areaAplication">
    <div id="selectMap">
      <ol  class="menu-desplegable">
        <li>
          <div class="categoria" @click="toggleSubmenu('ign')">
            <span>IGN</span>
            <span class="flecha" :class="{ 'rotada': menuActivo.ign }">▼</span>
          </div>
          <ol class="submenu" :class="{ 'activo': menuActivo.ign }">
            <li @click="changeMap('raster')"
                :class="{'seleccionado': mapaActivo === 'raster'}">
              IGN Raster
            </li>
            <li @click="changeMap('ortoIGN')"
                :class="{'seleccionado': mapaActivo === 'ortoIGN'}">
              IGN Orto
            </li>
            <li @click="changeMap('ign-Base')"
                :class="{'seleccionado': mapaActivo === 'ign-Base'}">
              IGN Base
            </li>
            <li @click="changeMap('comunidades')"
                :class="{'seleccionado': mapaActivo === 'comunidades'}">
              IGN - Unidades Administrativas
            </li>
          </ol>
        </li>
        <li>
          <div class="categoria" @click="toggleSubmenu('google')">
            <span>Google</span>
            <span class="flecha" :class="{ 'rotada': menuActivo.google }">▼</span>
          </div>
          <ol class="submenu" :class="{ 'activo': menuActivo.google }">
            <li @click="changeMap('Google')"
                :class="{'seleccionado': mapaActivo === 'Google'}">
              Google Base
            </li>
            <li @click="changeMap('GoogleSatelite')"
                :class="{'seleccionado': mapaActivo === 'GoogleSatelite'}">
              Google Sat
            </li>
          </ol>
        </li>
        <li>
          <div class="categoria" @click="toggleSubmenu('openstreetmap')">
            <span>OpenStreetMap</span>
            <span class="flecha" :class="{ 'rotada': menuActivo.openstreetmap }">▼</span>
          </div>
          <ol class="submenu" :class="{ 'activo': menuActivo.openstreetmap }">
            <li @click="changeMap('OpenStreetMap')"
                :class="{'seleccionado': mapaActivo === 'OpenStreetMap'}">
              OpenStreetMap
            </li>
          </ol>
        </li>
        <li>
          <div class="categoria" @click="toggleSubmenu('usgh')">
            <span>USGH</span>
            <span class="flecha" :class="{ 'rotada': menuActivo.usgh }">▼</span>
          </div>
          <ol class="submenu" :class="{ 'activo': menuActivo.usgh }">
            <li @click="changeMap('USGH')"
                :class="{'seleccionado': mapaActivo === 'USGH'}">
              USGH
            </li>
          </ol>
        </li>


      </ol>
    </div>
    <div id="map"></div>
  </div>
  <Grafica/>
</template>
<script setup>

import {onMounted, ref, watch} from "vue";
import BarRoute from "./BarRoute.vue";
import {useMapStore, useShowGraphic} from "@/store";
import Grafica from "@/components/Grafica.vue";
import BarTitle from "@/components/BarTitle.vue";

const areaAplication = ref();
// Agregar el estado para controlar los menús desplegables
const menuActivo = ref({
  ign: true,
  google: false,
  openstreetmap: false,
  usgh: false,
});
const mapaActivo = ref('raster');


const mapStore = useMapStore();
const showGraphicStore = useShowGraphic();

watch(
    () => showGraphicStore.oculto,
    (newValue, oldValue) => {
      if (newValue) {
        areaAplication.value.classList.add('showGraphic');
        areaAplication.value.classList.remove('hideGraphic');
      } else {
        areaAplication.value.classList.remove('showGraphic');
        areaAplication.value.classList.add('hideGraphic');
      }
      console.log("El estado de record cambió a:", newValue);
    }
);

onMounted(() => {
  mapStore.initializeMap('map', {
    center: [40.3200, -3.7700],
    zoom: 6,
    zoomControl: false,
  });
  mapStore.addTileLayer({
    url: 'https://www.ign.es/wms-inspire/mapa-raster',
    options: {
      layers: 'mtn_rasterizado', // Nombre de la capa
      format: 'image/png',
      transparent: false,
      attribution: "<span class='enlace-externo' onclick='enlaceExterno(this)' data-enlace='https://www.ign.es'>© Instituto Geográfico Nacional de España</span>",
    },
    isWMS: true
  });

});

// Función para alternar los submenús
const toggleSubmenu = (menu) => {
  menuActivo.value[menu] = !menuActivo.value[menu];
};

function changeMap(param) {
  mapaActivo.value = param;
  switch (param) {
    case "raster":
      mapStore.addTileLayer({
        url: 'https://www.ign.es/wms-inspire/mapa-raster',
        options: {
          layers: 'mtn_rasterizado', // Nombre de la capa ráster
          format: 'image/png',
          transparent: false,
          attribution: '© Instituto Geográfico Nacional de España',
        },
        isWMS: true
      });
      break;
    case "ign-Base":
      mapStore.addTileLayer({
        url: 'https://www.ign.es/wms-inspire/ign-base',
        options: {
          layers: 'IGNBaseTodo', // Nombre de la capa
          format: 'image/png',
          transparent: false,
          attribution: '© Instituto Geográfico Nacional de España'
        },
        isWMS: true
      });
      break;
    case "Google":
      mapStore.addTileLayer({
        url: 'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        options: {
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], // Subdominios usados por Google
          attribution: '© Google Maps'
        },
        isWMS: false
      });
      break;
    case "GoogleSatelite":
      mapStore.addTileLayer({
        url: 'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        options: {
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], // Subdominios usados por Google
          attribution: '© Google Maps'
        },
        isWMS: false
      });
      break;
    case "OpenStreetMap":
      mapStore.addTileLayer({
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
          attribution: '© OpenStreetMap contributors'
        },
        isWMS: false
      });
      break;
    case "ortoIGN":
      mapStore.addTileLayer({
        url: 'https://www.ign.es/wms-inspire/pnoa-ma',
        options: {
          layers: 'OI.OrthoimageCoverage', // Etiqueta name
          format: 'image/png',
          transparent: false,
          attribution: '© Instituto Geográfico Nacional de España'
        },
        isWMS: true
      });
      break;
    case "comunidades":
      mapStore.addTileLayer({
        url: 'https://www.ign.es/wms-inspire/unidades-administrativas',
        options: {
          layers: 'AU.AdministrativeUnit', // Capa de unidades administrativas
          format: 'image/png',
          styles: 'ua-comparador',
          transparent: false,
          attribution: '© Instituto Geográfico Nacional de España'
        },
        isWMS: true
      });
      break;
    case "USGH":
      //https://apps.nationalmap.gov/services/
      mapStore.addTileLayer({
        url: 'https://basemap.nationalmap.gov/arcgis/services/USGSImageryTopo/MapServer/WMSServer',
        options: {
          layers: '0', // Nombre de la capa
          format: 'image/png',
          transparent: false,
          attribution: '© USGSH'
        },
        isWMS: true
      });
      break;
  }

}


</script>
