"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePdf = parsePdf;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./logger");
/**
 * Extract raw text from a PDF file.
 * Returns null if the file cannot be read or parsed.
 */
async function extractTextFromPdf(filePath) {
    try {
        const buffer = fs_1.default.readFileSync(filePath);
        const data = await (0, pdf_parse_1.default)(buffer);
        return data.text;
    }
    catch (err) {
        logger_1.logger.error('Failed to parse PDF', { filePath, error: err.message });
        return null;
    }
}
/**
 * Extract a 10-digit Indian mobile number from raw text.
 * Supports formats: +91-8000016913, +918000016913, 9876543210, 91-9876543210
 */
function extractPhone(text) {
    const patterns = [
        /(?:\+91[-\s]?)([6-9]\d{9})/, // +91-XXXXXXXXXX or +91XXXXXXXXXX
        /(?:91[-\s])([6-9]\d{9})/, // 91-XXXXXXXXXX
        /\b([6-9]\d{9})\b/, // plain 10-digit number starting with 6-9
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (match?.[1]) {
            return match[1];
        }
    }
    return null;
}
/**
 * Extract customer name from lines like:
 * "Name : John Doe", "Customer: Jane", "Bill To: Someone"
 */
function extractName(text) {
    const pattern = /(?:Name\s*[:：]|Customer\s*[:：]|Bill\s*To\s*[:：])\s*([^\n\r]+)/i;
    const match = pattern.exec(text);
    if (match?.[1]) {
        const name = match[1].trim();
        return name.length > 0 ? name : null;
    }
    return null;
}
/**
 * Extract order/invoice ID from lines like:
 * "ORD1703", "Invoice No. : INV-001", "Order No: 42", "# AB123"
 */
function extractOrderId(text) {
    const patterns = [
        /\b(ORD[A-Z0-9\-]+)\b/i,
        /\b(INV[A-Z0-9\-]+)\b/i,
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (match?.[1]) {
            return match[1].trim();
        }
    }
    return null;
}
/**
 * Main entry point: parses a PDF file and returns extracted fields.
 * All fields are optional — returns null for any field not found.
 */
async function parsePdf(filePath) {
    const text = await extractTextFromPdf(filePath);
    if (!text) {
        logger_1.logger.warn('PDF text extraction returned empty result', { filePath });
        return { phone: null, name: null, orderId: null };
    }
    const phone = extractPhone(text);
    const name = extractName(text);
    const orderId = extractOrderId(text);
    logger_1.logger.info('PDF parsed', {
        filePath,
        phone: phone ?? 'not found',
        name: name ?? 'not found',
        orderId: orderId ?? 'not found',
    });
    return { phone, name, orderId };
}
//# sourceMappingURL=parser.js.map