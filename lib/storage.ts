import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const useR2 = !!process.env.R2_BUCKET;

let _s3: S3Client | null = null;
function s3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3;
}

export async function uploadAvatarFile(
  professorId: string,
  buffer: Buffer,
): Promise<string> {
  const fileName = `${professorId}.jpg`;
  const cachebust = `?v=${Date.now()}`;

  if (useR2) {
    const key = `avatars/${fileName}`;
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${process.env.R2_PUBLIC_URL}/${key}${cachebust}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);
  return `/uploads/avatars/${fileName}${cachebust}`;
}
