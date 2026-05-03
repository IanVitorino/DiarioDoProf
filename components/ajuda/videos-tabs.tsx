"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ArrowLeft, PlayCircle } from "lucide-react";

export interface VideoItem {
  id: string;
  titulo: string;
  descricao: string;
  secao: "atualizacoes" | "funcionalidades";
  duracao?: string;
  publicadoEm?: string;
}

interface Props {
  videos: VideoItem[];
}

const TABS = [
  { value: "atualizacoes", label: "Atualizações" },
  { value: "funcionalidades", label: "Funcionalidades" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function thumbUrl(id: string) {
  // mqdefault.jpg é 320x180 (nativo 16:9, sem barras pretas)
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

export function VideosTabs({ videos }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as TabValue | null;
  const videoParam = searchParams.get("v");

  const tab: TabValue =
    tabParam && TABS.some((t) => t.value === tabParam) ? tabParam : "atualizacoes";

  const videosDaTab = videos.filter((v) => v.secao === tab);
  const videoSelecionado = videoParam
    ? videos.find((v) => v.id === videoParam) ?? null
    : null;

  const setTab = (next: TabValue) => {
    const params = new URLSearchParams();
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setVideo = (id: string, secao: TabValue) => {
    const params = new URLSearchParams();
    params.set("tab", secao);
    params.set("v", id);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const voltarParaLista = () => {
    const params = new URLSearchParams();
    params.set("tab", videoSelecionado?.secao ?? tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // ============ MODO PLAYER ============
  if (videoSelecionado != null) {
    const outros = videos.filter(
      (v) => v.secao === videoSelecionado.secao && v.id !== videoSelecionado.id,
    );

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={voltarParaLista}
          className="inline-flex items-center gap-2 text-sm text-default-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a lista
        </button>

        {/* Player */}
        <div>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe
              key={videoSelecionado.id}
              src={`https://www.youtube.com/embed/${videoSelecionado.id}?rel=0&autoplay=1`}
              title={videoSelecionado.titulo}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="mt-3">
            <h2 className="text-lg font-bold text-default-900">
              {videoSelecionado.titulo}
            </h2>
            <p className="text-sm text-default-600 mt-1">
              {videoSelecionado.descricao}
            </p>
            {videoSelecionado.publicadoEm && (
              <p className="text-xs text-default-500 mt-1">
                Publicado em {videoSelecionado.publicadoEm}
              </p>
            )}
          </div>
        </div>

        {/* Próximos vídeos da mesma seção */}
        <div>
          <h3 className="text-sm font-semibold text-default-900 mb-3 uppercase tracking-wider">
            Próximos vídeos
          </h3>
          {outros.length === 0 ? (
            <p className="text-sm text-default-500 italic">
              Não há outros vídeos nesta seção.
            </p>
          ) : (
            <div className="space-y-2">
              {outros.map((v) => (
                <VideoListItem
                  key={v.id}
                  video={v}
                  onClick={() => setVideo(v.id, v.secao)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ MODO LISTA ============
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-default-200">
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const ativo = t.value === tab;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  ativo
                    ? "border-primary text-primary"
                    : "border-transparent text-default-600 hover:text-default-900",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {videosDaTab.length === 0 ? (
        <Card className="p-12 flex flex-col items-center text-center">
          <div className="rounded-full bg-default-100 p-4 mb-4">
            <PlayCircle className="w-8 h-8 text-default-500" />
          </div>
          <p className="text-default-700 mb-1 text-lg font-medium">
            Sem vídeos nesta seção ainda
          </p>
          <p className="text-sm text-default-500 max-w-md">
            Novos conteúdos serão adicionados em breve.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {videosDaTab.map((v) => (
            <VideoListItem
              key={v.id}
              video={v}
              onClick={() => setVideo(v.id, v.secao)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoListItem({
  video,
  onClick,
}: {
  video: VideoItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-4 p-3 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50/40 transition-all text-left group"
    >
      <div className="relative aspect-video w-48 sm:w-56 shrink-0 overflow-hidden rounded-md bg-default-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl(video.id)}
          alt={video.titulo}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <PlayCircle className="w-10 h-10 text-white opacity-0 group-hover:opacity-90 drop-shadow-lg transition-opacity" />
        </div>
        {video.duracao && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            {video.duracao}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-default-900 line-clamp-2">
          {video.titulo}
        </h4>
        <p className="text-sm text-default-600 mt-1 line-clamp-2">
          {video.descricao}
        </p>
        {video.publicadoEm && (
          <p className="text-xs text-default-500 mt-2">{video.publicadoEm}</p>
        )}
      </div>
    </button>
  );
}
