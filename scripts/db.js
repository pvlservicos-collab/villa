// scripts/db.js — conexão compartilhada pelos scripts de linha de comando.
// Lê DATABASE_URL de .env.local (nunca versionado) ou do ambiente.

const fs = require('fs');
const path = require('path');

function carregarEnvLocal() {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) return;

    for (const linha of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const t = linha.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i === -1) continue;
        const chave = t.slice(0, i).trim();
        const valor = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[chave]) process.env[chave] = valor;
    }
}

carregarEnvLocal();

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL nao definida. Crie .env.local com a string do Neon.');
    process.exit(1);
}

const { neon } = require('@neondatabase/serverless');

module.exports = { sql: neon(process.env.DATABASE_URL) };
