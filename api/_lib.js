// api/_lib.js — helpers compartilhados pelas serverless functions da Vercel.

const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL nao configurada nas variaveis de ambiente.');
}

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

function json(res, status, body) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(status).send(JSON.stringify(body));
}

function erro(res, status, mensagem) {
    json(res, status, { error: { message: mensagem } });
}

// Escritas exigem o header x-admin-token conferindo com ADMIN_TOKEN.
function autorizado(req) {
    const esperado = process.env.ADMIN_TOKEN;
    if (!esperado) return false;
    return req.headers['x-admin-token'] === esperado;
}

// Garante que o handler nao derrube a function com uma excecao solta.
function handler(fn) {
    return async (req, res) => {
        if (!sql) return erro(res, 500, 'Banco nao configurado: defina DATABASE_URL na Vercel.');
        try {
            await fn(req, res);
        } catch (e) {
            console.error(req.method, req.url, e);
            erro(res, 500, e.message || 'Erro interno');
        }
    };
}

// Colunas gravaveis em `imoveis` — qualquer outra chave do body e ignorada.
const COLUNAS_IMOVEL = {
    nome: 'text',
    localizacao: 'text',
    valor: 'number',
    tipo: 'text',
    descricao: 'text',
    detalhes: 'json',
    caracteristicas: 'json',
    imagens: 'json',
    ativo: 'bool',
    slug: 'text',
    datacriacao: 'text',
    dataatualizacao: 'text'
};

// Monta lista de colunas/valores a partir do body, respeitando o whitelist.
function camposImovel(body) {
    const colunas = [];
    const valores = [];

    for (const [coluna, tipo] of Object.entries(COLUNAS_IMOVEL)) {
        if (!(coluna in body)) continue;
        let v = body[coluna];
        if (tipo === 'json') v = JSON.stringify(v ?? (coluna === 'detalhes' ? {} : []));
        if (tipo === 'number') v = v === '' || v === null ? null : Number(v);
        if (tipo === 'bool') v = Boolean(v);
        colunas.push(coluna);
        valores.push(v);
    }

    return { colunas, valores };
}

// Placeholder com cast explicito para as colunas jsonb.
function placeholder(coluna, indice) {
    const cast = COLUNAS_IMOVEL[coluna] === 'json' ? '::jsonb' : '';
    return `$${indice}${cast}`;
}

module.exports = { sql, json, erro, autorizado, handler, camposImovel, placeholder };
