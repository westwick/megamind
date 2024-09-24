/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { createApp } from "vue";

import App from "./App.vue";
import "./index.css";
import "./assets/css/fonts.css";

import LoginAutomator from "./routines/loginAutomator";
import MudAutomator from "./routines/mudAutomator";
import GameState from "./gameState";
import playerStats from "./playerStats";

import EventEmitter from "./utils/EventEmitter";
const eventBus = new EventEmitter();

const app = createApp(App);
app.config.globalProperties.$eventBus = eventBus;
app.mount("#app");

let config;
let currentRoutine = null;
let debuggerElementRef = null;
let gameState;
let playerStatsInstance;

eventBus.on("font-changed", (newFont) => {
  console.log(`[renderer] Font changed to ${newFont}`);
  updateTerminalFont(newFont);
});

eventBus.on("font-size-changed", (newSize) => {
  console.log(`[renderer] Font size changed to ${newSize}px`);
  updateTerminalFontSize(newSize);
});

const updateTerminalFont = (newFont) => {
  // Inject a new style element with high specificity
  const styleId = "custom-xterm-style";
  let styleElement = document.getElementById(styleId);

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = `
      .xterm-dom-renderer-owner-1 .xterm-rows {
        font-family: "${newFont}" !important;
      }
    `;

  console.log(`Injected CSS for font: ${newFont}`);
};

const updateTerminalFontSize = (newSize) => {
  const styleId = "custom-xterm-style";
  let styleElement = document.getElementById(styleId);

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  styleElement.textContent += `
    .xterm-dom-renderer-owner-1 .xterm-rows {
      font-size: ${newSize}px !important;
    }
  `;

  console.log(`Injected CSS for font size: ${newSize}px`);
};

function initTerminal() {
  // Create a new xterm.js terminal
  const term = new Terminal({
    cols: 80,
    rows: 24,
    convertEol: true,
    cursorBlink: true,
    fontSize: 16, // Set default font size
    theme: {
      background: "#000000",
      foreground: "#ffffff",
    },
    scrollback: 1000,
  });

  // Create and load addons
  const fitAddon = new FitAddon();
  const webLinksAddon = new WebLinksAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(webLinksAddon);

  // Initialize the terminal in the 'terminal' div
  const terminalElement = document.getElementById("terminal");
  const debuggerElement = document.getElementById("debugger");

  term.open(terminalElement);
  term.write("\x1b[44m\x1b[37m\r\n*** Megamind Initialized ***\r\n\x1b[0m");
  fitAddon.fit();

  window.electronAPI.onServerConnected(() => {
    term.write("\x1b[44m\x1b[37m*** Connected to Server ***\r\n\x1b[0m");
  });

  window.electronAPI.onServerData((event) => {
    console.log(event);
    term.write(event.dataTransformed);

    if (currentRoutine) {
      currentRoutine.parse(event.dataString);
      if (currentRoutine instanceof MudAutomator) {
        // window.electronAPI.updateRoom(gameState.currentRoom);
      }
    }
  });

  window.electronAPI.onServerClosed(() => {
    term.write("\x1b[44m\x1b[37m\r\n*** Connection Closed ***\r\n\x1b[0m");
  });

  window.electronAPI.onServerError((err) => {
    term.write(`\x1b[44m\x1b[37m\r\n*** Error: ${err} ***\r\n\x1b[0m`);
  });

  // Handle user input
  term.onData((data) => {
    window.electronAPI.sendData(data);
  });

  debuggerElementRef = debuggerElement;
  return term;
}

function updateDebugger(info) {
  if (!debuggerElementRef) {
    console.error("Debugger element reference not set");
    return;
  }

  const debugInfo = {
    // mudAutomator: info,
    room: gameState.currentRoom,
    onlineUsers: gameState.onlineUsers,
    playerStats: playerStatsInstance.getStats(),
  };

  debuggerElementRef.innerHTML = `<pre>${JSON.stringify(
    debugInfo,
    null,
    2
  )}</pre>`;
}

async function startLoginRoutine() {
  config = await window.electronAPI.loadConfig();
  const term = initTerminal();
  window.electronAPI.connectToServer({
    host: config.server,
    port: config.port,
  });
  currentRoutine = new LoginAutomator(
    {
      write: (data) => window.electronAPI.sendData(data),
    },
    onLoginComplete,
    config.username,
    config.password
  );
}

function onLoginComplete() {
  console.log("Login automation complete");

  initializeGame();

  currentRoutine = new MudAutomator(
    {
      write: (data) => window.electronAPI.sendData(data),
    },
    updateDebugger,
    gameState,
    playerStatsInstance,
    eventBus
  );
}

function initializeGame() {
  gameState = new GameState(eventBus);
  playerStatsInstance = playerStats;
  playerStatsInstance.startSession();
}

startLoginRoutine();
