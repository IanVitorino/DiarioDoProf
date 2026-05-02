import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { put } from "@vercel/blob";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function uploadAvatarFile(
  professorId: string,
  buffer: Buffer,
): Promise<string> {
  const fileName = `${professorId}.jpg`;
  const cachebust = `?v=${Date.now()}`;

  if (useBlob) {
    const blob = await put(`avatars/${fileName}`, buffer, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 31536000,
    });
    return `${blob.url}${cachebust}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);
  return `/uploads/avatars/${fileName}${cachebust}`;
}
