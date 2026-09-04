// js/admin-auth.js — trava de acesso ao painel.
//
// As rotas de escrita em /api exigem o header x-admin-token. Este script pede a
// senha uma vez, guarda no localStorage e só então libera o carregamento do
// admin.js. Deve ser incluído DEPOIS de db-client.js e ANTES de admin.js.

(function () {
    'use strict';

    var conteudo = document.body;

    function overlay(mensagem) {
        var caixa = document.createElement('div');
        caixa.id = 'authOverlay';
        caixa.innerHTML =
            '<div class="auth-card">' +
            '  <h2>Painel Villa Serena</h2>' +
            '  <p id="authMsg">' + mensagem + '</p>' +
            '  <input type="password" id="authInput" placeholder="Senha do painel" autocomplete="current-password">' +
            '  <button id="authBtn">ENTRAR</button>' +
            '</div>';

        var estilo = document.createElement('style');
        estilo.textContent =
            '#authOverlay{position:fixed;inset:0;z-index:99999;background:#121212;' +
            'display:flex;align-items:center;justify-content:center;font-family:sans-serif}' +
            '#authOverlay .auth-card{width:min(360px,90vw);text-align:center;color:#fff}' +
            '#authOverlay h2{font-size:1.4rem;letter-spacing:.08em;margin:0 0 8px}' +
            '#authOverlay p{font-size:.85rem;opacity:.65;margin:0 0 24px;min-height:1.2em}' +
            '#authOverlay p.erro{color:#e0736d;opacity:1}' +
            '#authOverlay input{width:100%;height:48px;padding:0 16px;background:#1c1c1c;' +
            'border:1px solid #333;border-radius:6px;color:#fff;font-size:1rem;box-sizing:border-box}' +
            '#authOverlay input:focus{outline:none;border-color:#c9a961}' +
            '#authOverlay button{width:100%;height:48px;margin-top:12px;border:0;border-radius:6px;' +
            'background:#c9a961;color:#121212;font-weight:700;letter-spacing:.1em;cursor:pointer}' +
            '#authOverlay button:disabled{opacity:.5;cursor:default}';

        document.head.appendChild(estilo);
        conteudo.appendChild(caixa);
        return caixa;
    }

    async function conferir(token) {
        try {
            var r = await fetch('/api/auth', { headers: { 'x-admin-token': token } });
            return r.ok;
        } catch (e) {
            return false;
        }
    }

    function carregarAdmin() {
        var s = document.createElement('script');
        s.src = 'js/admin.js';

        // admin.js espera o DOMContentLoaded para montar a lista. Como ele entra
        // depois da senha, esse evento normalmente já passou — então chamamos na mão.
        s.onload = function () {
            if (document.readyState !== 'loading' && window.carregarLista) {
                window.carregarLista();
            }
        };

        document.body.appendChild(s);
    }

    async function iniciar() {
        var token = window.db.admin.token();

        if (token && await conferir(token)) return carregarAdmin();
        if (token) window.db.admin.limpar();

        var caixa = overlay(token ? 'Sessão expirada. Entre de novo.' : 'Acesso restrito.');
        var input = caixa.querySelector('#authInput');
        var botao = caixa.querySelector('#authBtn');
        var msg = caixa.querySelector('#authMsg');

        input.focus();

        async function tentar() {
            var valor = input.value.trim();
            if (!valor) return;

            botao.disabled = true;
            botao.textContent = 'VERIFICANDO...';

            if (await conferir(valor)) {
                window.db.admin.definir(valor);
                caixa.remove();
                return carregarAdmin();
            }

            msg.textContent = 'Senha incorreta.';
            msg.className = 'erro';
            botao.disabled = false;
            botao.textContent = 'ENTRAR';
            input.value = '';
            input.focus();
        }

        botao.addEventListener('click', tentar);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tentar(); });
    }

    iniciar();
})();
