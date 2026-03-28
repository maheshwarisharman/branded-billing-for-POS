import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { ExtractedFields } from './parser';
import { Notification } from 'electron';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

export interface UploadPayload extends ExtractedFields {
  filePath: string;
  backendUrl: string;
  merchantKey: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildForm(payload: UploadPayload): FormData {
  const form = new FormData();
  const filename = path.basename(payload.filePath);

  form.append('pdf', fs.createReadStream(payload.filePath), {
    filename,
    contentType: 'application/pdf',
  });

  // Append fields as strings or null-serialized
  form.append('phone', payload.phone ?? 'null');
  form.append('name', payload.name ?? 'null');
  form.append('orderId', payload.orderId ?? 'null');
  form.append('merchantKey', payload.merchantKey);

  return form;
}

export async function uploadBill(payload: UploadPayload): Promise<boolean> {
  const filename = path.basename(payload.filePath);
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 2s, 4s, 8s

    try {
      logger.info(`Upload attempt ${attempt}/${MAX_RETRIES}`, { filename });

      const form = buildForm(payload);

      const response = await fetch(payload.backendUrl, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });

      if (response.ok) {
        logger.info('Upload succeeded', {
          filename,
          status: response.status,
          attempt,
        });
        return true;
      }

      const body = await response.text().catch(() => '(unreadable body)');
      logger.warn(`Upload returned non-2xx on attempt ${attempt}`, {
        filename,
        status: response.status,
        body,
      });
    } catch (err) {
      logger.warn(`Upload network error on attempt ${attempt}`, {
        filename,
        error: (err as Error).message,
      });
    }

    if (attempt < MAX_RETRIES) {
      logger.info(`Retrying in ${delay / 1000}s...`, { filename });
      await sleep(delay);
    }
  }

  logger.error('All upload attempts failed', { filename, maxRetries: MAX_RETRIES });

  // Show tray notification on final failure
  if (Notification.isSupported()) {
    new Notification({
      title: 'BillDrop Agent',
      body: 'Bill upload failed — check your connection.',
      silent: false,
    }).show();
  }

  return false;
}
