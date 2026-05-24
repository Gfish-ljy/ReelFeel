import * as Minio from 'minio';
import { env } from './env.js';

export const minioClient = new Minio.Client({
  endPoint: env.minio.endPoint,
  port: env.minio.port,
  useSSL: env.minio.useSSL,
  accessKey: env.minio.accessKey,
  secretKey: env.minio.secretKey,
});

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(env.minio.bucket);
  if (!exists) {
    await minioClient.makeBucket(env.minio.bucket, 'us-east-1');
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${env.minio.bucket}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(env.minio.bucket, JSON.stringify(policy));
  }
}

export function publicObjectUrl(objectName: string): string {
  return `${env.minio.publicUrl}/${objectName}`;
}
