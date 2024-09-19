const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;
let mapWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.webContents.openDevTools();
}

function createMapWindow() {
  mapWindow = new BrowserWindow({
    width: 400,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mapWindow.loadFile(path.join(__dirname, "map.html"));
  mapWindow.webContents.openDevTools();

  mapWindow.on("closed", () => {
    mapWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  createMapWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    createMapWindow();
  }
});

// Listen for the test update
ipcMain.on("test-update-room", (event, room) => {
  console.log("Main process received test-update-room:", room);
  if (mapWindow) {
    mapWindow.webContents.send("update-room", room);
  }
});

// Listen for the update-room event
ipcMain.on("update-room", (event, room) => {
  console.log("Main process received update-room:", room);
  if (mapWindow) {
    mapWindow.webContents.send("update-room", room);
  }
});
