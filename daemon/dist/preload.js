"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    getConfig: () => electron_1.ipcRenderer.invoke('config:get'),
    saveConfig: (config) => electron_1.ipcRenderer.invoke('config:save', config),
    selectFolder: () => electron_1.ipcRenderer.invoke('dialog:selectFolder'),
    testConnection: (...args) => electron_1.ipcRenderer.invoke('connection:test', args[0]),
});
//# sourceMappingURL=preload.js.map