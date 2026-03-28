import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { logger } from './logger';

export type UploadStatus = 'success' | 'failed' | 'skipped';

export interface UploadedBill {
  filename: string;
  uploaded_at: number;
  status: UploadStatus;
}

let db: Database.Database | null = null;

export function initDb(): void {
  const dbPath = path.join(app.getPath('userData'), 'billdrop.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS uploaded_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      uploaded_at INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'skipped'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_filename ON uploaded_bills(filename);
  `);

  logger.info('Database initialized', { path: dbPath });
}

function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function isAlreadyUploaded(filename: string): boolean {
  const row = getDb()
    .prepare('SELECT status FROM uploaded_bills WHERE filename = ? AND status = ?')
    .get(filename, 'success') as { status: string } | undefined;
  return row !== undefined;
}

export function recordUpload(filename: string, status: UploadStatus): void {
  const now = Date.now();
  getDb()
    .prepare(`
      INSERT INTO uploaded_bills (filename, uploaded_at, status)
      VALUES (?, ?, ?)
      ON CONFLICT(filename) DO UPDATE SET uploaded_at = excluded.uploaded_at, status = excluded.status
    `)
    .run(filename, now, status);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}
