import winston from 'winston';
import type { TransformableInfo } from 'logform';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { app } from 'electron';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const logDir = path.join(app.getPath('userData'), 'logs');

function formatInfo(info: TransformableInfo): string {
  const timestamp = info['timestamp'] as string | undefined;
  const level = String(info.level);
  const message = String(info.message);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { timestamp: _ts, level: _lvl, message: _msg, ...meta } = info as Record<string, unknown>;
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp ?? ''}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function formatInfoConsole(info: TransformableInfo): string {
  const timestamp = info['timestamp'] as string | undefined;
  const level = String(info.level);
  const message = String(info.message);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { timestamp: _ts, level: _lvl, message: _msg, ...meta } = info as Record<string, unknown>;
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp ?? ''}] ${level} ${message}${metaStr}`;
}

const fileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'daemon-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '7d',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(formatInfo)
  ),
});

const transports: winston.transport[] = [fileTransport];

if (isDev) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(formatInfoConsole)
      ),
    })
  );
}

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  transports,
});

export function getLogFilePath(): string {
  return path.join(logDir, 'daemon.log');
}
