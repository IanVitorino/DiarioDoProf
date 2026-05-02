"use server";

import path from "path";
import { writeFile, mkdir } from "fs/promises";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";

const AVATARS_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function getMeuPerfil() {
  const professorId = await getProfessorIdOrThrow();
  const [professor, totalTurmas] = await Promise.all([
    prisma.professor.findUniqueOrThrow({
      where: { id: professorId },
      select: { id: true, nome: true, email: true, avatarUrl: true, createdAt: true },
    }),
    prisma.turma.count({ where: { professorId } }),
  ]);
  return { ...professor, totalTurmas };
}

export type UploadAvatarResult =
  | { ok: true; avatarUrl: string }
  | { ok: false; error: string };

export async function uploadAvatar(formData: FormData): Promise<UploadAvatarResult> {
  const professorId = await getProfessorIdOrThrow();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return { ok: false, error: "Arquivo inválido" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Formato não suportado. Use PNG, JPEG ou WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Imagem maior que 5MB" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await sharp(buffer)
    .rotate()
    .resize(400, 400, { fit: "cover", position: "centre" })
    .jpeg({ quality: 85 })
    .toBuffer();

  await mkdir(AVATARS_DIR, { recursive: true });
  const fileName = `${professorId}.jpg`;
  await writeFile(path.join(AVATARS_DIR, fileName), processed);

  const avatarUrl = `/uploads/avatars/${fileName}?v=${Date.now()}`;
  await prisma.professor.update({
    where: { id: professorId },
    data: { avatarUrl },
  });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { ok: true, avatarUrl };
}
