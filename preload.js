const { ipcRenderer, contextBridge } = require('electron');

console.info("Preload cargado");


// Exponemos una API segura al proceso de renderizado
contextBridge.exposeInMainWorld('myApi', {
    minimize: () => ipcRenderer.send('minimize'),
    maximize: () => ipcRenderer.send('maximize'),
});

