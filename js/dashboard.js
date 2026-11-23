/* ============================================================
   CURIÓ PROMOS — DASHBOARD (COM GRÁFICOS POR LOJA)
   ============================================================ */

const CurioDashboard = (() => {

  function statusAtivo(p) { return p.status === 'ativa'; }
  function statusPendente(p) { return p.status === 'pendente'; }
  function statusDivulgada(p) { return p.status === 'divulgada'; }
  
  function statusExpirada(p) {
    if (p.status === 'expirada') return true;
    if (p.dataValidade) {
      const validade = p.dataValidade.toDate ? p.dataValidade.toDate() : new Date(p.dataValidade);
      if (validade < new Date()) return true;
    }
    return false;
  }

  // ---------- RENDER CARDS ----------
  function renderCards(promocoes, categorias, lojas, totalDivulgacoes) {
    const ativas = promocoes.filter(statusAtivo).length;
    const pendentes = promocoes.filter(statusPendente).length;
    const divulgadas = promocoes.filter(statusDivulgada).length;
    const expiradas = promocoes.filter(statusExpirada).length;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('card-total', promocoes.length);
    set('card-ativas', ativas);
    set('card-pendentes', pendentes);
    set('card-divulgadas', divulgadas);
    set('card-expiradas', expiradas);
    set('card-lojas', lojas.length);
    set('card-categorias', categorias.length);
    set('card-divulgacoes', totalDivulgacoes);
  }

  // ---------- GRÁFICO POR LOJA (INTELIGENTE) ----------
  function renderGraficoLojas(promocoes, lojas) {
    const container = document.getElementById('grafico-lojas');
    if (!container) return;

    const contagem = {};
    promocoes.forEach(p => {
      let loja = p.lojaNome || 'Outras';
      const link = (p.linkAfiliado || p.linkOferta || '').toLowerCase();

      // Inteligência: Se a loja estiver como "Outras", tenta adivinhar pelo link
      if (loja === 'Outras' || !loja) {
        if (link.includes('mercadolivre') || link.includes('meli.la') || link.includes('mercl')) loja = 'Mercado Livre';
        else if (link.includes('shopee')) loja = 'Shopee';
        else if (link.includes('amazon') || link.includes('amzn')) loja = 'Amazon';
      }

      contagem[loja] = (contagem[loja] || 0) + 1;
    });

    // Ordena do maior para o menor
    const entradas = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entradas.map(e => e[1]), 1);

    if (entradas.length === 0) {
      container.innerHTML = '<p class="text-muted text-small">Sem dados ainda.</p>';
      return;
    }

    container.innerHTML = entradas.map(([nome, qtd]) => `
      <div style="margin-bottom:0.75rem;">
        <div class="flex-between text-small" style="margin-bottom:0.25rem;">
          <span style="font-weight:600;">${CurioUtils.escapeHtml(nome)}</span>
          <span style="font-weight:600;">${qtd}</span>
        </div>
        <div style="height:8px;background:var(--bg-body);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${(qtd / max) * 100}%;background:var(--verde-whats);border-radius:4px;"></div>
        </div>
      </div>
    `).join('');
  }

  // ---------- GRÁFICO CATEGORIAS ----------
  function renderGraficoCategorias(promocoes) {
    const container = document.getElementById('grafico-categorias');
    if (!container) return;

    const contagem = {};
    promocoes.forEach(p => {
      const cat = p.categoriaNome || 'Sem categoria';
      contagem[cat] = (contagem[cat] || 0) + 1;
    });

    const entradas = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entradas.map(e => e[1]), 1);

    if (entradas.length === 0) {
      container.innerHTML = '<p class="text-muted text-small">Sem dados ainda.</p>';
      return;
    }

    container.innerHTML = entradas.map(([nome, qtd]) => `
      <div style="margin-bottom:0.75rem;">
        <div class="flex-between text-small" style="margin-bottom:0.25rem;">
          <span>${CurioUtils.escapeHtml(nome)}</span>
          <span style="font-weight:600;">${qtd}</span>
        </div>
        <div style="height:8px;background:var(--bg-body);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${(qtd / max) * 100}%;background:var(--azul-marinho);border-radius:4px;"></div>
        </div>
      </div>
    `).join('');
  }

  // ---------- GRÁFICO PERÍODO ----------
  function renderGraficoPeriodo(promocoes) {
    const container = document.getElementById('grafico-periodo');
    if (!container) return;

    const dias = [];
    const hoje = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      dias.push({
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        data: d.toISOString().slice(0, 10),
        qtd: 0
      });
    }

    promocoes.forEach(p => {
      let criado;
      if (p.criadoEm?.toDate) criado = p.criadoEm.toDate();
      else if (p.criadoEm) criado = new Date(p.criadoEm);
      else return;
      const key = criado.toISOString().slice(0, 10);
      const dia = dias.find(d => d.data === key);
      if (dia) dia.qtd++;
    });

    const max = Math.max(...dias.map(d => d.qtd), 1);

    container.innerHTML = `
      <div class="flex" style="align-items:flex-end;gap:0.5rem;height:120px;">
        ${dias.map(d => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:0.25rem;">
            <div style="font-size:0.6875rem;color:var(--text-muted);">${d.qtd}</div>
            <div style="width:100%;height:${Math.max((d.qtd / max) * 80, 4)}px;background:var(--azul-marinho);border-radius:4px 4px 0 0;"></div>
            <div style="font-size:0.625rem;color:var(--text-muted);">${d.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ---------- ÚLTIMAS PROMOÇÕES ----------
    // ---------- ÚLTIMAS PROMOÇÕES ----------
  function renderUltimas(promocoes) {
    const container = document.getElementById('ultimas-promocoes');
    if (!container) return;

    const ultimas = promocoes.slice(0, 5);

    if (ultimas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="tag" style="width:40px;height:40px;margin:0 auto 0.75rem;color:var(--text-muted);"></i>
          <p>Nenhuma promoção cadastrada ainda.</p>
        </div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    // Estrutura de Grid forçada para não desconfigurar
    container.innerHTML = ultimas.map(p => `
      <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; padding: 0.85rem 0; border-bottom: 1px solid var(--border-color); align-items: center;">
        
        <!-- Lado Esquerdo: Título e Loja -->
        <div style="min-width: 0;">
          <div style="font-weight: 600; font-size: 0.875rem; line-height: 1.3; margin-bottom: 0.25rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; word-break: break-word;">
            ${CurioUtils.escapeHtml(p.produto)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            ${CurioUtils.escapeHtml(p.lojaNome || '—')}
          </div>
        </div>

        <!-- Lado Direito: Preço e Status -->
        <div style="display: flex; flex-direction: column; align-items: flex-end; white-space: nowrap;">
          <div style="font-weight: 600; font-size: 0.95rem; color: var(--azul-marinho); margin-bottom: 0.25rem;">
            ${CurioUtils.formatarMoeda(p.precoPromocional)}
          </div>
          <span class="badge badge-${p.status || 'pendente'}" style="font-size: 0.65rem; padding: 0.15rem 0.5rem;">
            ${p.status || 'pendente'}
          </span>
        </div>
        
      </div>
    `).join('');
  }

  // ---------- INIT ----------
  async function init() {
    try {
      await CurioDB.limparPromocoesAntigas();

      const [promocoes, categorias, lojas, historico] = await Promise.all([
        CurioDB.listarPromocoes(),
        CurioDB.listarCategorias(),
        CurioDB.listarLojas(),
        CurioDB.listarHistorico()
      ]);

      renderCards(promocoes, categorias, lojas, historico.length);
      renderGraficoLojas(promocoes, lojas); 
      renderGraficoCategorias(promocoes);
      renderGraficoPeriodo(promocoes);
      renderUltimas(promocoes);

      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
      console.error('Erro ao carregar dashboard:', e);
      CurioUtils.toast('Erro ao carregar dados. Verifique a conexão.', 'erro');
    }
  }

  return { init };
})();