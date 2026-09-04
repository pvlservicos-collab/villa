// scratch/seed_teste.js
// Cadastra imóveis de teste cobrindo todos os subtipos e finalidades do painel.
// Uso:  node scratch/seed_teste.js
//       node scratch/seed_teste.js --dry     (só imprime o payload, não envia)

const fs = require('fs');
const path = require('path');

// ── Credenciais lidas de js/supabase-config.js ───────────────
const configPath = path.join(__dirname, '..', 'js', 'supabase-config.js');
const config = fs.readFileSync(configPath, 'utf8');
const supabaseUrl = config.match(/supabaseUrl\s*=\s*'([^']+)'/)[1];
const supabaseKey = config.match(/supabaseKey\s*=\s*'([^']+)'/)[1];
const endpoint = `${supabaseUrl}/rest/v1/imoveis`;

const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
};

// mesma regra do js/admin.js
function gerarSlug(texto) {
    return texto.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const FOTOS = {
    mansao: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
    ],
    casa: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80'
    ],
    apartamento: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
    ],
    terreno: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80'
    ],
    sala: [
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80'
    ]
};

// ── Imóveis de teste ─────────────────────────────────────────
const BASE = [
    {
        nome: 'Mansão Ponta Negra - Vista Rio Negro',
        localizacao: 'Ponta Negra, Manaus - AM',
        valor: 8900000,
        tipo: 'residencial',
        subtipo: 'mansao',
        negocio: 'À Venda',
        descricao: 'Residência de linha exclusiva debruçada sobre o Rio Negro. Pé-direito duplo no living, automação integral, spa privativo e píer próprio. Acabamentos em mármore Calacatta e marcenaria sob medida em todos os ambientes.',
        detalhes: { quartos: 6, banheiros: 8, areaConstruida: 780, tamanhoTerreno: 1400 },
        caracteristicas: ['Piscina', 'Churrasqueira', 'Academia', 'Cozinha Gourmet', 'Suíte Master', 'Closet', 'Jardim'],
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
        nome: 'Mansão Alphaville Manaus - Bosque Privativo',
        localizacao: 'Alphaville 1, Ponta Negra - Manaus',
        valor: 6400000,
        tipo: 'residencial',
        subtipo: 'mansao',
        negocio: 'À Venda',
        descricao: 'Implantação em terreno de esquina voltado para o bosque preservado do condomínio. Quatro suítes com varanda, home theater, adega climatizada e área gourmet com piscina de borda infinita.',
        detalhes: { quartos: 4, banheiros: 6, areaConstruida: 520, tamanhoTerreno: 900 },
        caracteristicas: ['Piscina', 'Churrasqueira', 'Cozinha Gourmet', 'Suíte Master', 'Garagem']
    },
    {
        nome: 'Casa Adrianópolis - Projeto Assinado',
        localizacao: 'Adrianópolis, Manaus - AM',
        valor: 2350000,
        tipo: 'residencial',
        subtipo: 'casa',
        negocio: 'À Venda',
        descricao: 'Casa térrea com partido arquitetônico contemporâneo, integração total entre living e deck. Iluminação natural em todos os ambientes e jardim interno com espelho de água.',
        detalhes: { quartos: 4, banheiros: 4, areaConstruida: 310, tamanhoTerreno: 450 },
        caracteristicas: ['Piscina', 'Jardim', 'Varanda', 'Garagem', 'Cozinha Gourmet']
    },
    {
        nome: 'Casa Condomínio Tarumã - Para Alugar',
        localizacao: 'Tarumã, Manaus - AM',
        valor: 12500,
        tipo: 'residencial',
        subtipo: 'casa',
        negocio: 'Para Alugar',
        descricao: 'Casa mobiliada em condomínio fechado com segurança 24h. Três suítes, área de lazer completa e quintal amplo. Pronta para morar, disponível para locação anual.',
        detalhes: { quartos: 3, banheiros: 4, areaConstruida: 240, tamanhoTerreno: 380 },
        caracteristicas: ['Piscina', 'Churrasqueira', 'Jardim', 'Garagem']
    },
    {
        nome: 'Cobertura Duplex Vieiralves',
        localizacao: 'Nossa Senhora das Graças, Manaus - AM',
        valor: 3200000,
        tipo: 'residencial',
        subtipo: 'apartamento',
        negocio: 'À Venda',
        descricao: 'Cobertura duplex com vista aberta para a cidade. Terraço com piscina aquecida, churrasqueira e lounge coberto. Quatro vagas cobertas e elevador privativo.',
        detalhes: { quartos: 4, banheiros: 5, areaConstruida: 380, tamanhoTerreno: 380 },
        caracteristicas: ['Piscina', 'Churrasqueira', 'Academia', 'Varanda', 'Suíte Master', 'Closet'],
        video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
    },
    {
        nome: 'Apartamento Garden Adrianópolis',
        localizacao: 'Adrianópolis, Manaus - AM',
        valor: 9800,
        tipo: 'residencial',
        subtipo: 'apartamento',
        negocio: 'Para Alugar',
        descricao: 'Unidade garden com quintal privativo de 80m². Planta ampliada, varanda gourmet integrada e infraestrutura de lazer completa no condomínio.',
        detalhes: { quartos: 3, banheiros: 3, areaConstruida: 165, tamanhoTerreno: 245 },
        caracteristicas: ['Jardim', 'Varanda', 'Academia', 'Garagem']
    },
    {
        nome: 'Flat Ponta Negra - Temporada',
        localizacao: 'Ponta Negra, Manaus - AM',
        valor: 650,
        tipo: 'residencial',
        subtipo: 'apartamento',
        negocio: 'Temporada',
        descricao: 'Flat totalmente mobiliado a duas quadras da orla da Ponta Negra. Diária com enxoval, wi-fi e vaga coberta. Ideal para estadias curtas de negócios ou lazer.',
        detalhes: { quartos: 1, banheiros: 1, areaConstruida: 48, tamanhoTerreno: 48 },
        caracteristicas: ['Piscina', 'Academia', 'Varanda']
    },
    {
        nome: 'Terreno Ponta Negra - Frente para o Rio',
        localizacao: 'Ponta Negra, Manaus - AM',
        valor: 4500000,
        tipo: 'residencial',
        subtipo: 'terreno',
        negocio: 'À Venda',
        descricao: 'Lote plano com frente para o Rio Negro em condomínio de alto padrão. Topografia regular, documentação aprovada e liberado para construção imediata.',
        detalhes: { tamanhoTerreno: 1800 },
        caracteristicas: []
    },
    {
        nome: 'Sala Comercial Torre Corporativa Vieiralves',
        localizacao: 'Nossa Senhora das Graças, Manaus - AM',
        valor: 1150000,
        tipo: 'comercial',
        subtipo: 'sala',
        negocio: 'À Venda',
        descricao: 'Laje corporativa em torre AAA com fachada em pele de vidro. Piso elevado, ar-condicionado central VRF, gerador e quatro vagas privativas na garagem.',
        detalhes: { banheiros: 2, areaConstruida: 120, tamanhoTerreno: 120 },
        caracteristicas: ['Garagem', 'Academia']
    },
    {
        nome: 'Sala Comercial Djalma Batista - Para Alugar',
        localizacao: 'Chapada, Manaus - AM',
        valor: 7200,
        tipo: 'comercial',
        subtipo: 'sala',
        negocio: 'Para Alugar',
        descricao: 'Conjunto comercial em uma das avenidas mais valorizadas de Manaus. Recepção, três salas privativas e copa. Entrega com piso e forro prontos para personalização.',
        detalhes: { banheiros: 2, areaConstruida: 85, tamanhoTerreno: 85 },
        caracteristicas: ['Garagem']
    }
];

const agora = new Date().toISOString();

const imoveis = BASE.map(i => ({
    nome: i.nome,
    localizacao: i.localizacao,
    valor: i.valor,
    tipo: i.tipo,
    descricao: i.descricao,
    detalhes: {
        subtipo: i.subtipo,
        negocio: i.negocio,
        quartos: i.detalhes.quartos ?? null,
        banheiros: i.detalhes.banheiros ?? null,
        areaConstruida: i.detalhes.areaConstruida ?? null,
        tamanhoTerreno: i.detalhes.tamanhoTerreno ?? null,
        video_url: i.video_url || null
    },
    caracteristicas: i.caracteristicas,
    imagens: FOTOS[i.subtipo],
    ativo: true,
    slug: gerarSlug(i.nome),
    datacriacao: agora,
    dataatualizacao: agora
}));

// ── Garante slug único contra o que já existe no banco ───────
async function resolverSlugs() {
    const r = await fetch(`${endpoint}?select=slug`, { headers });
    if (!r.ok) throw new Error(`Falha ao ler slugs existentes: ${r.status} ${await r.text()}`);
    const usados = new Set((await r.json()).map(x => x.slug));

    for (const im of imoveis) {
        if (!usados.has(im.slug)) { usados.add(im.slug); continue; }
        let n = 2;
        while (usados.has(`${im.slug}-${n}`)) n++;
        im.slug = `${im.slug}-${n}`;
        usados.add(im.slug);
    }
}

async function seed() {
    if (process.argv.includes('--dry')) {
        console.log(JSON.stringify(imoveis, null, 2));
        console.log(`\n(dry-run) ${imoveis.length} imóveis prontos para envio.`);
        return;
    }

    console.log(`Enviando ${imoveis.length} imóveis de teste para ${supabaseUrl} ...`);
    await resolverSlugs();

    const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(imoveis)
    });

    if (!res.ok) {
        console.error(`Erro ${res.status}:`, await res.text());
        process.exit(1);
    }

    const criados = await res.json();
    console.log(`${criados.length} imóveis cadastrados:`);
    criados.forEach(im => {
        const d = im.detalhes || {};
        console.log(`   #${im.id}  ${im.nome}  [${d.subtipo}/${im.tipo} - ${d.negocio}]  -> imovel.html?id=${im.id}`);
    });
}

seed().catch(e => {
    console.error('Falha ao rodar seed:', e.message || e);
    process.exit(1);
});
