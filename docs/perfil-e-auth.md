# Perfil e autenticação

Cobre login/signup, sessão, página `/perfil` e upload de avatar.

> Última atualização: 2026-05-02

---

## 1. Autenticação

### Stack

- **NextAuth v4** com `CredentialsProvider`
- **JWT** em cookie httpOnly (sem session no banco)
- **bcrypt** (10 rounds) para hash de senha
- Configuração em `lib/auth.ts`, route handler em `app/api/auth/[...nextauth]/route.ts`

### Fluxo

```
/login   ─submit──> NextAuth signIn("credentials") ──> redirect /turmas
/signup  ─submit──> createAccount → auto-signIn → /turmas
```

### Política

- Email único, normalizado em lowercase + trim antes de salvar.
- Senha mínima de 8 caracteres. Sem exigência de complexidade.
- Sem verificação de email no signup (TODO quando houver SMTP).
- Logout (`signOut({ callbackUrl: "/login" })`) volta para `/login`.

### Middleware

`middleware.ts` protege todas as rotas dentro de `(dashboard)` e o `app/api`. Sem sessão → redirect para `/login`.

---

## 2. Sessão e propagação do avatar

### O que vai no JWT

- `token.id` — `professorId`
- `token.picture` — `avatarUrl` do professor (carregado do DB no callback)
- Demais campos default do NextAuth (`name`, `email`, `sub`)

### Callbacks (`lib/auth.ts`)

- **`jwt({ token, user, trigger })`**:
  - No login (`user` presente) carrega `id` e busca `avatarUrl` do banco.
  - Quando `trigger === "update"` (chamado via `session.update()`), refaz a query e atualiza `picture`.
  - Em outras requisições, usa o token cacheado (não consulta DB).

- **`session({ session, token })`**:
  - Expõe `session.user.id` e `session.user.image` (que vem do `token.picture`).

### Por que via JWT?

Evita consulta ao banco em toda requisição. O `update()` força refresh quando o usuário troca a foto — só nesse momento bate no DB.

---

## 3. Tela `/perfil`

```
/perfil → mostra avatar + dados + botão de troca de foto
```

Componentes:

- **`AvatarUpload`** (client) — abre file picker, dispara `uploadAvatar`, mostra spinner + modal de erro.
- **Card** com:
  - Foto (com botão `Camera` sobreposto)
  - Nome
  - Email
  - Total de turmas (cor primária + label)

### Por que mostrar "total de turmas"?

Métrica simples que dá vida à tela. Quando o sistema tiver mais "ações de perfil" (trocar senha, exportar dados, deletar conta), eles entram aqui.

---

## 4. Upload de avatar

### Server action `uploadAvatar(formData)`

`actions/perfil.ts`:

1. Valida que o arquivo existe e é `image/png`, `image/jpeg` ou `image/webp`.
2. Limita tamanho a 5MB.
3. Processa com **sharp**:
   - `.rotate()` — corrige orientação EXIF (foto de celular vinda de iPhone, etc).
   - `.resize(400, 400, { fit: "cover", position: "centre" })` — recorta quadrado.
   - `.jpeg({ quality: 85 })` — saída padronizada em JPEG.
4. Salva em `public/uploads/avatars/<professorId>.jpg` (sobrescreve se existir).
5. Atualiza `Professor.avatarUrl = /uploads/avatars/<id>.jpg?v=<timestamp>` (cachebust).
6. `revalidatePath("/perfil")` e `revalidatePath("/", "layout")` (refresca header).

### Resposta

```ts
{ ok: true; avatarUrl: string }
| { ok: false; error: string }
```

O componente client chama `update()` da `useSession()` após sucesso → JWT é refeito → `session.user.image` atualiza → header reflete a nova foto sem reload.

### Storage

- **Hoje:** filesystem local em `public/uploads/avatars/`. Servido direto pelo Next.
- **Planejado:** S3 quando o projeto for deployado. Vai exigir só trocar a parte de `writeFile` por `s3.putObject` e o `avatarUrl` pra URL absoluta.

### Limites

- Tamanho: 5MB (antes do processamento)
- Formatos aceitos: PNG, JPEG, WebP
- Saída sempre 400×400 JPEG q85 (~30-60KB típico)

---

## 5. Header — exibição do avatar

`components/partials/header/profile-info.tsx`:

- Carrega `session.user.image` (vindo do JWT).
- Se `null`, usa o `avatarPlaceholder` importado do template.
- `unoptimized` no `<Image>` quando o src é string (porque o Next/Image não lida bem com query strings tipo `?v=...`).
- Dropdown:
  - Header com foto + nome + email
  - **Meu perfil** (link → `/perfil`)
  - **Sair** (`signOut`)

---

## 6. Server action

`actions/perfil.ts`:

```ts
getMeuPerfil(): Promise<{
  id, nome, email, avatarUrl, createdAt, totalTurmas
}>

uploadAvatar(formData): Promise<UploadAvatarResult>
```

`actions/auth.ts`:

```ts
createAccount({ nome, email, password }): Promise<SignupResult>
```

---

## 7. Decisões de design

- **JWT carrega `picture`** — evita consulta ao banco a cada request, mas precisa de `update()` explícito após upload.
- **`update()` no client** após upload — força refresh do JWT sem reload completo.
- **Cachebust com `?v=<timestamp>` na URL** — Next.js cacheia imagens estáticas agressivamente; sem isso a foto antiga continuaria aparecendo.
- **Filesystem local primeiro** — simples e funciona em dev. Migrar pra S3 antes do deploy em produção.
- **Sharp pra processar** — orientação EXIF + resize + recompressão garantem arquivo pequeno e padronizado independente do que o usuário envia.

---

## 8. Arquivos relacionados

- `lib/auth.ts` — config NextAuth + callbacks JWT/session
- `lib/session.ts` — `getProfessorIdOrThrow()`
- `app/api/auth/[...nextauth]/route.ts` — handler
- `middleware.ts` — proteção de rotas
- `app/(auth)/{login,signup}/page.tsx` — telas
- `components/auth/{login-form,register-form}.tsx` — forms
- `app/(dashboard)/perfil/page.tsx` — tela de perfil
- `components/perfil/avatar-upload.tsx` — upload client
- `components/partials/header/profile-info.tsx` — dropdown do header
- `actions/{auth,perfil}.ts` — server actions
- `public/uploads/avatars/` — diretório de avatares (gitkeep'd)
