"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.isFirstLaunch = isFirstLaunch;
exports.markConfigured = markConfigured;
exports.clearConfig = clearConfig;
exports.getStorePath = getStorePath;
const electron_store_1 = __importDefault(require("electron-store"));
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
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new electron_store_1.default({ schema: schema });
function getConfig() {
    return {
        watchFolder: store.get('watchFolder', ''),
        backendUrl: store.get('backendUrl', 'https://api.yourdomain.com/bills/ingest'),
        merchantKey: store.get('merchantKey', ''),
        isConfigured: store.get('isConfigured', false),
    };
}
function setConfig(updates) {
    const keys = Object.keys(updates);
    for (const key of keys) {
        const val = updates[key];
        if (val !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            store.set(key, val);
        }
    }
}
function isFirstLaunch() {
    return !store.get('isConfigured', false);
}
function markConfigured() {
    store.set('isConfigured', true);
}
function clearConfig() {
    store.clear();
}
function getStorePath() {
    return store.path;
}
//# sourceMappingURL=config.js.map