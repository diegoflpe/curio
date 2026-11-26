/* ============================================================
   CURIÓ PROMOS — DASHBOARD (COM FILTRO DE DATA)
   ============================================================ */

const CurioDashboard = (() => {

  let todasPromocoes = [];
  let todosHistorico = [];
  let lojasGlobal = [];
  let categoriasGlobal = [];

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

  // ---------- FILTRO DE DATA ----------
  function aplicarFiltroData() {
    const inicioStr = document.getElementById('dash-data-inicio').value;
    const fimStr = document.getElementById('dash-data-fim').value;

    let promos = todasPromocoes;
    let hist = todosHistorico;

    // Se tiver data preenchida, filtra
    if (inicioStr || fimStr) {
      const dtInicio = inicioStr ? new Date(inicioStr + 'T00:00:00') : new Date(0);
      const dtFim = fimStr ? new Date(fimStr + 'T23:59:59') : new Date();

      promos = todasPromocoes.filter(p => {
        let data;
        if (p.criadoEm?.toDate) data = p.criadoEm.toDate();
        else if (p.criadoEm) data = new Date(p.criadoEm);
        else return false;
        return data >= dtInicio && data <= dtFim;
      });

      hist = todosHistorico.filter(h => {
        let data;
        if (h.dataHora?.toDate) data = h.dataHora.toDate();
        else if (h.dataHora) data = new Date(h.dataHora);
        else return false;
        return data >= dtInicio && data <= dtFim;
      });
    }

    // Atualiza a tela com os dados filtrados
    renderCards(promos, categoriasGlobal, lojasGlobal, hist.length);
    renderGraficoLojas(promos, lojasGlobal);
    renderGraficoCategorias(promos);
    renderGraficoPeriodo(promos, inicioStr, fimStr); // O gráfico de período muda conforme o filtro
    renderUltimas(promos);
  }

  // ---------- CARDS ----------
  function renderCards(promocoes, categorias, lojas, totalDivulgacoes) {
    const ativas = promocoes.filter(statusAtivo).length;
    const pendentes = promocoes.filter(statusPendente).length;
    const divulgadas = promocoes.filter(statusDivulgada).length;
    const expiradas = promocoes.filter(statusExpirada).length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('card-total', promocoes.length);
    set('card-ativas', ativas);
    set('card-pendentes', pendentes);
    set('card-divulgadas', divulgadas);
    set('card-expiradas', expiradas);
    set('card-lojas', lojas.length);
    set('card-categorias', categorias.length);
    set('card-divulgacoes', totalDivulgacoes);
  }

  // ---------- GRÁFICO LOJAS ----------
  function renderGraficoLojas(promocoes) {
    const container = document.getElementById('grafico-lojas');
    if (!container) return;

    const contagem = {};
    promocoes.forEach(p => {
      let loja = p.lojaNome || 'Outras';
      const link = (p.linkAfiliado || p.linkOferta || '').toLowerCase();
      if (loja === 'Outras' || !loja) {
        if (link.includes('mercadolivre') || link.includes('meli.la') || link.includes('mercl')) loja = 'Mercado Livre';
        else if (link.includes('shopee')) loja = 'Shopee';
        else if (link.includes('amazon') || link.includes('amzn')) loja = 'Amazon';
      }
      contagem[loja] = (contagem[loja] || 0) + 1;
    });

    const entradas = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entradas.map(e => e[1]), 1);

    if (entradas.length === 0) {
      container.innerHTML = '<p class="text-muted text-small">Sem dados no período.</p>';
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
      container.innerHTML = '<p class="text-muted text-small">Sem dados no período.</p>';
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
  function renderGraficoPeriodo(promocoes, filtroInicio, filtroFim) {
    const container = document.getElementById('grafico-periodo');
    if (!container) return;

    // Se o usuário filtrou, o gráfico mostra os últimos 7 dias DAQUELE período ou os dias exatos
    let dias = [];
    const hoje = new Date();
    
    if (filtroInicio && filtroFim) {
      // Se o filtro for de um período curto (até 30 dias), mostra dia a dia
      const dtInicio = new Date(filtroInicio + 'T00:00:00');
      const dtFim = new Date(filtroFim + 'T00:00:00');
      const diffDias = Math.ceil((dtFim - dtInicio) / (1000 * 60 * 60 * 24));

      if (diffDias <= 31) {
        for (let d = new Date(dtInicio); d <= dtFim; d.setDate(d.getDate() + 1)) {
          dias.push({
            label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            data: d.toISOString().slice(0, 10),
            qtd: 0
          });
        }
      } else {
        // Se for maior que 30 dias, agrupa por mês
        container.innerHTML = '<p class="text-muted text-small">Período longo. O gráfico diário é substituído por mês.</p>';
        return;
      }
    } else {
      // Sem filtro: mostra os últimos 7 dias
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - i);
        dias.push({
          label: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
          data: d.toISOString().slice(0, 10),
          qtd: 0
        });
      }
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
      <div class="flex" style="align-items:flex-end;gap:0.5rem;height:120px; overflow-x:auto;">
        ${dias.map(d => `
          <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:0.25rem; min-width:30px;">
            <div style="font-size:0.6875rem;color:var(--text-muted);">${d.qtd}</div>
            <div style="width:100%;height:${Math.max((d.qtd / max) * 80, 4)}px;background:var(--azul-marinho);border-radius:4px 4px 0 0;"></div>
            <div style="font-size:0.625rem;color:var(--text-muted); white-space:nowrap;">${d.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ---------- ÚLTIMAS PROMOÇÕES ----------
  function renderUltimas(promocoes) {
    const container = document.getElementById('ultimas-promocoes');
    if (!container) return;

    const ultimas = promocoes.slice(0, 5);

    if (ultimas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="tag" style="width:40px;height:40px;margin:0 auto 0.75rem;color:var(--text-muted);"></i>
          <p>Nenhuma promoção no período.</p>
        </div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = ultimas.map(p => `
      <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; padding: 0.85rem 0; border-bottom: 1px solid var(--border-color); align-items: center;">
        <div style="min-width: 0;">
          <div style="font-weight: 600; font-size: 0.875rem; line-height: 1.3; margin-bottom: 0.25rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; word-break: break-word;">
            ${CurioUtils.escapeHtml(p.produto)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${CurioUtils.escapeHtml(p.lojaNome || '—')}</div>
        </div>
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

  // ---------- INICIAR ----------
  async function init() {
    try {
      // Carrega os dados totais do banco uma única vez
      const [promocoes, categorias, lojas, historico] = await Promise.all([
        CurioDB.listarPromocoes(),
        CurioDB.listarCategorias(),
        CurioDB.listarLojas(),
        CurioDB.listarHistorico()
      ]);

      todasPromocoes = promocoes;
      categoriasGlobal = categorias;
      lojasGlobal = lojas;
      todosHistorico = historico;

      // Renderiza inicialmente (sem filtro)
      renderCards(promocoes, categorias, lojas, historico.length);
      renderGraficoLojas(promocoes, lojas);
      renderGraficoCategorias(promocoes);
      renderGraficoPeriodo(promocoes, null, null);
      renderUltimas(promocoes);

      if (typeof lucide !== 'undefined') lucide.createIcons();

      // Configurar botões de filtro
      document.getElementById('btn-filtrar-dashboard').onclick = aplicarFiltroData;
      
      document.getElementById('btn-limpar-filtro').onclick = () => {
        document.getElementById('dash-data-inicio').value = '';
        document.getElementById('dash-data-fim').value = '';
        aplicarFiltroData();
      };

    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao carregar dados. Verifique a conexão.', 'erro');
    }
  }

  return { init };
})();
