export interface AppConfig {
    watchFolder: string;
    backendUrl: string;
    merchantKey: string;
    isConfigured: boolean;
}
export declare function getConfig(): AppConfig;
export declare function setConfig(updates: Partial<AppConfig>): void;
export declare function isFirstLaunch(): boolean;
export declare function markConfigured(): void;
//# sourceMappingURL=config.d.ts.map