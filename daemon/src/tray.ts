import { Tray, Menu, app, shell, BrowserWindow, Notification } from 'electron';
import path from 'path';
import { getConfig } from './config';
import { getLogFilePath } from './logger';
import { logger } from './logger';

export type TrayState = 'connected' | 'error';

let tray: Tray | null = null;
let currentState: TrayState = 'error';
let statusMessage: string = 'Initializing…';
let settingsWindow: BrowserWindow | null = null;

function getIconPath(state: TrayState): string {
  const iconName = state === 'connected' ? 'icon-green.png' : 'icon-red.png';
  // In development, icons are in ../assets relative to dist/
  // In production, they're in process.resourcesPath/assets/
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', iconName);
  }
  return path.join(__dirname, '..', 'assets', iconName);
}

function buildContextMenu(): Menu {
  const config = getConfig();

  return Menu.buildFromTemplate([
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
        const logPath = getLogFilePath();
        void shell.openPath(logPath);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit BillDrop Agent',
      click: () => {
        logger.info('User requested quit via tray menu');
        app.quit();
      },
    },
  ]);
}

export function createTray(): void {
  tray = new Tray(getIconPath('error'));
  tray.setToolTip('BillDrop Agent');
  tray.setContextMenu(buildContextMenu());

  // Right-click already shows the context menu.
  // On macOS, left-click should also show it.
  tray.on('click', () => {
    tray?.popUpContextMenu();
  });

  logger.info('Tray created');
}

export function setTrayStatus(state: TrayState, message: string): void {
  currentState = state;
  statusMessage = message;

  if (tray) {
    tray.setImage(getIconPath(state));
    tray.setToolTip(`BillDrop Agent — ${message}`);
    tray.setContextMenu(buildContextMenu());
  }

  logger.debug('Tray status updated', { state, message });
}

export function refreshTrayMenu(): void {
  if (tray) {
    tray.setContextMenu(buildContextMenu());
  }
}

export function openSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
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
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  void settingsWindow.loadFile(
    path.join(__dirname, '..', 'src', 'settings', 'index.html')
  );

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    // Refresh tray menu in case watch folder changed
    refreshTrayMenu();
  });

  logger.info('Settings window opened');
}

export function showNotification(title: string, body: string): void {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: false }).show();
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
