# Setup local

Como subir o projeto do zero numa máquina nova.

> Última atualização: 2026-05-03

---

## 1. Pré-requisitos

- **Node.js 18+** (testado com v20)
- **PostgreSQL 14+** (rodando local em `localhost:5432`)
- **npm** ou compatível

Versões batem com `package.json` e `prisma/schema.prisma`.

---

## 2. Clonar e instalar

```bash
git clone <url-do-repo> diariodoprof
cd diariodoprof
npm install
```

---

## 3. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz com:

```env
# Conexão com o Postgres local. Database tem que existir antes do migrate.
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/diariodoprof"

# Segredo do NextAuth (qualquer string aleatória forte)
AUTH_SECRET="<gere-uma-string-aleatoria-de-32-caracteres>"
NEXTAUTH_URL="http://localhost:4685"
```

> Pra gerar `AUTH_SECRET`: `openssl rand -base64 32` ou qualquer gerador de senha de 32+ chars.

### Banco no Postgres

Antes de migrar, crie o banco:

```bash
psql -U postgres -c "CREATE DATABASE diariodoprof;"
```

(ou via pgAdmin, DBeaver, etc.)

---

## 4. Migrations e cliente Prisma

```bash
npx prisma migrate deploy
npx prisma generate
```

- `migrate deploy` aplica todas as migrations em `prisma/migrations/` (15 ao todo na data dessa doc)
- `generate` regenera o cliente Prisma em `lib/generated/prisma`

> Não use `migrate dev` se o shell não for interativo (Powershell em alguns contextos trava). `migrate deploy` é o caminho seguro pra ambientes não-interativos.

---

## 5. Rodar o dev server

```bash
npm run dev
```

App sobe em **http://localhost:4685** (porta customizada — veja `package.json`).

> O `npm run build` também roda `prisma migrate deploy` antes do `next build` (definido em `package.json`).

---

## 6. Criar primeiro usuário

Não há comando CLI — basta acessar `/signup` no browser e criar uma conta:

- Nome
- Email
- Senha (≥ 8 caracteres)

Auto-login redireciona pra `/turmas`. A partir daí o fluxo da aplicação está documentado em `parametros.md`.

---

## 7. Scripts de seed (opcional, dev only)

Ficam em `scripts/` e populam dados pra testes/demo. Rodam com **tsx**:

```bash
npx tsx scripts/seed-ian.ts          # cria 3 turmas com alunos e atividades
npx tsx scripts/seed-notas.ts        # popula notas em todas as atividades existentes
npx tsx scripts/seed-datas-atividades.ts  # ajusta datas das atividades
npx tsx scripts/seed-turma-grupos.ts # adiciona uma turma com atividades em grupo (3º C · Geografia)
```

> Cada script tem `PROFESSOR_ID` hardcoded apontando pra um professor específico. **Edite essa constante** se quiser usar outro professor (ou execute uma query `SELECT id FROM "Professor" WHERE email='...'` pra pegar o id).

### Scripts utilitários

```bash
npx tsx scripts/logos-novas.ts        # processa logos (sharp)
npx tsx scripts/logos-transparent.ts  # remove fundo dos logos
```

Não precisa rodar esses normalmente — só quando trocar arquivos de logo.

---

## 8. Estrutura do projeto

```
DiárioDoProf/
├── app/                 → Next.js App Router (rotas)
│   ├── (auth)/          → /login, /signup
│   └── (dashboard)/     → área protegida
├── actions/             → server actions
├── components/          → UI
├── lib/                 → prisma, auth, helpers
├── prisma/              → schema + migrations
├── provider/            → providers (theme, layout, auth)
├── public/              → estáticos (logos, ícones)
├── scripts/             → seeds e utilitários
└── docs/                → documentação (esta pasta)
```

Mais detalhes em `README.md`.

---

## 9. Comandos comuns

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe dev server na porta 4685 |
| `npm run build` | Roda migrations + build de produção |
| `npm run start` | Sobe versão de produção (porta 4685) |
| `npx prisma migrate deploy` | Aplica migrations pendentes |
| `npx prisma generate` | Regenera Prisma client |
| `npx prisma studio` | Abre UI gráfica do Postgres (porta 5555) |

---

## 10. Troubleshooting

### "Cannot find module 'lib/generated/prisma'"
Rode `npx prisma generate`. O cliente é gerado em `lib/generated/prisma/`.

### "Database does not exist"
Crie o database no Postgres antes de rodar `migrate deploy` (ver passo 3).

### Erro de migration ao rodar `migrate dev`
Use `migrate deploy` — funciona em ambientes não-interativos.

### Cliente Prisma cacheado após mudança no schema
Reinicie o dev server (`Ctrl+C` e `npm run dev` de novo). O singleton do Prisma fica em memória.

### Porta 4685 ocupada
Edite `package.json` e troque o `-p 4685` pro número que quiser.

---

## 11. Deploy

Hoje só roda local. Plano de deploy:
- VPS própria (não Vercel)
- Storage de avatar não aplica (sistema usa só iniciais — ver `perfil-e-auth.md`)
- Postgres gerenciado ou self-hosted

Sem instruções formais ainda — adicionar quando o primeiro deploy acontecer.
