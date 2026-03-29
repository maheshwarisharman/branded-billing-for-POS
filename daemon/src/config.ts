import Store from 'electron-store';

export interface AppConfig {
  watchFolder: string;
  backendUrl: string;
  merchantKey: string;
  isConfigured: boolean;
}

const schema = {
  watchFolder: {
    type: 'string',
    default: '',
  },
  backendUrl: {
    type: 'string',
    default: 'https://api.yourdomain.com/bills/ingest',
  },
  merchantKey: {
    type: 'string',
    default: '',
  },
  isConfigured: {
    type: 'boolean',
    default: false,
  },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Store<AppConfig>({ schema: schema as any });

export function getConfig(): AppConfig {
  return {
    watchFolder: store.get('watchFolder', ''),
    backendUrl: store.get('backendUrl', 'https://api.yourdomain.com/bills/ingest'),
    merchantKey: store.get('merchantKey', ''),
    isConfigured: store.get('isConfigured', false),
  };
}

export function setConfig(updates: Partial<AppConfig>): void {
  const keys = Object.keys(updates) as Array<keyof AppConfig>;
  for (const key of keys) {
    const val = updates[key];
    if (val !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.set(key, val as any);
    }
  }
}

export function isFirstLaunch(): boolean {
  return !store.get('isConfigured', false);
}

export function markConfigured(): void {
  store.set('isConfigured', true);
}

export function clearConfig(): void {
  store.clear();
}

export function getStorePath(): string {
  return store.path;
}
