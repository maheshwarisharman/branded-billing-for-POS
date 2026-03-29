"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
exports.setTrayStatus = setTrayStatus;
exports.refreshTrayMenu = refreshTrayMenu;
exports.openSettingsWindow = openSettingsWindow;
exports.showNotification = showNotification;
exports.destroyTray = destroyTray;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const logger_1 = require("./logger");
let tray = null;
let currentState = 'error';
let statusMessage = 'Initializing…';
let settingsWindow = null;
function getTrayIcon(state) {
    const iconName = state === 'connected' ? 'icon-green.png' : 'icon-red.png';
    const iconPath = electron_1.app.isPackaged
        ? path_1.default.join(process.resourcesPath, 'assets', iconName)
        : path_1.default.join(__dirname, '..', 'assets', iconName);
    const img = electron_1.nativeImage.createFromPath(iconPath);
    // macOS menubar icons must be 16x16 (32x32 for @2x retina)
    return img.resize({ width: 16, height: 16 });
}
function buildContextMenu() {
    const config = (0, config_1.getConfig)();
    return electron_1.Menu.buildFromTemplate([
        {
            label: `Status: ${statusMessage}`,
            enabled: false,
        },
        { type: 'separator' },
        {
            label: `Watching: ${config.watchFolder || 'Not configured'}`,
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Open Settings',
            click: () => openSettingsWindow(),
        },
        {
            label: 'View Logs',
            click: () => {
                const logPath = (0, logger_1.getLogFilePath)();
                void electron_1.shell.openPath(logPath);
            },
        },
        { type: 'separator' },
        {
            label: 'Reset Settings…',
            click: async () => {
                const { response } = await electron_1.dialog.showMessageBox({
                    type: 'warning',
                    buttons: ['Reset', 'Cancel'],
                    defaultId: 1,
                    cancelId: 1,
                    title: 'Reset Settings',
                    message: 'Clear all saved settings?',
                    detail: 'This will remove your watch folder, API URL, and merchant key. The settings window will open so you can reconfigure.',
                });
                if (response === 0) {
                    (0, config_1.clearConfig)();
                    logger_1.logger.info('Settings reset by user');
                    openSettingsWindow();
                    refreshTrayMenu();
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Quit BillDrop Agent',
            click: () => {
                logger_1.logger.info('User requested quit via tray menu');
                electron_1.app.quit();
            },
        },
    ]);
}
function createTray() {
    tray = new electron_1.Tray(getTrayIcon('error'));
    tray.setToolTip('BillDrop Agent');
    tray.setContextMenu(buildContextMenu());
    // Right-click already shows the context menu.
    // On macOS, left-click should also show it.
    tray.on('click', () => {
        tray?.popUpContextMenu();
    });
    logger_1.logger.info('Tray created');
}
function setTrayStatus(state, message) {
    currentState = state;
    statusMessage = message;
    if (tray) {
        tray.setImage(getTrayIcon(state));
        tray.setToolTip(`BillDrop Agent — ${message}`);
        tray.setContextMenu(buildContextMenu());
    }
    logger_1.logger.debug('Tray status updated', { state, message });
}
function refreshTrayMenu() {
    if (tray) {
        tray.setContextMenu(buildContextMenu());
    }
}
function openSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.focus();
        return;
    }
    settingsWindow = new electron_1.BrowserWindow({
        width: 520,
        height: 580,
        resizable: false,
        title: 'BillDrop Agent — Settings',
        show: false,
        center: true,
        minimizable: false,
        maximizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
    });
    void settingsWindow.loadFile(path_1.default.join(__dirname, '..', 'src', 'settings', 'index.html'));
    settingsWindow.once('ready-to-show', () => {
        settingsWindow?.show();
    });
    settingsWindow.on('closed', () => {
        settingsWindow = null;
        // Refresh tray menu in case watch folder changed
        refreshTrayMenu();
    });
    logger_1.logger.info('Settings window opened');
}
function showNotification(title, body) {
    if (electron_1.Notification.isSupported()) {
        new electron_1.Notification({ title, body, silent: false }).show();
    }
}
function destroyTray() {
    if (tray) {
        tray.destroy();
        tray = null;
    }
}
//# sourceMappingURL=tray.js.map