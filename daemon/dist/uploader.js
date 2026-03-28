"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBill = uploadBill;
const node_fetch_1 = __importDefault(require("node-fetch"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
const electron_1 = require("electron");
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function buildForm(payload) {
    const form = new form_data_1.default();
    const filename = path_1.default.basename(payload.filePath);
    form.append('pdf', fs_1.default.createReadStream(payload.filePath), {
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
async function uploadBill(payload) {
    const filename = path_1.default.basename(payload.filePath);
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        attempt++;
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 2s, 4s, 8s
        try {
            logger_1.logger.info(`Upload attempt ${attempt}/${MAX_RETRIES}`, { filename });
            const form = buildForm(payload);
            const response = await (0, node_fetch_1.default)(payload.backendUrl, {
                method: 'POST',
                body: form,
                headers: form.getHeaders(),
            });
            if (response.ok) {
                logger_1.logger.info('Upload succeeded', {
                    filename,
                    status: response.status,
                    attempt,
                });
                return true;
            }
            const body = await response.text().catch(() => '(unreadable body)');
            logger_1.logger.warn(`Upload returned non-2xx on attempt ${attempt}`, {
                filename,
                status: response.status,
                body,
            });
        }
        catch (err) {
            logger_1.logger.warn(`Upload network error on attempt ${attempt}`, {
                filename,
                error: err.message,
            });
        }
        if (attempt < MAX_RETRIES) {
            logger_1.logger.info(`Retrying in ${delay / 1000}s...`, { filename });
            await sleep(delay);
        }
    }
    logger_1.logger.error('All upload attempts failed', { filename, maxRetries: MAX_RETRIES });
    // Show tray notification on final failure
    if (electron_1.Notification.isSupported()) {
        new electron_1.Notification({
            title: 'BillDrop Agent',
            body: 'Bill upload failed — check your connection.',
            silent: false,
        }).show();
    }
    return false;
}
//# sourceMappingURL=uploader.js.map