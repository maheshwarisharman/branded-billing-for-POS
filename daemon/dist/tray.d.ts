export type TrayState = 'connected' | 'error';
export declare function createTray(): void;
export declare function setTrayStatus(state: TrayState, message: string): void;
export declare function refreshTrayMenu(): void;
export declare function openSettingsWindow(): void;
export declare function showNotification(title: string, body: string): void;
export declare function destroyTray(): void;
//# sourceMappingURL=tray.d.ts.map