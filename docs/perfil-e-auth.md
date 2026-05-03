# Perfil e autenticação

Cobre login/signup, sessão e a página `/perfil`.

> Última atualização: 2026-05-03

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

- Email único, normalizado em lowercase + trim antes de salvar
- Senha mínima de 8 caracteres. Sem exigência de complexidade
- Sem verificação de email no signup (TODO quando houver SMTP)
- Logout (`signOut({ callbackUrl: "/login" })`) volta para `/login`

### Middleware

`middleware.ts` protege todas as rotas dentro de `(dashboard)` e o `app/api`. Sem sessão → redirect para `/login`.

### Callbacks (`lib/auth.ts`)

```ts
async jwt({ token, user }) {
  if (user) token.id = user.id;
  return token;
}
async session({ session, token }) {
  if (session.user && token.id) {
    session.user.id = token.id;
  }
  return session;
}
```

Simples — só propaga `professorId` via JWT para uso server-side em `getProfessorIdOrThrow()`.

---

## 2. Avatar

**Não há upload.** O avatar é gerado a partir das **iniciais do nome**, com fundo na cor primária do sistema (teal).

### Componente `InitialsAvatar`

`components/ui/initials-avatar.tsx`:

```tsx
<InitialsAvatar name="Ian Vitorino" className="h-10 w-10 text-sm" />
// → círculo teal com "IV"
```

Regras pra extrair iniciais:
- Trim + split por whitespace
- 0 palavras → `?`
- 1 palavra → primeira letra (ex: "Ian" → "I")
- 2+ palavras → primeira letra do primeiro nome + primeira letra da última palavra (ex: "Ian Vitorino" → "IV", "Ian da Silva Vitorino" → "IV")
- Sempre uppercase

Reutilizado em:
- Tela `/perfil` (120×120 px)
- Header — trigger do dropdown (36×36 px)
- Header — dentro do dropdown (40×40 px)

### Por que iniciais e não foto?

- Simplicidade: zero infra de storage, zero UI de upload, zero validação de imagem
- Visualmente consistente: todos os usuários do sistema têm avatar imediato
- Decisão registrada em 2026-05-02

---

## 3. Tela `/perfil`

```
/perfil → mostra avatar (iniciais) + dados + total de turmas
```

Estrutura:
- Card com `<InitialsAvatar size 120>`
- Nome
- Email
- Total de turmas (cor primária + label)

Sem campos editáveis no momento. Pode ganhar trocar nome / trocar senha futuramente.

---

## 4. Header — dropdown de perfil

`components/partials/header/profile-info.tsx`:

- Avatar do trigger usa `InitialsAvatar` lendo `session.user.name`
- Loading state: bolinha pulsante com `bg-primary/30 animate-pulse`
- Dropdown:
  - Header com avatar + nome + email
  - **Meu perfil** (link → `/perfil`)
  - **Sair** (`signOut`)

---

## 5. Server actions

`actions/auth.ts`:

```ts
createAccount({ nome, email, password }): Promise<SignupResult>
```

Valida (Zod), hash bcrypt, cria `Professor`. Não verifica email.

`actions/perfil.ts`:

```ts
getMeuPerfil(): Promise<{
  id, nome, email, createdAt, totalTurmas
}>
```

Faz `Promise.all([findUniqueOrThrow, count])` e retorna o agregado. Sem foto, sem upload.

---

## 6. Decisões de design

- **JWT só carrega `id`** — não precisa propagar mais nada porque o avatar é puramente derivado do nome
- **Sem upload** — escolha consciente após avaliar custo/benefício do feature
- **Iniciais reutilizáveis** — mesmo padrão visual em qualquer lugar que mostre avatar

---

## 7. Arquivos relacionados

- `lib/auth.ts` — config NextAuth + callbacks JWT/session
- `lib/session.ts` — `getProfessorIdOrThrow()`
- `app/api/auth/[...nextauth]/route.ts` — handler
- `middleware.ts` — proteção de rotas
- `app/(auth)/{login,signup}/page.tsx` — telas
- `components/auth/{login-form,register-form}.tsx` — forms
- `app/(dashboard)/perfil/page.tsx` — tela de perfil
- `components/ui/initials-avatar.tsx` — avatar de iniciais
- `components/partials/header/profile-info.tsx` — dropdown do header
- `actions/{auth,perfil}.ts` — server actions
