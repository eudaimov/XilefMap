const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron'); // Usa ipcMain en lugar de IpcMain
const path = require('path');

let win;
let isMaximizado = false;

// Función para crear la ventana principal
const createWindow = () => {
    win = new BrowserWindow({
        width: 1100,
        height: 700,
        autoHideMenuBar: true, // Oculta el menú predeterminado
        frame: false, // Oculta la barra de título
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Usa el archivo preload
            nodeIntegration: false, // Se recomienda deshabilitar por seguridad
            contextIsolation: true, // Mejora la seguridad
        },
        icon: path.join(__dirname, 'logoAplication.png'), // Icono de la aplicación
    });

    // Carga la aplicación Vue desde el servidor de desarrollo de Vite
    // o desde los archivos estáticos construidos
    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5173'); // La URL del servidor de desarrollo de Vite
        console.info("Entrando en desarrollo")
    } else {
        win.loadFile(path.join(__dirname, 'dist', 'index.html')); // Carga el archivo index.html construido
        console.info("Entrando en producción")
    }
};

// Evento para minimizar la ventana desde el proceso de renderizado
ipcMain.on('minimize', () => {
    if (win) {
        win.minimize();
    }
});
ipcMain.on('maximize', () => {
    if (win) {
        if(isMaximizado){
            win.restore();
            isMaximizado = false;
        }else{
            win.maximize(); // Método para maximizar la ventana
            isMaximizado = true;
        }
    }
});
ipcMain.on('enlaceExterno', (event, url) => {
    // Abre el enlace externo en el navegador predeterminado
    console.info("Abriendo enlace externo: " + url);
     shell.openExternal(url)
});


// Inicializa la aplicación cuando esté lista
app.whenReady().then(createWindow);