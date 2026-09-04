// api/perfil.js — dados do corretor exibidos na página do imóvel.
//
//   GET /api/perfil   (público)
//   PUT /api/perfil   (x-admin-token) — upsert do registro id = 1

const { sql, json, erro, autorizado, handler } = require('./_lib');

module.exports = handler(async (req, res) => {
    if (req.method === 'GET') {
        const linhas = await sql`SELECT * FROM perfil WHERE id = 1`;
        return json(res, 200, { data: linhas[0] || null });
    }

    if (req.method !== 'PUT' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, PUT');
        return erro(res, 405, `Método ${req.method} não suportado.`);
    }

    if (!autorizado(req)) return erro(res, 401, 'Não autorizado.');

    const b = req.body || {};
    const linhas = await sql`
        INSERT INTO perfil (id, nome, cargo, whatsapp, foto_url, avaliacoes, estrelas)
        VALUES (1, ${b.nome || null}, ${b.cargo || null}, ${b.whatsapp || null},
                ${b.foto_url || null}, ${Number(b.avaliacoes) || 0}, ${Number(b.estrelas) || 5.0})
        ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            cargo = EXCLUDED.cargo,
            whatsapp = EXCLUDED.whatsapp,
            foto_url = EXCLUDED.foto_url,
            avaliacoes = EXCLUDED.avaliacoes,
            estrelas = EXCLUDED.estrelas
        RETURNING *
    `;

    json(res, 200, { data: linhas[0] });
});
