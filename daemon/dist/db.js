"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.isAlreadyUploaded = isAlreadyUploaded;
exports.recordUpload = recordUpload;
exports.closeDb = closeDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const logger_1 = require("./logger");
let db = null;
function initDb() {
    const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'billdrop.db');
    db = new better_sqlite3_1.default(dbPath);
    db.exec(`
    CREATE TABLE IF NOT EXISTS uploaded_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      uploaded_at INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'skipped'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_filename ON uploaded_bills(filename);
  `);
    logger_1.logger.info('Database initialized', { path: dbPath });
}
function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return db;
}
function isAlreadyUploaded(filename) {
    const row = getDb()
        .prepare('SELECT status FROM uploaded_bills WHERE filename = ? AND status = ?')
        .get(filename, 'success');
    return row !== undefined;
}
function recordUpload(filename, status) {
    const now = Date.now();
    getDb()
        .prepare(`
      INSERT INTO uploaded_bills (filename, uploaded_at, status)
      VALUES (?, ?, ?)
      ON CONFLICT(filename) DO UPDATE SET uploaded_at = excluded.uploaded_at, status = excluded.status
    `)
        .run(filename, now, status);
}
function closeDb() {
    if (db) {
        db.close();
        db = null;
        logger_1.logger.info('Database connection closed');
    }
}
//# sourceMappingURL=db.js.map