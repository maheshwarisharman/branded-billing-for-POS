export interface ElectronBridge {
    getConfig: () => Promise<{
        watchFolder: string;
        backendUrl: string;
        merchantKey: string;
    }>;
    saveConfig: (config: {
        watchFolder: string;
        backendUrl: string;
        merchantKey: string;
    }) => Promise<void>;
    selectFolder: () => Promise<string | null>;
    testConnection: (url: string) => Promise<{
        ok: boolean;
        error?: string;
    }>;
    resetConfig: () => Promise<boolean>;
}
//# sourceMappingURL=preload.d.ts.map