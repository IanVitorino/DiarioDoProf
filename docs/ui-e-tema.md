# UI e tema

Cobre layout, branding, tema teal, sidebar/navbar, animações, componentes compartilhados e padrões de feedback.

> Última atualização: 2026-05-03

---

## 1. Branding

- **Nome:** Diário Do Prof
- **Logo:** ícone (livro aberto + check verde) em `public/logo/`
  - `Logo_dark.png` / `Logo_white.png` — ícone (com texto da marca embutido)
  - `Full_logo_dark.png` / `Full_logo_white.png` — versão horizontal (futura)
- Renderizado via `components/site-logo.tsx` com prop `mode="auto"|"dark"|"light"`
- **Detecção via CSS** (`dark:hidden` / `hidden dark:block`) — sem flicker no carregamento

---

## 2. Tema

### Cor primária

Teal customizado:
- HSL: `174 64% 21%`
- Aproximadamente `#147060`
- Inspirado na cor do logo

### Onde está aplicado

- **`config/site.ts`** — `theme: "teal"`
- **`config/thems.ts`** — entrada `"teal"` com `cssVars.light/dark.primary` e `activeColor`
- **`app/assets/scss/globals.scss`** — escala `--primary-50` até `--primary-900` em HSL
- **`app/assets/scss/theme.scss`** — classes `.theme-teal` e `.dark .theme-teal`

### Theme customizer

`components/partials/customizer/theme-customizer.tsx` mantém todo o template original mas o **trigger está oculto** (`hidden`). Pode reativar removendo a classe pra debug visual.

---

## 3. Layout

### Default

- **Layout:** `semibox` (sidebar flutuando com `m-6 rounded-md`)
- **Sidebar type:** `popover` (deriva automaticamente do layout semibox)
- **Navbar type:** `sticky`

### Estrutura de rotas

```
app/
├── (auth)/        ← login + signup com layout split diagonal
│   ├── layout.tsx ← clip-path inclinado para a direita
│   ├── login/
│   └── signup/
└── (dashboard)/   ← área protegida (sidebar + navbar)
    ├── layout.tsx ← DashBoardLayoutProvider
    ├── turmas/
    ├── notas/
    ├── analise-turma/
    ├── dashboard-aluno/
    ├── dashboard-atividades/
    └── perfil/
```

### Layout (auth) — split diagonal

`app/(auth)/layout.tsx`:
- Lado esquerdo branco (form)
- Lado direito teal-800 (logo + tagline + 3 features)
- Divisão por `clip-path: polygon(25% 0, 100% 0, 100% 100%, 0 100%)`
- Logo no topo escondendo o subtítulo embutido (mask div)
- **Texto do painel branco usa cores literais** (`text-slate-900/700`) pra não inverter em dark mode

### Layout (dashboard) — semibox

`provider/dashboard.layout.provider.tsx`:
- Sidebar fixa à esquerda (272px expandida, 72px colapsada)
- Navbar sticky no topo, com margem que acompanha a sidebar
- Conteúdo principal dentro de `semibox-content-wrapper`
- Margens corrigidas pra evitar overlap entre sidebar (com `m-6`) e header/conteúdo:
  - Colapsada: `ml-[96px]` (24px da margem da sidebar + 72px de largura)
  - Expandida: `ml-[272px]` (24 + 248)

---

## 4. Sidebar

### Comportamento

- **Toggle** via botão hamburger na navbar (`MenuBar` em `vertical-header.tsx`)
- Estado em `useSidebar` (Zustand persistido)
- 4 tipos suportados — usamos **popover** por padrão (semibox)

### Conteúdo (`config/menus.ts`)

Sidebar `classic`:

```
CADASTROS
  ├ Turmas              (ícone: Users)
  └ Notas               (ícone: ClipboardList)
DADOS
  ├ Análise da turma    (ícone: BarChart3)
  ├ Dashboard aluno     (ícone: UserCircle)
  └ Dashboard atividades (ícone: Activity)
```

### Logo na sidebar

`components/partials/sidebar/common/logo.tsx`:
- Wrapper com tamanho fixo (`h-16 w-16` expandida / `h-10 w-10` colapsada centralizado)
- Texto "Diário Do Prof" só aparece quando expandida
- Animação suave em width/height/margin (300ms)

---

## 5. Navbar

`components/partials/header/index.tsx`:

- **Botão hamburger** (toggle sidebar)
- **Título do módulo** centralizado (`PageTitle`)
- **Ferramentas (direita):** Fullscreen, Theme toggle, Profile dropdown

### Removidos do template original

- Search field
- Inbox/mailbox
- Notification message

### `PageTitle`

Mapeia `pathname` para título humano:

| Rota | Título |
|---|---|
| `/turmas*` | Turmas |
| `/notas*` | Notas |
| `/analise-turma*` | Análise da turma |
| `/dashboard-aluno*` | Dashboard aluno |
| `/dashboard-atividades*` | Dashboard atividades |
| `/perfil*` | Meu perfil |

Centralizado via `absolute left-1/2 -translate-x-1/2`, `pointer-events-none`, `hidden md:block`. Tamanho `text-lg`.

### Sem backdrop-blur

O `bg-card/90 backdrop-blur-lg` original do template foi substituído por `bg-card` sólido. O pseudo-elemento `.has-sticky-header::after` (que aplicava blur global na navbar) foi removido do `globals.scss` — gerava artefatos visuais durante a animação da sidebar.

---

## 6. Animações

### Sidebar abrir/fechar

- **Sidebar wrapper:** `transition-[width] duration-300 ease-in-out`
- **Content wrapper:** `transition-[margin] duration-300 ease-in-out`
- **Logo:** `transition-[height,width,margin] duration-300 ease-in-out`

### Mobile sidebar

- **Sidebar:** `transition-transform duration-300 ease-in-out` com `translate-x-full` ↔ `translate-x-0`
- **Sombra** (`shadow-xl`) só aplicada quando aberta (evita vazar quando fechada off-screen)
- **Overlay:** fade in/out 300ms com `pointer-events-none` quando invisível

### Hamburger mobile

`MobileMenuHandler`:
- Ícone `Menu` ↔ `X` com crossfade (rotate + scale + opacity), 300ms ease-in-out

### Charts (donut interativo)

`components/analise/distribuicao-chart.tsx` e `components/dashboard-aluno/distribuicao-aluno.tsx`:

- **Entrada do donut:** 800ms ease-out (`animationDuration={800}`)
- **Hover na fatia:**
  - Fatia ativa cresce `+8px` no `outerRadius`
  - Animation `sector-pop`: scale 0.94 → 1.02 → 1, com opacity fade-in (240ms)
  - Fatias inativas: `opacity 0.4` + `saturate(0.7)` (transição 220ms)
- **Texto central:**
  - Número (%) faz `pop-in`: scale 0.85 → 1.05 → 1, com fade-in (240ms)
  - Labels fazem `fade-in` com slide vertical (200ms)
  - Re-anima a cada hover via `key` que muda

Keyframes em `globals.scss`:

```scss
@keyframes pop-in { /* 0.85 → 1.05 → 1 */ }
@keyframes fade-in { /* opacity + translateY */ }
@keyframes sector-pop { /* opacity 0.5 + scale 0.94 → 1 */ }

.animate-pop { animation: pop-in 240ms ease-out; }
.animate-fade { animation: fade-in 200ms ease-out; }
.animate-sector-pop { animation: sector-pop 240ms ease-out; }
```

---

## 7. Componentes compartilhados

### `InitialsAvatar` — `components/ui/initials-avatar.tsx`

Círculo com fundo primário e iniciais do nome. Detalhes em `perfil-e-auth.md`.

### `MaskedDatePicker` — `components/ui/masked-date-picker.tsx`

Input de data com:
- **Máscara `dd/mm/aaaa`** (auto-insere `/` em pos 2 e 4, limita a 10 chars)
- **Bloqueio de letras/símbolos** via `onKeyDown`
- **Ícone de calendário lateral** que abre o picker (`clickOpens: false` no Flatpickr)
- Suporta `minDate`/`maxDate`/`staticPosition` (modo inline em modais)
- Localizado em pt-BR

Usado em vigências de períodos e data de atividade.

### `TurmaFilterBar` — `components/turmas/turma-filter-bar.tsx`

5 selects (disciplina, ensino, turno, ano, escola) + botão "Limpar filtros". Estado em URL search params. Reutilizado em `/turmas`, `/notas`, `/analise-turma`.

### Comboboxes (Popover + cmdk)

Padrão usado em vários lugares:

- **Disciplina** (`nova-turma-button.tsx`) — busca dentro de grupos por área
- **Escola** (`nova-turma-button.tsx`) — sugere escolas existentes + "Criar 'X'" inline
- **Turma + Aluno** (`dashboard-aluno/turma-aluno-filtros.tsx`) — busca por série, disciplina, escola, nome
- **Escola + Turma + Atividade** (`dashboard-atividade/filtros-bar.tsx`) — drill-down 3-níveis

Comum em todos:
- `Popover` com `align="start"` e `z-[10000]` (acima de Dialogs)
- `Command` do `cmdk` com filtro custom `stripDiacritics` (ignora acentos)
- `CommandList` com `max-h-72`, scroll oculto, `onWheel`/`onTouchMove` `stopPropagation` (evita Dialog/Popover do Radix interceptar scroll)

---

## 8. Padrões de feedback

### Modais (AlertDialog)

Usado para erros e sucessos críticos de auth. Conteúdo explica + único botão "OK".

### Toasts

Usado em CRUD comum (criar/editar/excluir entidades). Não bloqueia UI.

### Forms

- **`mode: "onSubmit"`** + **`reValidateMode: "onSubmit"`** em todos os forms (React Hook Form)
- Não valida enquanto digita — só no submit ou após o primeiro submit
- Modais resetam estado quando fecham:
  - "Novo X": `reset()` (volta aos defaults vazios)
  - "Editar X": `reset(initialValues)` (volta aos valores originais da entidade)

### Botão "Salvo"

Padrão usado no modal de editar grupo (`grupos-button.tsx`):
- Após save bem-sucedido, botão vira `outline` com texto **"Salvo"** + ícone ✓ — não fecha o modal
- Editar qualquer campo reverte pra "Salvar" cheio (sinaliza mudança não-salva)
- Útil quando o modal tem múltiplos saves separados (notas individuais, nota do grupo, etc)

### Loading

- `Loader2` (lucide) com `animate-spin` em botões durante submit
- `LayoutLoader` em transições de página (skeleton/spinner do template)

---

## 9. Z-index conhecidos

Pontos onde tivemos que afinar empilhamento:

- `SelectContent` (shadcn) bumpado para `z-[10000]` — acima de `DialogContent`
- `PopoverContent` (comboboxes) também `z-[10000]`
- Flatpickr calendar `z-[10001]` + `static: true` para renderizar inline dentro de modais
- Theme customizer trigger oculto via `hidden`

---

## 10. Arquivos relacionados

### Tema e branding

- `config/site.ts` — defaults
- `config/thems.ts` — definições dos temas
- `app/assets/scss/globals.scss` — escala HSL primary + keyframes
- `app/assets/scss/theme.scss` — classes `.theme-{name}`
- `provider/providers.tsx` — aplica classe no body
- `store/index.ts` — Zustand store (theme + sidebar)

### Layout

- `app/(auth)/layout.tsx` — split diagonal
- `app/(dashboard)/layout.tsx` — wrapper
- `provider/dashboard.layout.provider.tsx` — providers + branches por tipo de layout

### Componentes globais

- `components/site-logo.tsx` — logo com detecção CSS (auto/light/dark)
- `components/ui/initials-avatar.tsx` — avatar de iniciais
- `components/ui/masked-date-picker.tsx` — input de data com máscara
- `components/turmas/turma-filter-bar.tsx` — filterbar reutilizável
- `components/partials/header/index.tsx` — navbar
- `components/partials/header/page-title.tsx` — título centralizado
- `components/partials/header/profile-info.tsx` — dropdown de perfil
- `components/partials/sidebar/popover/index.tsx` — sidebar default
- `components/partials/sidebar/common/logo.tsx` — logo da sidebar
- `components/partials/customizer/theme-customizer.tsx` — customizer (oculto)
