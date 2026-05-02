import sharp from "sharp";
import path from "path";

const LOGO_DIR = path.resolve(process.cwd(), "public/logo");

/**
 * Remove fundo BRANCO (alta luminância). Pixels claros viram transparentes,
 * com gradiente nas bordas anti-aliased.
 */
async function processWhiteBg(inputPath: string, outputPath: string) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const FULL_OPAQUE_BELOW = 200; // < esse min(rgb): totalmente opaco
  const FULL_TRANSPARENT_ABOVE = 240; // > esse min(rgb): totalmente transparente

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Para "branco", olho o canal mínimo (branco = todos altos)
    const lum = Math.min(r, g, b);
    let alpha = 255;
    if (lum > FULL_TRANSPARENT_ABOVE) alpha = 0;
    else if (lum > FULL_OPAQUE_BELOW) {
      alpha = Math.round(
        ((FULL_TRANSPARENT_ABOVE - lum) /
          (FULL_TRANSPARENT_ABOVE - FULL_OPAQUE_BELOW)) *
          255
      );
    }
    data[i + 3] = alpha;
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outputPath);

  console.log(`  ✓ ${path.basename(outputPath)}`);
}

async function main() {
  console.log("→ Processando logos novas...");
  // Cores claras → Logo_dark (vai em tema escuro)
  await processWhiteBg(
    path.join(LOGO_DIR, "WhatsApp Image 2026-05-01 at 11.05.42 PM.jpeg"),
    path.join(LOGO_DIR, "Logo_dark.png")
  );
  // Cores escuras → Logo_white (vai em tema claro)
  await processWhiteBg(
    path.join(LOGO_DIR, "WhatsApp Image 2026-05-01 at 11.06.01 PM.jpeg"),
    path.join(LOGO_DIR, "Logo_white.png")
  );
  console.log("\n✅ Concluído.");
}

main().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});
