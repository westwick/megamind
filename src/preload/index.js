// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  loadConfig: () => ipcRenderer.invoke('load-config'),

  // ui indications
  clientLoaded: () => ipcRenderer.send('client-loaded'),
  onDisableConnect: (callback) => ipcRenderer.on('disable-connect', callback),
  onEnableConnect: (callback) => ipcRenderer.on('enable-connect', callback),

  // profile management
  getPlayerProfiles: () => ipcRenderer.invoke('get-player-profiles'),
  onSetSelectedProfile: (callback) => ipcRenderer.on('set-selected-profile', callback),
  createNewProfile: () => ipcRenderer.invoke('create-new-profile'),
  saveProfile: (config, save) => ipcRenderer.send('save-profile', config, save),
  loadProfile: (profile) => ipcRenderer.send('load-profile', profile),

  // server and stuff
  connectToServer: (data) => ipcRenderer.send('connect-to-server', data),
  disconnectFromServer: () => ipcRenderer.send('disconnect-from-server'),
  onServerConnected: (callback) => ipcRenderer.on('server-connected', callback),
  onServerData: (callback) => ipcRenderer.on('server-data', (event, data) => callback(data)),
  onServerClosed: (callback) => ipcRenderer.on('server-closed', callback),
  onServerError: (callback) => ipcRenderer.on('server-error', (event, error) => callback(error)),
  sendData: (data) => ipcRenderer.send('send-data', data),
  onTerminalWrite: (callback) => ipcRenderer.on('terminal-write', callback),

  // game state and stuff
  onNewRoom: (callback) => ipcRenderer.on('new-room', callback),
  onConversation: (callback) => ipcRenderer.on('conversation', callback),
  onPlayerStats: (callback) => ipcRenderer.on('update-player-stats', callback),
  onUpdateOnlineUsers: (callback) => ipcRenderer.on('update-online-users', callback),
  onGameStateUpdated: (callback) => ipcRenderer.on('game-state-updated', callback),

  // player config
  getPlayerConfig: () => ipcRenderer.invoke('get-player-config'),
  updatePlayerConfig: (section, sectionData) => ipcRenderer.send('update-player-config', section, sectionData),
});
