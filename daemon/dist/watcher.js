"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWatcher = startWatcher;
exports.stopWatcher = stopWatcher;
exports.isWatcherRunning = isWatcherRunning;
const chokidar_1 = __importDefault(require("chokidar"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./logger");
const parser_1 = require("./parser");
const uploader_1 = require("./uploader");
const db_1 = require("./db");
const config_1 = require("./config");
const tray_1 = require("./tray");
let watcher = null;
const PDF_SETTLE_DELAY_MS = 500;
async function handleNewPdf(filePath) {
    const filename = path_1.default.basename(filePath);
    // Guard: only process .pdf files
    if (!filename.toLowerCase().endsWith('.pdf')) {
        return;
    }
    logger_1.logger.info('New PDF detected', { filePath });
    // Idempotency check
    // if (isAlreadyUploaded(filename)) {
    //   logger.info('Skipping duplicate — already uploaded successfully', { filename });
    //   return;
    // }
    // Wait for the file to finish being written
    await new Promise((resolve) => setTimeout(resolve, PDF_SETTLE_DELAY_MS));
    // Verify file still exists and is readable after settle delay
    try {
        fs_1.default.accessSync(filePath, fs_1.default.constants.R_OK);
    }
    catch {
        logger_1.logger.warn('File not accessible after settle delay, skipping', { filePath });
        (0, db_1.recordUpload)(filename, 'failed');
        return;
    }
    // Parse PDF for fields
    const extracted = await (0, parser_1.parsePdf)(filePath);
    const config = (0, config_1.getConfig)();
    // Upload to backend
    const success = await (0, uploader_1.uploadBill)({
        filePath,
        backendUrl: config.backendUrl,
        merchantKey: config.merchantKey,
        phone: extracted.phone,
        name: extracted.name,
        orderId: extracted.orderId,
    });
    (0, db_1.recordUpload)(filename, success ? 'success' : 'failed');
}
function startWatcher(watchFolder) {
    if (watcher) {
        stopWatcher();
    }
    if (!fs_1.default.existsSync(watchFolder)) {
        logger_1.logger.error('Watch folder does not exist', { watchFolder });
        (0, tray_1.setTrayStatus)('error', `Watch folder not found: ${watchFolder}`);
        return;
    }
    logger_1.logger.info('Starting folder watcher', { watchFolder });
    watcher = chokidar_1.default.watch(watchFolder, {
        persistent: true,
        ignoreInitial: true, // don't fire for pre-existing files on startup
        awaitWriteFinish: {
            stabilityThreshold: 300, // wait for write to finish
            pollInterval: 100,
        },
        depth: 0, // watch only the top-level folder
    });
    watcher.on('add', (filePath) => {
        void handleNewPdf(filePath);
    });
    watcher.on('error', (err) => {
        logger_1.logger.error('Watcher error', { error: err.message });
        (0, tray_1.setTrayStatus)('error', `Watcher error: ${err.message}`);
    });
    watcher.on('ready', () => {
        logger_1.logger.info('Watcher ready — watching for new PDFs', { watchFolder });
        (0, tray_1.setTrayStatus)('connected', `Watching: ${watchFolder}`);
    });
}
function stopWatcher() {
    if (watcher) {
        void watcher.close();
        watcher = null;
        logger_1.logger.info('Watcher stopped');
    }
}
function isWatcherRunning() {
    return watcher !== null;
}
//# sourceMappingURL=watcher.js.map