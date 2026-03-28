import { ExtractedFields } from './parser';
export interface UploadPayload extends ExtractedFields {
    filePath: string;
    backendUrl: string;
    merchantKey: string;
}
export declare function uploadBill(payload: UploadPayload): Promise<boolean>;
//# sourceMappingURL=uploader.d.ts.map