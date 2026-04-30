import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import setUpHandlers from '../db/ipcHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

console.log('process.execPath:', process.execPath);
console.log('process.argv:', process.argv);

if (process.defaultApp) {
  const appPath = path.resolve(process.argv[1]);
  console.log('Registering protocol in dev with appPath:', appPath);
  app.setAsDefaultProtocolClient('doneapp', process.execPath, [appPath]);
} else {
  app.setAsDefaultProtocolClient('doneapp');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 1024,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('src/index.html');;
}

function handleAuthCallback(url) {
  if (!mainWindow) return;
  mainWindow.webContents.send('auth:callback', url);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    console.log('second-instance commandLine:', commandLine);

    const url = commandLine.find(arg => arg.startsWith('doneapp://'));
    if (url) handleAuthCallback(url);
  });

  app.whenReady().then(() => {
    setUpHandlers();
    createWindow();

    const url = process.argv.find(arg => arg.startsWith('doneapp://'));
    if (url) {
      mainWindow.webContents.once('did-finish-load', () => {
        handleAuthCallback(url);
      });
    }
  });
}

app.on('window-all-closed', () => {
  app.quit();
});