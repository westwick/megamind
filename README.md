## Megamind for MajorMUD

Megamind is an electron-based app to replace Megamud (for scripting MajorMUD) with the following goals:
* Recreate all Megamud functionality (get to feature parity)
* Integrate MME (MajorMUD Explorer) data directly in the client
* Improve/fix all the annoying things about Megamud
* Add new features and functionality previously unavailable, specifically:
  * Enhanced pathfinding (remove/reduce the need for paths)
  * Real-time combat analysis and decision making
  * Improved healing and resource management (blesses)
  * Modern UI with improved conversation tracking

## Getting Started

### Prerequisites
* Node.js (Latest LTS recommended)
* npm (or yarn)

### Installation

1. Clone repo
2. `npm install` to install dependencies
3. copy `config.json.example` to `config.json` and update with your settings
4. `npm run start` to run the project

## Architecture Overview

### Electron Structure
The application follows Electron's process separation model:
* Main Process (`src/main.js`): Handles core application logic, telnet connections, and system interactions
* Renderer Process (`src/renderer.js`): Manages the UI and user interactions
* Preload Scripts (`src/preload.js`): Provides secure bridge between processes

### main.js ("backend") overview

need more details about how telnet data is processed into lines and handled thru eventemitters by the `src/handlers`, etc

### renderer.js ("frontend") overview

need more details about how vue is hooked up plus any xterm.js particulars

### data management

need more details about how data is integrated and how to build new datasets from MME or similar
