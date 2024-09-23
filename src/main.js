const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("node:path");
const net = require("net");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

function loadConfig() {
  try {
    const configPath = path.join(app.getAppPath(), "config.json");
    console.log("Config path:", configPath);
    const configData = fs.readFileSync(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    console.error("Error loading config:", error);
  }
}

ipcMain.handle("load-config", () => {
  return loadConfig();
});

let socket;

ipcMain.on("connect-to-server", (event, { host, port }) => {
  socket = net.createConnection(port, host, () => {
    event.reply("server-connected");
  });

  socket.on("data", (data) => {
    event.reply("server-data", data.toString());
  });

  socket.on("close", () => {
    event.reply("server-closed");
  });

  socket.on("error", (err) => {
    event.reply("server-error", err.message);
  });
});

ipcMain.on("send-data", (event, data) => {
  if (socket) {
    socket.write(data);
  }
});
