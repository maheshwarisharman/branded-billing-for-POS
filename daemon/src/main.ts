import { app, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { logger } from './logger';
import { initDb, closeDb } from './db';
import { getConfig, setConfig, isFirstLaunch, markConfigured, AppConfig } from './config';
import { createTray, setTrayStatus, openSettingsWindow, destroyTray } from './tray';
import { startWatcher, stopWatcher } from './watcher';

// ─── Prevent multiple instances ──────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// ─── Hide from dock on macOS ──────────────────────────────────────────────────
if (process.platform === 'darwin') {
  app.dock?.hide();
}

// ─── Keep the app running even when all windows are closed ───────────────────
app.on('window-all-closed', (e: Electron.Event) => {
  e.preventDefault();
});

// ─── App ready ───────────────────────────────────────────────────────────────
app.on('ready', async () => {
  logger.info('BillDrop Agent starting', { version: app.getVersion() });

  // Auto-start on login (first launch only)
  if (!app.getLoginItemSettings().openAtLogin) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
    });
    logger.info('Login item registered for auto-start');
  }

  // Init SQLite
  initDb();

  // Create system tray
  createTray();

  const config = getConfig();

  // First launch: open settings automatically
  if (isFirstLaunch()) {
    logger.info('First launch detected — opening settings window');
    openSettingsWindow();
    setTrayStatus('error', 'Not configured — please set your watch folder');
    return;
  }

  // Check if watch folder exists
  if (!config.watchFolder || !fs.existsSync(config.watchFolder)) {
    logger.warn('Watch folder missing or invalid', { folder: config.watchFolder });
    setTrayStatus('error', 'Watch folder not found — open Settings to configure');
    openSettingsWindow();
    return;
  }

  // Start the watcher
  startWatcher(config.watchFolder);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
app.on('before-quit', () => {
  logger.info('BillDrop Agent shutting down');
  stopWatcher();
  closeDb();
  destroyTray();
});

// ─── IPC: Get current config ──────────────────────────────────────────────────
ipcMain.handle('config:get', () => {
  const config = getConfig();
  return {
    watchFolder: config.watchFolder,
    backendUrl: config.backendUrl,
    merchantKey: config.merchantKey,
  };
});

// ─── IPC: Save config ─────────────────────────────────────────────────────────
ipcMain.handle('config:save', (_event: IpcMainInvokeEvent, updates: Partial<AppConfig>) => {
  logger.info('Config updated via settings window', {
    watchFolder: updates.watchFolder,
    backendUrl: updates.backendUrl,
    hasMerchantKey: Boolean(updates.merchantKey),
  });

  setConfig(updates);
  markConfigured();

  // Restart watcher with new folder
  stopWatcher();

  const newConfig = getConfig();
  if (newConfig.watchFolder && fs.existsSync(newConfig.watchFolder)) {
    startWatcher(newConfig.watchFolder);
  } else {
    setTrayStatus('error', 'Watch folder not found — reconfigure in Settings');
  }
});

// ─── IPC: Open folder picker dialog ──────────────────────────────────────────
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({
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
ipcMain.handle('connection:test', async (_event: IpcMainInvokeEvent, backendUrl: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const healthUrl = `${backendUrl.replace(/\/$/, '')}/health`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      return { ok: true };
    }
    return { ok: false, error: `Server returned ${response.status}` };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: (err as Error).message };
  }
});

// ─── Second instance: focus existing app hint ────────────────────────────────
app.on('second-instance', () => {
  logger.info('Second instance detected — already running');
  openSettingsWindow();
});

logger.info('Main process module loaded', { pid: process.pid, platform: process.platform });
