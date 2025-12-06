import * as Minio from "minio";

const useSSL = process.env.MINIO_USE_SSL === "true";
const port = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : (useSSL ? 443 : 80);

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const BUCKET_NAME = process.env.MINIO_BUCKET || "media";

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME);
    // Set bucket policy to allow public read access
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  }
}

export async function uploadFile(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  await ensureBucket();
  await minioClient.putObject(BUCKET_NAME, filename, file, file.length, {
    "Content-Type": mimeType,
  });

  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const endpoint = process.env.MINIO_ENDPOINT || "localhost";
  const portStr = process.env.MINIO_PORT;

  // For standard ports (443 for HTTPS, 80 for HTTP), don't include in URL
  const isStandardPort = (protocol === "https" && portStr === "443") ||
                         (protocol === "http" && portStr === "80") ||
                         !portStr;

  const portSuffix = isStandardPort ? "" : `:${portStr}`;

  return `${protocol}://${endpoint}${portSuffix}/${BUCKET_NAME}/${filename}`;
}

export async function deleteFile(filename: string): Promise<void> {
  await minioClient.removeObject(BUCKET_NAME, filename);
}

export async function getPresignedUrl(
  filename: string,
  expiry: number = 60 * 60 * 24 // 24 hours
): Promise<string> {
  return await minioClient.presignedGetObject(BUCKET_NAME, filename, expiry);
}

export { minioClient, BUCKET_NAME };
