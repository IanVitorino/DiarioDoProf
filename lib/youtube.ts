// Helpers pra puxar metadados públicos de vídeos do YouTube sem API key.
// Usa oEmbed (público) pra título + scrape do og:description da página
// pra descrição. Cache de 24h via fetch nativo do Next.

interface VideoMeta {
  title: string | null;
  description: string | null;
}

const REVALIDATE_SECONDS = 60 * 60 * 24; // 24h

async function fetchOEmbedTitle(id: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string };
    return data.title ?? null;
  } catch {
    return null;
  }
}

async function fetchOgDescription(id: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${id}`;
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: {
        // User-agent comum pra evitar bloqueio
        "User-Agent":
          "Mozilla/5.0 (compatible; DiarioDoProfBot/1.0; +https://diariodoprof.local)",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ??
      html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (!match) return null;
    // Decodifica entidades HTML básicas
    return match[1]
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  } catch {
    return null;
  }
}

export async function fetchVideoMeta(id: string): Promise<VideoMeta> {
  const [title, description] = await Promise.all([
    fetchOEmbedTitle(id),
    fetchOgDescription(id),
  ]);
  return { title, description };
}

export function youtubeThumb(id: string): string {
  // mqdefault.jpg é 320x180 (16:9 nativo, sem barras pretas).
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}
