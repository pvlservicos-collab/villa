// js/db-client.js — cliente de dados do site.
//
// Substitui o antigo js/supabase-config.js. Os dados agora vivem no Postgres
// (Neon) e são acessados pelas serverless functions em /api — o navegador nunca
// vê a string de conexão. A interface abaixo imita a do supabase-js
// (`.from().select().eq().order()`, `.insert()`, `.storage`) para que app.js,
// imovel.js, admin.js e resultados.html continuem funcionando sem alteração.

(function () {
    'use strict';

    var API = '/api';
    var CHAVE_TOKEN = 'villa_admin_token';

    // ── Token do painel ──────────────────────────────────────
    function tokenAdmin() {
        try { return localStorage.getItem(CHAVE_TOKEN) || ''; } catch (e) { return ''; }
    }

    function definirTokenAdmin(valor) {
        try { localStorage.setItem(CHAVE_TOKEN, valor); } catch (e) { }
    }

    function limparTokenAdmin() {
        try { localStorage.removeItem(CHAVE_TOKEN); } catch (e) { }
    }

    // ── Chamada HTTP → sempre devolve { data, error } ─────────
    async function chamar(metodo, caminho, corpo) {
        var opcoes = { method: metodo, headers: {} };

        if (corpo !== undefined) {
            opcoes.headers['Content-Type'] = 'application/json';
            opcoes.body = JSON.stringify(corpo);
        }
        if (metodo !== 'GET') {
            opcoes.headers['x-admin-token'] = tokenAdmin();
        }

        try {
            var resposta = await fetch(API + caminho, opcoes);
            var texto = await resposta.text();
            var json = texto ? JSON.parse(texto) : {};

            if (!resposta.ok) {
                var msg = (json.error && json.error.message) || ('HTTP ' + resposta.status);
                return { data: null, error: { message: msg, status: resposta.status } };
            }
            return { data: json.data, error: null };
        } catch (e) {
            return { data: null, error: { message: e.message || 'Falha de rede' } };
        }
    }

    var ROTAS = { imoveis: '/imoveis', perfil: '/perfil' };

    // ── Builder de leitura (thenable, como o supabase-js) ─────
    function Consulta(tabela) {
        this.tabela = tabela;
        this.filtros = [];
        this.ascendente = false;
        this._limite = null;
        this._unico = false;
    }

    Consulta.prototype.select = function () { return this; };

    Consulta.prototype.eq = function (coluna, valor) {
        this.filtros.push(['eq', coluna, valor]);
        return this;
    };

    Consulta.prototype.neq = function (coluna, valor) {
        this.filtros.push(['neq', coluna, valor]);
        return this;
    };

    Consulta.prototype.order = function (_coluna, opcoes) {
        this.ascendente = !!(opcoes && opcoes.ascending);
        return this;
    };

    Consulta.prototype.limit = function (n) { this._limite = n; return this; };

    Consulta.prototype.single = function () { this._unico = true; return this; };

    Consulta.prototype.montarQuery = function () {
        var p = new URLSearchParams();

        this.filtros.forEach(function (f) {
            var op = f[0], coluna = f[1], valor = f[2];
            if (op === 'eq' && coluna === 'ativo') p.set('ativo', valor ? 'true' : 'false');
            else if (op === 'eq') p.set(coluna, valor);
            else if (op === 'neq') p.set('neq_' + coluna, valor);
        });

        if (this.ascendente) p.set('ascending', 'true');
        if (this._limite) p.set('limit', this._limite);

        var s = p.toString();
        return s ? '?' + s : '';
    };

    Consulta.prototype.executar = async function () {
        // perfil tem endpoint próprio e sempre devolve um único registro
        if (this.tabela === 'perfil') {
            var r = await chamar('GET', ROTAS.perfil);
            if (r.error) return r;
            if (this._unico && !r.data) {
                return { data: null, error: { message: 'Perfil não encontrado' } };
            }
            return { data: this._unico ? r.data : (r.data ? [r.data] : []), error: null };
        }

        var res = await chamar('GET', ROTAS.imoveis + this.montarQuery());
        if (res.error) return res;

        var linhas = res.data || [];
        if (!this._unico) return { data: linhas, error: null };

        if (linhas.length === 0) {
            return { data: null, error: { message: 'Registro não encontrado' } };
        }
        return { data: linhas[0], error: null };
    };

    Consulta.prototype.then = function (aoResolver, aoRejeitar) {
        return this.executar().then(aoResolver, aoRejeitar);
    };

    // ── Builder de escrita ───────────────────────────────────
    function Escrita(executor) { this.executor = executor; }

    Escrita.prototype.eq = function (coluna, valor) {
        if (coluna === 'id') this.id = valor;
        return this;
    };

    Escrita.prototype.select = function () { return this; };
    Escrita.prototype.single = function () { return this; };

    Escrita.prototype.then = function (aoResolver, aoRejeitar) {
        return this.executor(this.id).then(aoResolver, aoRejeitar);
    };

    // ── Tabela ───────────────────────────────────────────────
    function Tabela(nome) { this.nome = nome; }

    Tabela.prototype.select = function () { return new Consulta(this.nome); };

    Tabela.prototype.insert = function (linhas) {
        var nome = this.nome;
        var lista = Array.isArray(linhas) ? linhas : [linhas];

        return new Escrita(async function () {
            var criados = [];
            for (var i = 0; i < lista.length; i++) {
                var r = await chamar('POST', ROTAS[nome], lista[i]);
                if (r.error) return r;
                criados.push(r.data);
            }
            return { data: criados, error: null };
        });
    };

    Tabela.prototype.update = function (valores) {
        var nome = this.nome;
        return new Escrita(function (id) {
            return chamar('PATCH', ROTAS[nome] + '?id=' + encodeURIComponent(id), valores);
        });
    };

    Tabela.prototype.delete = function () {
        var nome = this.nome;
        return new Escrita(function (id) {
            return chamar('DELETE', ROTAS[nome] + '?id=' + encodeURIComponent(id));
        });
    };

    Tabela.prototype.upsert = function (valores) {
        var nome = this.nome;
        return new Escrita(function () {
            if (nome === 'perfil') return chamar('PUT', ROTAS.perfil, valores);
            return chamar('POST', ROTAS[nome], valores);
        });
    };

    // ── Storage: comprime no navegador e envia pro Vercel Blob ─
    var urlsEnviadas = {};

    function redimensionar(arquivo, ladoMaximo) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            var urlObjeto = URL.createObjectURL(arquivo);

            img.onload = function () {
                URL.revokeObjectURL(urlObjeto);

                var escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
                var canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * escala);
                canvas.height = Math.round(img.height * escala);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(function (blob) {
                    blob ? resolve(blob) : reject(new Error('Falha ao comprimir a imagem'));
                }, 'image/jpeg', 0.82);
            };

            img.onerror = function () {
                URL.revokeObjectURL(urlObjeto);
                reject(new Error('Arquivo de imagem inválido'));
            };

            img.src = urlObjeto;
        });
    }

    function paraBase64(blob) {
        return new Promise(function (resolve, reject) {
            var leitor = new FileReader();
            leitor.onload = function () {
                resolve(String(leitor.result).split(',')[1]);
            };
            leitor.onerror = function () { reject(new Error('Falha ao ler o arquivo')); };
            leitor.readAsDataURL(blob);
        });
    }

    function Bucket(nome) { this.nome = nome; }

    Bucket.prototype.upload = async function (caminho, arquivo) {
        try {
            var comprimido = await redimensionar(arquivo, 1920);
            var base64 = await paraBase64(comprimido);
            var destino = this.nome + '/' + caminho.replace(/\.[^.]+$/, '') + '.jpg';

            var r = await chamar('POST', '/upload', {
                path: destino,
                contentType: 'image/jpeg',
                dataBase64: base64
            });

            if (r.error) return { data: null, error: r.error };

            urlsEnviadas[caminho] = r.data.url;
            return { data: { path: caminho }, error: null };
        } catch (e) {
            return { data: null, error: { message: e.message } };
        }
    };

    // Devolve a URL gerada no upload que acabou de acontecer para esse caminho.
    Bucket.prototype.getPublicUrl = function (caminho) {
        return { data: { publicUrl: urlsEnviadas[caminho] || '' } };
    };

    // ── Cliente exposto globalmente ──────────────────────────
    var cliente = {
        from: function (nome) { return new Tabela(nome); },
        storage: { from: function (nome) { return new Bucket(nome); } },
        admin: {
            token: tokenAdmin,
            definir: definirTokenAdmin,
            limpar: limparTokenAdmin
        }
    };

    window.supabase = cliente;   // nome mantido para não quebrar o código existente
    window.db = cliente;
    window.imoveisTable = 'imoveis';
    window.imoveisBucket = 'imoveis';

    console.log('Banco conectado via /api (Neon Postgres).');
})();
