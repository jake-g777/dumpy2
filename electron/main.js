import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173'); // Default Vite dev server port
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 