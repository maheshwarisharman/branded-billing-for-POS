/**
 * s3.ts — AWS S3 client and helpers for uploading PDFs and generating
 * presigned download URLs.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId:     env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a PDF buffer to S3.
 * @param key  - The S3 object key (e.g. bills/{merchantId}/{timestamp}-{filename})
 * @param body - The PDF as a Buffer or Uint8Array
 */
export async function uploadToS3(key: string, body: Buffer): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket:      env.AWS_S3_BUCKET,
      Key:         key,
      Body:        body,
      ContentType: 'application/pdf',
    }),
  );
}

/**
 * Generate a short-lived presigned URL for a stored PDF.
 * @param key       - The S3 object key
 * @param expiresIn - Validity in seconds (default: 15 minutes)
 */
export async function getPresignedUrl(key: string, expiresIn = 900): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }),
    { expiresIn },
  );
}

/**
 * Build the S3 key for a bill PDF.
 */
export function buildS3Key(merchantId: string, filename: string): string {
  const ts = Date.now();
  // Sanitise the filename — strip any path components
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `bills/${merchantId}/${ts}-${safe}`;
}
