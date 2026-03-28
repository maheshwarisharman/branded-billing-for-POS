"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const logger_1 = require("./logger");
const db_1 = require("./db");
const config_1 = require("./config");
const tray_1 = require("./tray");
const watcher_1 = require("./watcher");
// ─── Prevent multiple instances ──────────────────────────────────────────────
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
    process.exit(0);
}
// ─── Hide from dock on macOS ──────────────────────────────────────────────────
if (process.platform === 'darwin') {
    electron_1.app.dock?.hide();
}
// ─── Keep the app running even when all windows are closed ───────────────────
electron_1.app.on('window-all-closed', (e) => {
    e.preventDefault();
});
// ─── App ready ───────────────────────────────────────────────────────────────
electron_1.app.on('ready', async () => {
    logger_1.logger.info('BillDrop Agent starting', { version: electron_1.app.getVersion() });
    // Auto-start on login (first launch only)
    if (!electron_1.app.getLoginItemSettings().openAtLogin) {
        electron_1.app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden: true,
        });
        logger_1.logger.info('Login item registered for auto-start');
    }
    // Init SQLite
    (0, db_1.initDb)();
    // Create system tray
    (0, tray_1.createTray)();
    const config = (0, config_1.getConfig)();
    // First launch: open settings automatically
    if ((0, config_1.isFirstLaunch)()) {
        logger_1.logger.info('First launch detected — opening settings window');
        (0, tray_1.openSettingsWindow)();
        (0, tray_1.setTrayStatus)('error', 'Not configured — please set your watch folder');
        return;
    }
    // Check if watch folder exists
    if (!config.watchFolder || !fs_1.default.existsSync(config.watchFolder)) {
        logger_1.logger.warn('Watch folder missing or invalid', { folder: config.watchFolder });
        (0, tray_1.setTrayStatus)('error', 'Watch folder not found — open Settings to configure');
        (0, tray_1.openSettingsWindow)();
        return;
    }
    // Start the watcher
    (0, watcher_1.startWatcher)(config.watchFolder);
});
// ─── Graceful shutdown ────────────────────────────────────────────────────────
electron_1.app.on('before-quit', () => {
    logger_1.logger.info('BillDrop Agent shutting down');
    (0, watcher_1.stopWatcher)();
    (0, db_1.closeDb)();
    (0, tray_1.destroyTray)();
});
// ─── IPC: Get current config ──────────────────────────────────────────────────
electron_1.ipcMain.handle('config:get', () => {
    const config = (0, config_1.getConfig)();
    return {
        watchFolder: config.watchFolder,
        backendUrl: config.backendUrl,
        merchantKey: config.merchantKey,
    };
});
// ─── IPC: Save config ─────────────────────────────────────────────────────────
electron_1.ipcMain.handle('config:save', (_event, updates) => {
    logger_1.logger.info('Config updated via settings window', {
        watchFolder: updates.watchFolder,
        backendUrl: updates.backendUrl,
        hasMerchantKey: Boolean(updates.merchantKey),
    });
    (0, config_1.setConfig)(updates);
    (0, config_1.markConfigured)();
    // Restart watcher with new folder
    (0, watcher_1.stopWatcher)();
    const newConfig = (0, config_1.getConfig)();
    if (newConfig.watchFolder && fs_1.default.existsSync(newConfig.watchFolder)) {
        (0, watcher_1.startWatcher)(newConfig.watchFolder);
    }
    else {
        (0, tray_1.setTrayStatus)('error', 'Watch folder not found — reconfigure in Settings');
    }
});
// ─── IPC: Open folder picker dialog ──────────────────────────────────────────
electron_1.ipcMain.handle('dialog:selectFolder', async () => {
    const result = await electron_1.dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Watch Folder',
        buttonLabel: 'Select Folder',
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
});
// ─── IPC: Test backend connection ─────────────────────────────────────────────
electron_1.ipcMain.handle('connection:test', async (_event, backendUrl) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
        const healthUrl = `${backendUrl.replace(/\/$/, '')}/health`;
        const response = await (0, node_fetch_1.default)(healthUrl, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.ok) {
            return { ok: true };
        }
        return { ok: false, error: `Server returned ${response.status}` };
    }
    catch (err) {
        clearTimeout(timer);
        return { ok: false, error: err.message };
    }
});
// ─── Second instance: focus existing app hint ────────────────────────────────
electron_1.app.on('second-instance', () => {
    logger_1.logger.info('Second instance detected — already running');
    (0, tray_1.openSettingsWindow)();
});
logger_1.logger.info('Main process module loaded', { pid: process.pid, platform: process.platform });
//# sourceMappingURL=main.js.map