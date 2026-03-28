export type UploadStatus = 'success' | 'failed' | 'skipped';
export interface UploadedBill {
    filename: string;
    uploaded_at: number;
    status: UploadStatus;
}
export declare function initDb(): void;
export declare function isAlreadyUploaded(filename: string): boolean;
export declare function recordUpload(filename: string, status: UploadStatus): void;
export declare function closeDb(): void;
//# sourceMappingURL=db.d.ts.map