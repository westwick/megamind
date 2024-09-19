const fs = require("fs");
const net = require("net");
const path = require("path");
const TelnetSocket = require("telnet-stream").TelnetSocket;
const { Terminal } = require("xterm");
const { FitAddon } = require("xterm-addon-fit");
const { WebLinksAddon } = require("xterm-addon-web-links");

const gameState = require("./gameState");
const playerStats = require("./playerStats");
const LoginAutomator = require("./routines/loginAutomator");
const MudAutomator = require("./routines/mudAutomator");

// TODO: eliminate global state usage
let currentRoutine = null;
let debuggerElementRef = null;
let fitAddon = null;

function loadConfig() {
  const configPath = path.join(__dirname, "config.json");
  try {
    const configData = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(configData);
    console.log("Loaded config:", config);
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
  }
}

function initTerminal() {
  // Create a new xterm.js terminal
  const term = new Terminal({
    cols: 80,
    rows: 24,
    convertEol: true,
    cursorBlink: true,
    fontSize: 14,
    fontFamily: "monospace",
    theme: {
      background: "#000000",
      foreground: "#ffffff",
    },
    scrollback: 1000, // Add scrollback buffer
  });

  // Create and load addons
  fitAddon = new FitAddon();
  const webLinksAddon = new WebLinksAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(webLinksAddon);

  // Initialize the terminal in the 'terminal' div
  const terminalElement = document.getElementById("terminal");
  const debuggerElement = document.getElementById("debugger");
  term.open(terminalElement);
  term.write("\x1b[44m\x1b[37m\r\n*** Megamind Initialized ***\r\n\x1b[0m");
  fitAddon.fit();

  debuggerElementRef = debuggerElement;
  return term;
}

function connectToServer(term, host, port) {
  const socket = net.createConnection(port, host, () => {
    term.write(
      "\x1b[44m\x1b[37m*** Connected to Server " +
        host +
        ":" +
        port +
        " ***\r\n\x1b[0m"
    );
  });

  // Wrap the socket with TelnetSocket to handle Telnet negotiations
  const telnetSocket = new TelnetSocket(socket);

  // Define Telnet option codes
  const TELNET_BINARY = 0;

  telnetSocket.on("do", (option) => {
    if (option === TELNET_BINARY) {
      telnetSocket.write(Buffer.from([255, 251, TELNET_BINARY])); // IAC WILL BINARY
    }
  });

  telnetSocket.on("will", (option) => {
    if (option === TELNET_BINARY) {
      telnetSocket.write(Buffer.from([255, 253, TELNET_BINARY])); // IAC DO BINARY
    }
  });

  // Add these event listeners here
  telnetSocket.on("data", (data) => {
    term.write(data);
    if (currentRoutine) {
      currentRoutine.parse(data);
      if (currentRoutine instanceof MudAutomator) {
        const { ipcRenderer } = require("electron");
        ipcRenderer.send("room-update", gameState.currentRoom);
      }
    }
  });

  telnetSocket.on("close", () => {
    term.write("\x1b[44m\x1b[37m\r\n*** Connection Closed ***\r\n\x1b[0m");
  });

  telnetSocket.on("error", (err) => {
    term.write(`\x1b[44m\x1b[37m\r\n*** Error: ${err.message} ***\r\n\x1b[0m`);
  });

  // Handle user input
  term.onData((data) => {
    console.log("User input:", data);
    telnetSocket.write(Buffer.from(data, "utf8"));
  });

  return telnetSocket;
}

function updateDebugger(info) {
  if (!debuggerElementRef) {
    console.error("Debugger element reference not set");
    return;
  }

  const debugInfo = {
    mudAutomator: info,
    playerStats: playerStats.getStats(),
    gameState,
  };

  debuggerElementRef.innerHTML = `<pre>${JSON.stringify(
    debugInfo,
    null,
    2
  )}</pre>`;
}

function startLoginRoutine() {
  const config = loadConfig();
  const term = initTerminal();
  const telnetSocket = connectToServer(term, config.server, config.port);
  currentRoutine = new LoginAutomator(
    telnetSocket,
    onLoginComplete,
    config.username,
    config.password
  );
}

function onLoginComplete(telnetSocket) {
  console.log("Login automation complete");

  currentRoutine = new MudAutomator(telnetSocket, updateDebugger);
}

startLoginRoutine();

// Adjust terminal size on window resize
window.addEventListener("resize", () => {
  fitAddon.fit();
});
