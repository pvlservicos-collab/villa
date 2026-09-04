// scripts/setup-db.js — cria o schema no Neon (idempotente).
// Uso: node scripts/setup-db.js

const { sql } = require('./db');

const statements = [
    `CREATE TABLE IF NOT EXISTS imoveis (
        id               SERIAL PRIMARY KEY,
        nome             TEXT NOT NULL,
        localizacao      TEXT,
        valor            DOUBLE PRECISION,
        tipo             TEXT NOT NULL DEFAULT 'residencial'
                             CHECK (tipo IN ('residencial', 'comercial')),
        descricao        TEXT,
        detalhes         JSONB NOT NULL DEFAULT '{}'::jsonb,
        caracteristicas  JSONB NOT NULL DEFAULT '[]'::jsonb,
        imagens          JSONB NOT NULL DEFAULT '[]'::jsonb,
        ativo            BOOLEAN NOT NULL DEFAULT TRUE,
        slug             TEXT UNIQUE,
        datacriacao      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        dataatualizacao  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    `CREATE INDEX IF NOT EXISTS imoveis_ativo_data_idx
        ON imoveis (ativo, datacriacao DESC)`,

    `CREATE INDEX IF NOT EXISTS imoveis_slug_idx ON imoveis (slug)`,

    `CREATE TABLE IF NOT EXISTS perfil (
        id          INTEGER PRIMARY KEY,
        nome        TEXT,
        cargo       TEXT,
        whatsapp    TEXT,
        foto_url    TEXT,
        avaliacoes  INTEGER DEFAULT 0,
        estrelas    DOUBLE PRECISION DEFAULT 5.0
    )`,

    `INSERT INTO perfil (id, nome, cargo, whatsapp, foto_url, avaliacoes, estrelas)
     VALUES (1, 'Victoria Sterling', 'Diretora de Vendas Premium',
             '5592961268651', 'img/vendedora.png', 0, 5.0)
     ON CONFLICT (id) DO NOTHING`
];

(async () => {
    for (const stmt of statements) {
        const rotulo = stmt.trim().split('\n')[0].slice(0, 60);
        await sql.query(stmt);
        console.log('OK  ' + rotulo);
    }

    const [{ count: imoveis }] = await sql`SELECT COUNT(*)::int AS count FROM imoveis`;
    const [{ count: perfis }] = await sql`SELECT COUNT(*)::int AS count FROM perfil`;
    console.log(`\nSchema pronto. imoveis: ${imoveis} registro(s), perfil: ${perfis} registro(s).`);
})().catch(e => {
    console.error('Falhou:', e.message || e);
    process.exit(1);
});
