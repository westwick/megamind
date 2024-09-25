const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("node:path");
const net = require("net");
const iconv = require("iconv-lite");
import { MudAutomator } from "./routines/mudAutomator.js";
import { LoginAutomator } from "./routines/loginAutomator.js";
import { GameState } from "./state/gameState.js";
import { PlayerStats } from "./state/playerStats.js";
import { EventEmitter } from "events";
import { MainStateManager } from "./state/MainStateManager.js";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}
import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

let mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1200,
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
let config = null;
function loadConfig() {
  try {
    if (!config) {
      const configPath = path.join(app.getAppPath(), "config.json");
      const configData = fs.readFileSync(configPath, "utf8");
      config = JSON.parse(configData);
    }
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
  }
}

ipcMain.handle("load-config", () => {
  return loadConfig();
});

let socket;
let currentRoutine = null;
let gameState;
let playerStatsInstance;
let eventBus = new EventEmitter();
let mainStateManager;

ipcMain.on("connect-to-server", (event) => {
  initializeGame();

  socket = net.createConnection(config.port, config.server, () => {
    event.reply("server-connected");
  });

  socket.on("data", (data) => {
    const transformedData = iconv.decode(data, "cp437");
    const dataEvent = {
      dataRaw: data,
      dataTransformed: transformedData,
    };
    event.reply("server-data", dataEvent);

    if (currentRoutine) {
      currentRoutine.parse(dataEvent);
      if (currentRoutine instanceof MudAutomator) {
        // window.electronAPI.updateRoom(gameState.currentRoom);
      }
    } else {
      currentRoutine = new LoginAutomator(
        gameState,
        socket,
        onLoginComplete,
        config.username,
        config.password
      );
    }
  });

  socket.on("close", () => {
    event.reply("server-closed");
  });

  socket.on("error", (err) => {
    console.error("Socket error: ", err);
    event.reply("server-error", err.message);
  });
});

ipcMain.on("send-data", (event, data) => {
  if (socket) {
    socket.write(data);
  }
});

function initializeGame() {
  currentRoutine = null;
  config = loadConfig();
  mainStateManager = new MainStateManager();
  gameState = new GameState(eventBus, mainStateManager);
  playerStatsInstance = new PlayerStats(eventBus, mainStateManager);
  playerStatsInstance.startSession();

  // Set up listeners for state changes
  mainStateManager.on("stateChanged", ({ key, value }) => {
    forwardEventToRenderer(key, value);
  });
}

function onLoginComplete() {
  console.log("Login automation complete");

  currentRoutine = new MudAutomator(socket, mainStateManager, eventBus);
}

function forwardEventToRenderer(key, value) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("state-update", { key, value });
  }
}
