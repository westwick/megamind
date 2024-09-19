const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // For Electron versions < 12
      contextIsolation: false, // For Electron versions >= 12
    },
  });

  win.loadFile('index.html');

  // Optional: Open DevTools
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);