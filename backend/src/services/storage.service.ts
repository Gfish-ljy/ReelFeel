import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { minioClient, publicObjectUrl, ensureBucket } from '../config/minio.js';
import { env } from '../config/env.js';

let bucketReady = false;

async function initBucket() {
  if (!bucketReady) {
    await ensureBucket();
    bucketReady = true;
  }
}

export async function uploadImage(
  objectKey: string,
  buffer: Buffer,
  mime: string
): Promise<string> {
  await initBucket();
  await minioClient.putObject(env.minio.bucket, objectKey, buffer, buffer.length, {
    'Content-Type': mime,
  });
  return publicObjectUrl(objectKey);
}

export async function processAndUploadDiaryImage(
  diaryId: string,
  buffer: Buffer,
  mime: string,
  sortOrder: number
) {
  await initBucket();
  const baseId = uuidv4();

  const main = await sharp(buffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const thumb = await sharp(buffer)
    .resize({ width: 400, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  const mainKey = `diaries/${diaryId}/${baseId}.jpg`;
  const thumbKey = `diaries/${diaryId}/${baseId}_thumb.jpg`;

  await minioClient.putObject(env.minio.bucket, mainKey, main, main.length, {
    'Content-Type': 'image/jpeg',
  });
  await minioClient.putObject(env.minio.bucket, thumbKey, thumb, thumb.length, {
    'Content-Type': 'image/jpeg',
  });

  return {
    imageUrl: publicObjectUrl(mainKey),
    thumbnailUrl: publicObjectUrl(thumbKey),
    sortOrder,
  };
}
