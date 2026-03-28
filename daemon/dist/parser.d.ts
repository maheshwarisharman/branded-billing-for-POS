export interface ExtractedFields {
    phone: string | null;
    name: string | null;
    orderId: string | null;
}
/**
 * Main entry point: parses a PDF file and returns extracted fields.
 * All fields are optional — returns null for any field not found.
 */
export declare function parsePdf(filePath: string): Promise<ExtractedFields>;
//# sourceMappingURL=parser.d.ts.map