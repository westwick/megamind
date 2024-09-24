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
// import { WebglAddon } from "@xterm/addon-webgl";
import { createApp } from "vue";

import App from "./App.vue";
import "./index.css";
import "./assets/css/fonts.css";

const app = createApp(App);

app.config.globalProperties.$eventBus = window.electronAPI;
app.mount("#app");

let config;
let debuggerElementRef = null;

function initTerminal() {
  // Create a new xterm.js terminal
  const term = new Terminal({
    cols: 80,
    rows: 40,
    convertEol: true,
    cursorBlink: true,
    fontFamily: "perfect_dos_vga_437regular",
    fontSize: 16,
    letterSpacing: -1,
    theme: {
      background: "#000000",
      foreground: "#ffffff",
      black: "#000000",
      brightGreen: "#00ff00",
      brightYellow: "#ffff00",
      magenta: "#800080",
      brightMagenta: "#ff00ff",
    },
    scrollback: 1000,
  });

  // Create and load addons
  // *disabled for now, re-visit later*
  const fitAddon = new FitAddon();
  // const webLinksAddon = new WebLinksAddon();
  // const webGlAddon = new WebglAddon();
  term.loadAddon(fitAddon);
  // term.loadAddon(webLinksAddon);
  // term.loadAddon(webGlAddon);

  // Initialize the terminal in the 'terminal' div
  const terminalElement = document.getElementById("terminal");
  const debuggerElement = document.getElementById("debugger");

  term.open(terminalElement);
  term.write("\x1b[44m\x1b[37m\r\n*** Megamind Initialized ***\r\n\x1b[0m");
  // fitAddon.fit();

  window.electronAPI.onServerConnected(() => {
    term.write("\x1b[44m\x1b[37m*** Connected to Server ***\r\n\x1b[0m");
  });

  window.electronAPI.onServerData((event) => {
    console.log(event);
    term.write(event.dataTransformed);
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
    /* TODO: need to wire up gameState thru eventsAPI
    room: gameState.currentRoom,
    onlineUsers: gameState.onlineUsers,
    playerStats: playerStatsInstance.getStats(),
    */
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
}

startLoginRoutine();
