

<template>

  <div class="title-win">
    <img :src="logoAplication" alt="logo" width="40" height="40">
    <div class="title-win-text">
      <span>XilefMap</span>
    </div>
    <div class="title-button">
      <button class="buttonMaximize" onclick="maximizar()"></button>
      <button class="buttonMinimize" onclick="minimizar()"></button>
      <button class="buttonClose" onclick="window.close()"></button>
    </div>
  </div>
 <BarRoute/>
  <div class="areaAplication">
    <div id="selectMap">
      <ol>
        <li @click="changeMap('comunidades')">IGN - Unidades Administrativas</li>
        <li @click="changeMap('raster')">IGN Raster</li>
        <li @click="changeMap('ortoIGN')">IGN Orto</li>
        <li @click="changeMap('ign-Base')">IGN Base</li>
        <li @click="changeMap('Google')">Google Base</li>
        <li @click="changeMap('GoogleSatelite')">Google Satélite</li>
        <li @click="changeMap('OpenStreetMap')">OpenStreetMap</li>
        <li @click="changeMap('USGH')">USGH</li>
      </ol>
    </div>
    <div id="map" ></div>
  </div>
</template>
<script setup>

import {onMounted} from "vue";
import logoAplication from '@/assets/logoAplication.png';
import BarRoute from "./BarRoute.vue";
import {useMapStore} from "../store";

const mapStore = useMapStore();
onMounted(()=> {
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
      attribution: '© Instituto Geográfico Nacional de España'
    },
    isWMS: true
  });

});


function changeMap(param) {

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
          styles:'ua-comparador',
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

<style>
*{
  box-sizing: border-box;
  margin:0;
  padding: 0;
}
body {
  margin: 0;
  overflow: hidden;
}

.title-win {
  width: 100%;
  height: 3rem;
  background-color: #2c3e50;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  -webkit-app-region: drag; /* Permite arrastrar la ventana */
}
.title-win-text{
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  column-gap: 2rem;
}
.buttonMinimize{
  -webkit-app-region: no-drag; /* Excluye los botones del área de arrastre */
  min-width: 15px;
  min-height: 15px;
  background: #ffdd00;
  border-radius: 50%;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 4pt;
}
.buttonClose {
  -webkit-app-region: no-drag; /* Excluye los botones del área de arrastre */
  min-width: 15px;
  min-height: 15px;
  background: red;
  border-radius: 50%;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 4pt;
}
.buttonMaximize{
  -webkit-app-region: no-drag; /* Excluye los botones del área de arrastre */
  min-width: 15px;
  min-height: 15px;
  background: #73e408;
  border-radius: 50%;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 4pt;
}
.title-button{
  display:flex;
  gap:0.5rem;
}
.barMenu{
  padding-inline: 1rem;
  width: 100%;
  height: 80px;
  background-color: #474747;
  color: #c1c1c1;
  display: flex;
  align-items: center;
}
.barMenu ol{
  display: inline-flex;
  column-gap: 0.5rem;
  list-style: none;
  align-items: center;
}
.areaAplication{
  display: flex;
  width: 100%;
}
#selectMap{
  min-width: 170px;
  width: 15%;
  height: 100%;
  padding: 1rem;
}
#selectMap ol{
  list-style: none;
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
}
#map{
  width: 85%;
  height: 91vh;
}
</style>