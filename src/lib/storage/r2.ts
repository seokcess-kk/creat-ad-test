import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 개발 모드 확인 (R2 환경 변수 없음)
export const isStorageDevMode = !process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID;

// 개발 모드가 아닐 때만 클라이언트 생성
const s3Client = isStorageDevMode
  ? null
  : new S3Client({
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
  // 개발 모드: 플레이스홀더 URL 반환
  if (isStorageDevMode || !s3Client) {
    console.log('📦 R2 Storage: 개발 모드 - 플레이스홀더 URL 반환');
    return `https://placehold.co/800x800/4ECDC4/FFFFFF?text=Uploaded+Image`;
  }

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
