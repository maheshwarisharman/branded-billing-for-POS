import { Tray, Menu, app, shell, BrowserWindow, Notification, dialog, nativeImage } from 'electron';
import path from 'path';
import { getConfig, clearConfig } from './config';
import { getLogFilePath, logger } from './logger';

export type TrayState = 'connected' | 'error';

let tray: Tray | null = null;
let currentState: TrayState = 'error';
let statusMessage: string = 'Initializing…';
let settingsWindow: BrowserWindow | null = null;

function getTrayIcon(state: TrayState): Electron.NativeImage {
  const iconName = state === 'connected' ? 'icon-green.png' : 'icon-red.png';
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', iconName)
    : path.join(__dirname, '..', 'assets', iconName);

  const img = nativeImage.createFromPath(iconPath);
  // macOS menubar icons must be 16x16 (32x32 for @2x retina)
  return img.resize({ width: 16, height: 16 });
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
      label: 'Reset Settings…',
      click: async () => {
        const { response } = await dialog.showMessageBox({
          type: 'warning',
          buttons: ['Reset', 'Cancel'],
          defaultId: 1,
          cancelId: 1,
          title: 'Reset Settings',
          message: 'Clear all saved settings?',
          detail:
            'This will remove your watch folder, API URL, and merchant key. The settings window will open so you can reconfigure.',
        });
        if (response === 0) {
          clearConfig();
          logger.info('Settings reset by user');
          openSettingsWindow();
          refreshTrayMenu();
        }
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
  tray = new Tray(getTrayIcon('error'));
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
    tray.setImage(getTrayIcon(state));
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
