# Central de ajuda

Cobre as telas `/ajuda` (central) e `/ajuda/videos` (player + lista).

> Última atualização: 2026-05-03

---

## 1. Visão geral

Sessão **Ajuda** na sidebar (em "AJUDA"), com um único item: **Central de ajuda** → `/ajuda`. A partir daí o usuário pode navegar pra `/ajuda/videos` via botão "Ver vídeos".

Sem dependência de banco — ambas as páginas são estáticas com dados em arquivos TypeScript.

---

## 2. Tela `/ajuda` — Central de ajuda

Layout com 4 seções:

### Banner de boas-vindas

Card com `bg-primary/5 border-primary/20`:
- Ícone `HelpCircle` centralizado
- Título "Bem-vindo à Central de ajuda do Diário Do Prof"
- Subtítulo curto

### Guia rápido — Primeiros passos

Grid de **6 cards numerados** cobrindo o fluxo do produto:

1. Crie sua primeira turma
2. Configure os bimestres
3. Cadastre os alunos
4. Crie atividades
5. Lance as notas
6. Acompanhe os resultados

Cada card tem:
- Número grande translúcido no canto (decorativo)
- Ícone teal-soft à esquerda
- Título em negrito + descrição

Os ícones e cópias estão hardcoded em `app/(dashboard)/ajuda/page.tsx` no array `PASSOS`.

### Vídeos tutoriais

Banner único com `bg-primary/5 border-primary/20`:
- Ícone `PlayCircle`
- Título "Assista aos tutoriais"
- Botão **Ver vídeos** → linka pra `/ajuda/videos`

### FAQ — Perguntas frequentes

Componente `<FAQList items={FAQ} />` (em `components/ajuda/faq-list.tsx`):
- Search no canto direito (busca filtra por pergunta + resposta, **ignora acentos** via `stripDiacritics`)
- Accordion expansível (1 item aberto por vez)
- Item ativo ganha borda primária
- Empty state quando busca não retorna

#### Adicionar perguntas

Edite o array `FAQ` em `app/(dashboard)/ajuda/page.tsx`:

```tsx
const FAQ: FAQItem[] = [
  {
    pergunta: "Como crio uma nova turma?",
    resposta: "Vá em Cadastros → Turmas...",
  },
  // adiciona aqui
];
```

`resposta` aceita string ou JSX (links, strong, etc).

---

## 3. Tela `/ajuda/videos` — Vídeos

Tela com tabs **Atualizações | Funcionalidades** + lista/player de vídeos do YouTube.

### Estados

#### Lista (default — sem `?v=`)

- Tabs no topo (URL param `?tab=atualizacoes|funcionalidades`)
- Lista vertical de cards de vídeo, cada um com:
  - Thumbnail (do YouTube via `mqdefault.jpg`, 16:9 nativo, sem barras pretas)
  - Hover: overlay escuro + ícone Play centralizado
  - Título (vindo do YouTube via oEmbed)
  - Descrição (line-clamp 2; vinda da `og:description` da página do YouTube)
  - Data de publicação (manual, do array)
- Sem player visível — clica num item pra ir pra view de player

#### Player (com `?v=<ID>`)

- Tabs **somem**
- Botão "← Voltar para a lista"
- Player iframe ocupa o topo (16:9, autoplay)
- Título + descrição + data abaixo do player
- Lista de "Próximos vídeos" abaixo, mostrando apenas os outros vídeos da **mesma seção**
- Click num próximo: troca o vídeo no player + atualiza URL

### Fonte dos metadados (sem API key)

`lib/youtube.ts` faz duas requests **server-side** em paralelo, com cache de 24h:

```ts
fetchVideoMeta(id): Promise<{ title, description }>
```

1. **`oEmbed`** (`youtube.com/oembed?url=...&format=json`) → título oficial
2. **Scrape do `og:description`** da página do vídeo → descrição

Cache via `next: { revalidate: 60*60*24 }`.

Se algum fetch falhar (rede, vídeo privado, bloqueio), cai pros campos `tituloFallback`/`descricaoFallback` definidos no array.

### Adicionar um vídeo novo

Edite o array `VIDEOS` em `app/(dashboard)/ajuda/videos/page.tsx`:

```tsx
const VIDEOS: VideoEntry[] = [
  {
    id: "QO8abL7HoCQ",                    // ID do YouTube (depois do v= ou youtu.be/)
    secao: "atualizacoes",                 // "atualizacoes" | "funcionalidades"
    tituloFallback: "Título de fallback",  // opcional
    descricaoFallback: "Descrição...",     // opcional
    duracao: "5:30",                       // opcional, aparece como overlay no thumb
    publicadoEm: "Maio de 2026",           // opcional
  },
];
```

Pra extrair o ID do YouTube:
- `https://youtu.be/QO8abL7HoCQ?si=...` → `QO8abL7HoCQ`
- `https://www.youtube.com/watch?v=QO8abL7HoCQ` → `QO8abL7HoCQ`
- `https://www.youtube.com/embed/QO8abL7HoCQ` → `QO8abL7HoCQ`

---

## 4. URL state

Toda navegação é persistida na URL — refresh, share e voltar/avançar funcionam:

| URL | Estado |
|---|---|
| `/ajuda` | Central de ajuda |
| `/ajuda/videos` | Lista de Atualizações (default) |
| `/ajuda/videos?tab=funcionalidades` | Lista de Funcionalidades |
| `/ajuda/videos?tab=atualizacoes&v=<ID>` | Player do vídeo |

---

## 5. Sidebar e PageTitle

- **Sidebar** (`config/menus.ts`): grupo `Ajuda` com item "Central de ajuda" (ícone `HelpCircle`, href `/ajuda`)
- **PageTitle** (`components/partials/header/page-title.tsx`): mapeia `/ajuda*` → "Central de ajuda" (cobre tanto `/ajuda` quanto `/ajuda/videos`)

---

## 6. Arquivos relacionados

- `app/(dashboard)/ajuda/page.tsx` — Central de ajuda (banner, guia rápido, vídeos banner, FAQ)
- `app/(dashboard)/ajuda/videos/page.tsx` — Lista + player de vídeos (server component, busca metadados)
- `components/ajuda/faq-list.tsx` — Accordion + search
- `components/ajuda/videos-tabs.tsx` — Tabs + lista + player (state machine)
- `lib/youtube.ts` — `fetchVideoMeta`, `youtubeThumb`
- `config/menus.ts` — entrada na sidebar
- `components/partials/header/page-title.tsx` — mapeamento da rota
