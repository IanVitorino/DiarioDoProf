import sharp from "sharp";
import { readdirSync } from "fs";
import path from "path";

const LOGO_DIR = path.resolve(process.cwd(), "public/logo");

/**
 * Converte JPGs do logo para PNGs com fundo preto removido.
 * Estratégia: pixels muito escuros viram transparentes; pixels com luminância
 * média recebem alpha proporcional (suaviza bordas anti-aliased).
 */
async function processOne(filename: string) {
  const input = path.join(LOGO_DIR, filename);
  const outName = filename.replace(/\.(jpg|jpeg)$/i, ".png");
  const output = path.join(LOGO_DIR, outName);

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Limites pra alpha gradient
  const FULL_TRANSPARENT_BELOW = 25;
  const FULL_OPAQUE_ABOVE = 70;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.max(r, g, b);
    let alpha = 255;
    if (lum < FULL_TRANSPARENT_BELOW) alpha = 0;
    else if (lum < FULL_OPAQUE_ABOVE) {
      alpha = Math.round(
        ((lum - FULL_TRANSPARENT_BELOW) /
          (FULL_OPAQUE_ABOVE - FULL_TRANSPARENT_BELOW)) *
          255
      );
    }
    data[i + 3] = alpha;
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(output);

  console.log(`  ✓ ${filename} → ${outName}`);
}

async function main() {
  const files = readdirSync(LOGO_DIR).filter((f) =>
    /\.(jpg|jpeg)$/i.test(f)
  );
  if (files.length === 0) {
    console.log("Nenhum JPG/JPEG em public/logo/");
    return;
  }
  console.log(`→ Convertendo ${files.length} arquivo(s)...`);
  for (const f of files) {
    await processOne(f);
  }
  console.log("\n✅ Conversão concluída.");
}

main().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});
