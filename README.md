# villa

Site institucional da **Villa Serena** — imobiliária de alto padrão em Manaus.

Site estático + serverless functions na Vercel, com os dados em **Postgres (Neon)**.

## Arquitetura

```
navegador  →  js/db-client.js  →  /api/*  →  Neon Postgres
              (shim de dados)     (serverless)
```

O navegador **nunca** vê a string de conexão do banco: ela fica só na variável de
ambiente `DATABASE_URL`, lida pelas functions em [api/](api/). O arquivo
[js/db-client.js](js/db-client.js) expõe uma interface igual à do supabase-js
(`.from().select().eq()`, `.insert()`, `.storage`), então `app.js`, `imovel.js`,
`admin.js` e `resultados.html` seguem inalterados.

## Estrutura

| Arquivo | Descrição |
|---|---|
| `index.html` | Home: hero, busca e vitrine de imóveis |
| `imoveis.html` | Listagem completa |
| `resultados.html` | Resultados da busca com filtros |
| `imovel.html` | Detalhe do imóvel (galeria, specs, vídeo) |
| `admin.html` | Painel de cadastro/edição (protegido por senha) |
| `api/imoveis.js` | CRUD dos imóveis |
| `api/perfil.js` | Dados do corretor |
| `api/upload.js` | Upload de fotos para o Vercel Blob |
| `api/auth.js` | Confere a senha do painel |
| `js/db-client.js` | Cliente de dados do navegador |
| `js/admin-auth.js` | Tela de senha do painel |
| `scripts/setup-db.js` | Cria o schema no Neon |
| `scripts/seed.js` | Cadastra imóveis de teste |
| `scripts/dev-server.js` | Servidor local (estáticos + `/api`) |

## Variáveis de ambiente

| Variável | Onde | Para quê |
|---|---|---|
| `DATABASE_URL` | Vercel + `.env.local` | String de conexão do Neon |
| `ADMIN_TOKEN` | Vercel + `.env.local` | Senha do painel `admin.html` |
| `BLOB_READ_WRITE_TOKEN` | Vercel (automática) | Upload de fotos; criada ao ligar um Blob Store |

`.env.local` está no `.gitignore` — nenhuma credencial vai para o repositório.

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # e preencha DATABASE_URL e ADMIN_TOKEN
npm run dev                        # http://localhost:3000
```

## Banco

```bash
npm run db:setup   # cria as tabelas (idempotente)
npm run db:seed    # 10 imóveis de teste; --reset zera antes
```

### Tabela `imoveis`

- `nome`, `localizacao`, `valor`, `descricao`, `slug` (único)
- `tipo` — `residencial` | `comercial` (CHECK constraint)
- `detalhes` (jsonb) — `subtipo` (`casa`, `apartamento`, `terreno`, `sala`, `mansao`),
  `negocio` (`À Venda`, `Para Alugar`, `Temporada`), `quartos`, `banheiros`,
  `areaConstruida`, `tamanhoTerreno`, `video_url`
- `caracteristicas` (jsonb) — comodidades premium
- `imagens` (jsonb) — URLs das fotos
- `ativo` (bool), `datacriacao`, `dataatualizacao`

### Tabela `perfil`

Registro único (`id = 1`) com `nome`, `cargo`, `whatsapp`, `foto_url`,
`avaliacoes` e `estrelas` do corretor exibido na página do imóvel.

## Deploy na Vercel

Em produção: **https://villa-ten-lake.vercel.app** (projeto `villa`).

Não há build step — os estáticos saem da raiz e o que estiver em `api/` vira
serverless function. `DATABASE_URL`, `ADMIN_TOKEN` e `BLOB_READ_WRITE_TOKEN` já
estão cadastradas em Production e Development; Preview ainda não tem `ADMIN_TOKEN`
(a CLI exige escolher a branch num prompt interativo), então deploys de branch não
abrem o painel até cadastrar pelo dashboard.

Variável nova só vale no próximo deploy: `vercel redeploy <url-do-deploy>`.

> `vercel env pull` traz `ADMIN_TOKEN=""` de Production — a Vercel não devolve o
> valor de variáveis sensíveis. Preencha à mão no `.env.local` depois de puxar,
> senão o painel local para de abrir.

## API

Leitura é pública; escrita exige o header `x-admin-token`.

| Método | Rota | Auth |
|---|---|---|
| `GET` | `/api/imoveis` — aceita `?id=`, `?slug=`, `?ativo=true`, `?neq_id=`, `?limit=` | — |
| `POST` | `/api/imoveis` | sim |
| `PATCH` | `/api/imoveis?id=` | sim |
| `DELETE` | `/api/imoveis?id=` | sim |
| `GET` | `/api/perfil` | — |
| `PUT` | `/api/perfil` | sim |
| `POST` | `/api/upload` | sim |
| `GET` | `/api/auth` | sim |

Fotos enviadas pelo painel são reduzidas para no máximo 1920px e recomprimidas em
JPEG no próprio navegador antes de subir, para caber no limite de corpo de
requisição da Vercel.
