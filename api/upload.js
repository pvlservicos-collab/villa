// api/upload.js — recebe uma imagem em base64 e grava no Vercel Blob.
//
//   POST /api/upload   (x-admin-token)
//   body: { path: 'imoveis/foto.jpg', contentType: 'image/jpeg', dataBase64: '...' }
//   resposta: { data: { url } }
//
// Requer um Blob Store ligado ao projeto na Vercel (env BLOB_READ_WRITE_TOKEN,
// injetada automaticamente). Sem ele, o painel continua aceitando URLs coladas
// à mão no campo de imagens.

const { json, erro, autorizado, handler } = require('./_lib');

const LIMITE_BYTES = 4 * 1024 * 1024;

module.exports = handler(async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return erro(res, 405, `Método ${req.method} não suportado.`);
    }

    if (!autorizado(req)) return erro(res, 401, 'Não autorizado.');

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return erro(res, 501,
            'Upload indisponível: nenhum Blob Store ligado ao projeto na Vercel. ' +
            'Cole a URL da imagem no campo de texto, ou crie o store em Storage > Blob.');
    }

    const { path, contentType, dataBase64 } = req.body || {};
    if (!path || !dataBase64) return erro(res, 400, 'Informe "path" e "dataBase64".');

    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length === 0) return erro(res, 400, 'Arquivo vazio.');
    if (buffer.length > LIMITE_BYTES) {
        return erro(res, 413, 'Imagem maior que 4 MB depois da compressão.');
    }

    const { put } = require('@vercel/blob');
    const blob = await put(path, buffer, {
        access: 'public',
        contentType: contentType || 'application/octet-stream',
        addRandomSuffix: true
    });

    json(res, 200, { data: { url: blob.url } });
});
