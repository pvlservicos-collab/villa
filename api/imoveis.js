// api/imoveis.js — CRUD da tabela `imoveis`.
//
//   GET    /api/imoveis                 lista tudo (mais recentes primeiro)
//   GET    /api/imoveis?ativo=true      só os publicados
//   GET    /api/imoveis?id=12           um imóvel
//   GET    /api/imoveis?slug=casa-x     por slug
//   GET    /api/imoveis?neq_id=12&limit=3
//   POST   /api/imoveis                 cria            (x-admin-token)
//   PATCH  /api/imoveis?id=12           atualiza        (x-admin-token)
//   DELETE /api/imoveis?id=12           remove          (x-admin-token)

const { sql, json, erro, autorizado, handler, camposImovel, placeholder } = require('./_lib');

async function listar(req, res) {
    const { id, slug, ativo, neq_id, limit, ascending } = req.query;

    const condicoes = [];
    const params = [];

    if (id) { params.push(Number(id)); condicoes.push(`id = $${params.length}`); }
    if (slug) { params.push(slug); condicoes.push(`slug = $${params.length}`); }
    if (neq_id) { params.push(Number(neq_id)); condicoes.push(`id <> $${params.length}`); }
    if (ativo === 'true') condicoes.push('ativo = TRUE');
    if (ativo === 'false') condicoes.push('ativo = FALSE');

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const direcao = ascending === 'true' ? 'ASC' : 'DESC';

    let texto = `SELECT * FROM imoveis ${where} ORDER BY datacriacao ${direcao}, id ${direcao}`;

    if (limit) {
        params.push(Math.min(Number(limit) || 0, 200));
        texto += ` LIMIT $${params.length}`;
    }

    json(res, 200, { data: await sql.query(texto, params) });
}

async function criar(req, res) {
    const body = req.body || {};
    if (!body.nome) return erro(res, 400, 'Campo "nome" é obrigatório.');

    const { colunas, valores } = camposImovel(body);
    const marcadores = colunas.map((c, i) => placeholder(c, i + 1));

    const texto = `INSERT INTO imoveis (${colunas.join(', ')})
                   VALUES (${marcadores.join(', ')})
                   RETURNING *`;

    const linhas = await sql.query(texto, valores);
    json(res, 201, { data: linhas[0] });
}

async function atualizar(req, res) {
    const id = Number(req.query.id);
    if (!id) return erro(res, 400, 'Informe ?id=');

    const { colunas, valores } = camposImovel(req.body || {});
    if (colunas.length === 0) return erro(res, 400, 'Nada para atualizar.');

    const sets = colunas.map((c, i) => `${c} = ${placeholder(c, i + 1)}`);
    valores.push(id);

    const texto = `UPDATE imoveis SET ${sets.join(', ')}
                   WHERE id = $${valores.length}
                   RETURNING *`;

    const linhas = await sql.query(texto, valores);
    if (linhas.length === 0) return erro(res, 404, 'Imóvel não encontrado.');
    json(res, 200, { data: linhas[0] });
}

async function remover(req, res) {
    const id = Number(req.query.id);
    if (!id) return erro(res, 400, 'Informe ?id=');

    const linhas = await sql.query('DELETE FROM imoveis WHERE id = $1 RETURNING id', [id]);
    if (linhas.length === 0) return erro(res, 404, 'Imóvel não encontrado.');
    json(res, 200, { data: linhas[0] });
}

module.exports = handler(async (req, res) => {
    if (req.method === 'GET') return listar(req, res);

    if (!autorizado(req)) return erro(res, 401, 'Não autorizado.');

    if (req.method === 'POST') return criar(req, res);
    if (req.method === 'PATCH' || req.method === 'PUT') return atualizar(req, res);
    if (req.method === 'DELETE') return remover(req, res);

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    erro(res, 405, `Método ${req.method} não suportado.`);
});
