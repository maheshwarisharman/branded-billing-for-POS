import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';
import { parsePdf } from './parser';
import { uploadBill } from './uploader';
import { isAlreadyUploaded, recordUpload } from './db';
import { getConfig } from './config';
import { setTrayStatus } from './tray';

let watcher: FSWatcher | null = null;

const PDF_SETTLE_DELAY_MS = 500;

async function handleNewPdf(filePath: string): Promise<void> {
  const filename = path.basename(filePath);

  // Guard: only process .pdf files
  if (!filename.toLowerCase().endsWith('.pdf')) {
    return;
  }

  logger.info('New PDF detected', { filePath });

  // Idempotency check
  if (isAlreadyUploaded(filename)) {
    logger.info('Skipping duplicate — already uploaded successfully', { filename });
    return;
  }

  // Wait for the file to finish being written
  await new Promise<void>((resolve) => setTimeout(resolve, PDF_SETTLE_DELAY_MS));

  // Verify file still exists and is readable after settle delay
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch {
    logger.warn('File not accessible after settle delay, skipping', { filePath });
    recordUpload(filename, 'failed');
    return;
  }

  // Parse PDF for fields
  const extracted = await parsePdf(filePath);

  const config = getConfig();

  // Upload to backend
  const success = await uploadBill({
    filePath,
    backendUrl: config.backendUrl,
    merchantKey: config.merchantKey,
    phone: extracted.phone,
    name: extracted.name,
    orderId: extracted.orderId,
  });

  recordUpload(filename, success ? 'success' : 'failed');
}

export function startWatcher(watchFolder: string): void {
  if (watcher) { 
    stopWatcher();
  }

  if (!fs.existsSync(watchFolder)) {
    logger.error('Watch folder does not exist', { watchFolder });
    setTrayStatus('error', `Watch folder not found: ${watchFolder}`);
    return;
  }

  logger.info('Starting folder watcher', { watchFolder });

  watcher = chokidar.watch(watchFolder, {
    persistent: true,
    ignoreInitial: true,        // don't fire for pre-existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 300,  // wait for write to finish
      pollInterval: 100,
    },
    depth: 0,                   // watch only the top-level folder
  });

  watcher.on('add', (filePath: string) => {
    void handleNewPdf(filePath);
  });

  watcher.on('error', (err: Error) => {
    logger.error('Watcher error', { error: err.message });
    setTrayStatus('error', `Watcher error: ${err.message}`);
  });

  watcher.on('ready', () => {
    logger.info('Watcher ready — watching for new PDFs', { watchFolder });
    setTrayStatus('connected', `Watching: ${watchFolder}`);
  });
}

export function stopWatcher(): void {
  if (watcher) {
    void watcher.close();
    watcher = null;
    logger.info('Watcher stopped');
  }
}

export function isWatcherRunning(): boolean {
  return watcher !== null;
}
