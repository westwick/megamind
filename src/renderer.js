const fs = require("fs");
const net = require("net");
const path = require("path");
const TelnetSocket = require("telnet-stream").TelnetSocket;
const { Terminal } = require("xterm");
const { FitAddon } = require("xterm-addon-fit");
const { WebLinksAddon } = require("xterm-addon-web-links");

const gameState = require("./gameState");
const LoginAutomator = require("./routines/loginAutomator");
const MudAutomator = require("./routines/mudAutomator");

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

// Create a new xterm.js terminal
const term = new Terminal({
  cols: 80,
  rows: 24,
  convertEol: true,
  cursorBlink: true,
  fontSize: 14,
  fontFamily: "monospace",
  theme: {
    background: "#0A0A0F",
    foreground: "#ffffff",
  },
  scrollback: 1000, // Add scrollback buffer
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

function connectToServer(host, port) {
  const socket = net.createConnection(port, host, () => {
    term.write("\x1b[44m\x1b[37m*** Connected to Server ***\r\n\x1b[0m");
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

  return telnetSocket;
}

let currentRoutine = null;

function updateDebugger(info) {
  const debugInfo = {
    mudAutomator: info,
    gameState: {
      isLoggedIn: gameState.isLoggedIn,
      hasEnteredGame: gameState.hasEnteredGame,
      currentRoom: gameState.currentRoom,
    },
  };
  debuggerElement.innerHTML = `<pre>${JSON.stringify(
    debugInfo,
    null,
    2
  )}</pre>`;
}

function startLoginRoutine() {
  const config = loadConfig();
  const telnetSocket = connectToServer(config.server, config.port);
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

  // Handle user input
  term.onData((data) => {
    console.log("User input:", data);
    telnetSocket.write(Buffer.from(data, "utf8"));
  });
}

startLoginRoutine();

// Adjust terminal size on window resize
window.addEventListener("resize", () => {
  fitAddon.fit();
});
