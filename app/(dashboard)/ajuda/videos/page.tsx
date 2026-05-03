import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { VideosTabs, type VideoItem } from "@/components/ajuda/videos-tabs";
import { fetchVideoMeta } from "@/lib/youtube";

interface VideoEntry {
  id: string;
  secao: "atualizacoes" | "funcionalidades";
  /** Fallback caso o fetch do YouTube falhe. */
  tituloFallback?: string;
  descricaoFallback?: string;
  duracao?: string;
  publicadoEm?: string;
}

const VIDEOS: VideoEntry[] = [
  {
    id: "QO8abL7HoCQ",
    secao: "atualizacoes",
    tituloFallback: "Novidades da plataforma",
    descricaoFallback:
      "Atualização com as últimas novidades e melhorias do Diário Do Prof.",
    publicadoEm: "Maio de 2026",
  },
];

export default async function VideosPage() {
  // Puxa metadados em paralelo (com cache de 24h)
  const enriched: VideoItem[] = await Promise.all(
    VIDEOS.map(async (v) => {
      const meta = await fetchVideoMeta(v.id);
      return {
        id: v.id,
        secao: v.secao,
        titulo: meta.title ?? v.tituloFallback ?? "Vídeo sem título",
        descricao: meta.description ?? v.descricaoFallback ?? "",
        duracao: v.duracao,
        publicadoEm: v.publicadoEm,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <Link
        href="/ajuda"
        className="inline-flex items-center text-sm text-default-600 hover:text-default-900"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Central de ajuda
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-default-900">Vídeos</h1>
        <p className="text-sm text-default-600 mt-1">
          Tutoriais e atualizações do sistema. Clique num vídeo para reproduzir
          aqui mesmo.
        </p>
      </div>

      <VideosTabs videos={enriched} />
    </div>
  );
}
