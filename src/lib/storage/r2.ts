import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  buffer: Buffer,
  mimeType: string = 'image/png'
): Promise<string> {
  const fileName = `creatives/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileName,
    Body: buffer,
    ContentType: mimeType,
  });

  try {
    await s3Client.send(command);
    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error(
      `파일 업로드 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function uploadBase64ToR2(
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<string> {
  const buffer = Buffer.from(base64Data, 'base64');
  return uploadToR2(buffer, mimeType);
}
