// api/auth.js — confere o token do painel antes de liberar a tela do admin.
//
//   GET /api/auth  com header x-admin-token  →  200 { data: { ok: true } }

const { json, erro, autorizado, handler } = require('./_lib');

module.exports = handler(async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return erro(res, 405, `Método ${req.method} não suportado.`);
    }

    if (!process.env.ADMIN_TOKEN) {
        return erro(res, 500, 'ADMIN_TOKEN não configurado na Vercel.');
    }

    if (!autorizado(req)) return erro(res, 401, 'Senha incorreta.');

    json(res, 200, { data: { ok: true } });
});
