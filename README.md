# villa

Site institucional da **Villa Serena** — imobiliária de alto padrão em Manaus.

## Estrutura

| Arquivo | Descrição |
|---|---|
| `index.html` | Home: hero, busca e vitrine de imóveis em destaque |
| `imoveis.html` | Listagem completa de imóveis |
| `resultados.html` | Página de resultados da busca/filtros |
| `imovel.html` | Página de detalhe de um imóvel (galeria, specs, vídeo) |
| `admin.html` | Painel administrativo para cadastrar/editar imóveis |
| `js/supabase-config.js` | Credenciais e client do Supabase |
| `js/app.js` | Renderização dos cards e filtros do site |
| `js/imovel.js` | Lógica da página de detalhe |
| `js/admin.js` | CRUD do painel administrativo + upload de imagens |
| `scratch/` | Scripts utilitários (seed e checagem de dados) |

## Backend

Os imóveis ficam na tabela `imoveis` do Supabase e as fotos no bucket `imoveis`.

Campos principais da tabela:

- `nome`, `localizacao`, `valor`, `descricao`, `slug`
- `tipo` — `residencial` | `comercial` (CHECK constraint)
- `detalhes` (jsonb) — `subtipo` (`casa`, `apartamento`, `terreno`, `sala`, `mansao`),
  `negocio` (`À Venda`, `Para Alugar`, `Temporada`), `quartos`, `banheiros`,
  `areaConstruida`, `tamanhoTerreno`, `video_url`
- `caracteristicas` (array) — comodidades premium
- `imagens` (array) — URLs das fotos
- `ativo` (bool), `datacriacao`, `dataatualizacao`

## Rodando localmente

É um site estático. Basta servir a pasta:

```bash
npx serve .
```

E abrir `http://localhost:3000`.

## Seed de imóveis de teste

```bash
node scratch/seed_teste.js
```

Cadastra 10 imóveis cobrindo todos os subtipos e finalidades. As credenciais são
lidas de `js/supabase-config.js`.
