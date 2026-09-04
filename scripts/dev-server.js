// scripts/dev-server.js — roda o site localmente igual à Vercel:
// arquivos estáticos na raiz + serverless functions em /api.
//
// Uso: npm run dev   →   http://localhost:3000

require('./db'); // carrega .env.local em process.env

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const RAIZ = path.join(__dirname, '..');
const PORTA = Number(process.env.PORT) || 3000;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.ico': 'image/x-icon'
};

function lerCorpo(req) {
    return new Promise((resolve, reject) => {
        const partes = [];
        req.on('data', c => partes.push(c));
        req.on('end', () => resolve(Buffer.concat(partes)));
        req.on('error', reject);
    });
}

// Reproduz o que a Vercel injeta em req/res antes de chamar o handler.
async function rodarFunction(handler, req, res, url) {
    req.query = Object.fromEntries(url.searchParams);

    const bruto = await lerCorpo(req);
    if (bruto.length && (req.headers['content-type'] || '').includes('application/json')) {
        try { req.body = JSON.parse(bruto.toString('utf8')); } catch (e) { req.body = {}; }
    }

    res.status = code => { res.statusCode = code; return res; };
    res.send = corpo => { res.end(corpo); return res; };

    await handler(req, res);
}

const servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORTA}`);
    let caminho = decodeURIComponent(url.pathname);

    // ── /api/* → serverless function ─────────────────────────
    if (caminho.startsWith('/api/')) {
        const nome = caminho.slice(5).replace(/\/$/, '');
        const arquivo = path.join(RAIZ, 'api', nome + '.js');

        if (!arquivo.startsWith(path.join(RAIZ, 'api')) || !fs.existsSync(arquivo)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: { message: 'Rota não encontrada' } }));
        }

        try {
            delete require.cache[require.resolve(arquivo)];   // recarrega a cada request
            await rodarFunction(require(arquivo), req, res, url);
        } catch (e) {
            console.error(e);
            if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: e.message } }));
        }
        return;
    }

    // ── estáticos ────────────────────────────────────────────
    if (caminho === '/') caminho = '/index.html';

    const arquivo = path.join(RAIZ, caminho);
    if (!arquivo.startsWith(RAIZ) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404');
    }

    res.writeHead(200, { 'Content-Type': MIME[path.extname(arquivo).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(arquivo).pipe(res);
});

servidor.listen(PORTA, () => {
    console.log(`Villa Serena rodando em http://localhost:${PORTA}`);
    console.log(`API em http://localhost:${PORTA}/api/imoveis`);
});
