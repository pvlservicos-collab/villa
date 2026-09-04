// scripts/seed.js — cadastra imoveis de teste no Neon.
// Uso:  node scripts/seed.js          (pula os que ja existem, por slug)
//       node scripts/seed.js --reset  (apaga tudo antes de inserir)

const { sql } = require('./db');

// mesma regra de slug do js/admin.js
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
    slug: gerarSlug(i.nome)
}));

(async () => {
    if (process.argv.includes('--reset')) {
        await sql`TRUNCATE imoveis RESTART IDENTITY`;
        console.log('Tabela imoveis zerada.\n');
    }

    let criados = 0, pulados = 0;

    for (const im of imoveis) {
        const linhas = await sql`
            INSERT INTO imoveis
                (nome, localizacao, valor, tipo, descricao, detalhes,
                 caracteristicas, imagens, ativo, slug)
            VALUES
                (${im.nome}, ${im.localizacao}, ${im.valor}, ${im.tipo}, ${im.descricao},
                 ${JSON.stringify(im.detalhes)}::jsonb,
                 ${JSON.stringify(im.caracteristicas)}::jsonb,
                 ${JSON.stringify(im.imagens)}::jsonb,
                 TRUE, ${im.slug})
            ON CONFLICT (slug) DO NOTHING
            RETURNING id, nome, tipo, detalhes
        `;

        if (linhas.length === 0) {
            pulados++;
            console.log(`   ja existe  ${im.slug}`);
            continue;
        }

        criados++;
        const r = linhas[0];
        console.log(`   #${r.id}  ${r.nome}  [${r.detalhes.subtipo}/${r.tipo} - ${r.detalhes.negocio}]`);
    }

    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM imoveis`;
    console.log(`\n${criados} criado(s), ${pulados} pulado(s). Total na tabela: ${count}.`);
})().catch(e => {
    console.error('Falhou:', e.message || e);
    process.exit(1);
});
