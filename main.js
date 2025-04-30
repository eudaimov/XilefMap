const { app, BrowserWindow, Menu, ipcMain } = require('electron'); // Usa ipcMain en lugar de IpcMain
const path = require('path');

let win;

// Funci�n para crear la ventana principal
const createWindow = () => {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true, // Oculta el men� predeterminado
        frame: false, // Oculta la barra de t�tulo
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Usa el archivo preload
            nodeIntegration: false, // Se recomienda deshabilitar por seguridad
            contextIsolation: true, // Mejora la seguridad
        },
        icon: path.join(__dirname, 'logoAplication.png'), // Icono de la aplicaci�n
    });

    // Carga la aplicaci�n Vue desde el servidor de desarrollo de Vite
    // o desde los archivos est�ticos construidos
    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5173'); // La URL del servidor de desarrollo de Vite
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html')); // Carga el archivo index.html construido
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
        win.maximize(); // M�todo para maximizar la ventana
    }
});


// Inicializa la aplicaci�n cuando est� lista
app.whenReady().then(createWindow);