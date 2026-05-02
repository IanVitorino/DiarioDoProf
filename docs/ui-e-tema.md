# UI e tema

Cobre layout, branding, tema teal customizado, sidebar/navbar, animações e padrões de feedback.

> Última atualização: 2026-05-02

---

## 1. Branding

- **Nome:** Diário Do Prof
- **Logo:** ícone (livro aberto + check verde) em `public/logo/`. Variantes:
  - `Logo_dark.png` / `Logo_white.png` — versão ícone (com texto da marca embutido)
  - `Full_logo_dark.png` / `Full_logo_white.png` — versão horizontal (futura)
- Renderizado via `components/site-logo.tsx` com prop `mode="auto"|"dark"|"light"`.

---

## 2. Tema

### Cor primária

Teal customizado:

- HSL: `174 64% 21%`
- Aproximadamente `#147060`
- Inspirado na cor do logo

### Onde está aplicado

- **`config/site.ts`** — `theme: "teal"`
- **`config/thems.ts`** — entrada `"teal"` com `cssVars.light/dark.primary` e `activeColor` (mostra no customizer)
- **`app/assets/scss/globals.scss`** — escala `--primary-50` até `--primary-900` em HSL
- **`app/assets/scss/theme.scss`** — classes `.theme-teal` e `.dark .theme-teal` que sobrescrevem `--primary` e `--ring`

### Como é aplicado em runtime

1. `config/site.ts` define o tema default (`"teal"`).
2. `store/index.ts` (Zustand) persiste no localStorage com `version: 2` + `migrate` que **força** `theme = siteConfig.theme` (evita cache antigo do template).
3. `provider/providers.tsx` aplica `theme-{name}` como classe no `<body>`.
4. As CSS vars do tema substituem os valores default → componentes shadcn/ui pegam automaticamente.

### Theme customizer (gear icon)

Componente `components/partials/customizer/theme-customizer.tsx` mantém todo o template original (troca de tema, layout, sidebar style, etc), mas o **trigger está oculto** com `className="hidden"` (decisão: usuário final não troca tema). Pode ser reativado removendo a classe se quiser dev tooling.

---

## 3. Layout

### Default

- **Layout:** `semibox` (sidebar flutuando com `m-6 rounded-md`)
- **Sidebar type:** `popover` (deriva automaticamente do layout semibox)
- **Navbar type:** `sticky`
- Configurado em `config/site.ts`

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
    └── perfil/
```

### Layout (auth) — split diagonal

`app/(auth)/layout.tsx`:

- Lado esquerdo branco (form)
- Lado direito teal-800 (logo + tagline + 3 features)
- Divisão por `clip-path: polygon(25% 0, 100% 0, 100% 100%, 0 100%)` no painel da direita — inclinada para a direita
- Logo no topo escondendo o subtítulo embutido (mask div sobre os 18% de baixo)

### Layout (dashboard) — semibox

`provider/dashboard.layout.provider.tsx`:

- Sidebar fixa à esquerda (272px expandida, 72px colapsada)
- Navbar sticky no topo, com margem que acompanha a sidebar
- Conteúdo principal dentro de `semibox-content-wrapper`
- Tudo com transições suaves (ver seção 6)

---

## 4. Sidebar

### Comportamento

- **Toggle** via botão hamburger na navbar (`MenuBar` em `vertical-header.tsx`)
- Estado em `useSidebar` (Zustand persistido)
- 4 tipos suportados (`module`, `popover`, `classic`, mobile) — usamos **popover** por padrão (semibox)

### Conteúdo (`config/menus.ts`)

Sidebar `classic` (usada também pelo `popover` no semibox):

```
CADASTROS
  ├ Turmas         (ícone: Users)
  └ Notas          (ícone: ClipboardList)
DADOS
  ├ Análise da turma  (ícone: BarChart3)
  └ Dashboard aluno   (ícone: UserCircle)
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
- **Título do módulo** centralizado (`PageTitle` — resolve via `usePathname()`)
- **Ferramentas (direita):**
  - Fullscreen
  - Theme toggle (dark/light)
  - Profile dropdown (avatar + Meu perfil + Sair)

### Removidos do template original

- Search field
- Inbox/mailbox
- Notification message

### `PageTitle`

`components/partials/header/page-title.tsx` — client component que mapeia `pathname` para um título humano:

| Rota | Título |
|---|---|
| `/turmas*` | Turmas |
| `/notas*` | Notas |
| `/analise-turma*` | Análise da turma |
| `/dashboard-aluno*` | Dashboard aluno |
| `/perfil*` | Meu perfil |

Centralizado com `absolute left-1/2 -translate-x-1/2`, `pointer-events-none`, `hidden md:block` (mobile esconde).

---

## 6. Animações

### Sidebar abrir/fechar

- **Sidebar wrapper:** `transition-[width] duration-300 ease-in-out`
- **Content wrapper:** `transition-[margin] duration-300 ease-in-out`
- **Logo:** wrapper com `transition-[height,width,margin] duration-300 ease-in-out`

Tudo com mesma duração e easing — sensação de movimento único.

### Histórico de iteração

- Inicialmente sidebar "teletransportava" (sem transição)
- Adicionada transição na sidebar e content-wrapper
- Logo animou width/height — gerou sensação de "duas coisas mexendo ao mesmo tempo"
- Removida animação da logo
- User pediu animação de tamanho da logo de volta
- Bug: logo crescia mas não diminuía com animação (problema com `next/image` controlando tamanho via classes)
- **Solução:** wrapper `<div>` controla tamanho, `<Image>` dentro com `h-full w-full`

---

## 7. Padrões de feedback

### Modais (AlertDialog)

Usado para erros e sucessos críticos de auth. Conteúdo explica + único botão "OK" pra fechar.

### Toasts

Usado em CRUD comum (criar/editar/excluir entidades). Não bloqueia UI.

### Forms

- **`mode: "onSubmit"`** + **`reValidateMode: "onSubmit"`** em todos os forms (React Hook Form)
- Não valida enquanto o usuário digita — só no submit ou após o primeiro submit
- Reduz "alerta vermelho" enquanto preenche

### Loading

- `Loader2` (lucide) com `animate-spin` em botões durante submit
- `LayoutLoader` em transições de página (skeleton ou spinner do template)

---

## 8. Z-index conhecidos

Pontos onde tivemos que afinar empilhamento:

- `SelectContent` (shadcn) bumpado para `z-[10000]` — acima de `DialogContent`
- Flatpickr calendar `z-[10001]` + `static: true` para renderizar inline dentro de modais
- Theme customizer trigger oculto via `hidden` (era `z-50`)

---

## 9. Arquivos relacionados

### Tema e branding

- `config/site.ts` — defaults
- `config/thems.ts` — definições dos temas
- `app/assets/scss/globals.scss` — escala HSL primary
- `app/assets/scss/theme.scss` — classes `.theme-{name}`
- `provider/providers.tsx` — aplica classe no body
- `store/index.ts` — Zustand store (theme + sidebar)

### Layout

- `app/(auth)/layout.tsx` — split diagonal
- `app/(dashboard)/layout.tsx` — wrapper
- `provider/dashboard.layout.provider.tsx` — providers + branches por tipo de layout

### Componentes globais

- `components/site-logo.tsx` — logo theme-aware
- `components/partials/header/index.tsx` — navbar
- `components/partials/header/page-title.tsx` — título centralizado
- `components/partials/header/profile-info.tsx` — dropdown de perfil
- `components/partials/sidebar/popover/index.tsx` — sidebar default
- `components/partials/sidebar/common/logo.tsx` — logo da sidebar
- `components/partials/customizer/theme-customizer.tsx` — customizer (oculto)
