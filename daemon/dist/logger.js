"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.getLogFilePath = getLogFilePath;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
const logDir = path_1.default.join(electron_1.app.getPath('userData'), 'logs');
function formatInfo(info) {
    const timestamp = info['timestamp'];
    const level = String(info.level);
    const message = String(info.message);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestamp: _ts, level: _lvl, message: _msg, ...meta } = info;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp ?? ''}] [${level.toUpperCase()}] ${message}${metaStr}`;
}
function formatInfoConsole(info) {
    const timestamp = info['timestamp'];
    const level = String(info.level);
    const message = String(info.message);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestamp: _ts, level: _lvl, message: _msg, ...meta } = info;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp ?? ''}] ${level} ${message}${metaStr}`;
}
const fileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'daemon-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxSize: '20m',
    maxFiles: '7d',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(formatInfo)),
});
const transports = [fileTransport];
if (isDev) {
    transports.push(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf(formatInfoConsole)),
    }));
}
exports.logger = winston_1.default.createLogger({
    level: isDev ? 'debug' : 'info',
    transports,
});
function getLogFilePath() {
    return path_1.default.join(logDir, 'daemon.log');
}
//# sourceMappingURL=logger.js.map