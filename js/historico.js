/* ============================================================
   CURIÓ PROMOS — HISTÓRICO DE DIVULGAÇÃO
   Listagem, filtros e modal de detalhes.
   ============================================================ */

const CurioHistorico = (() => {

  let todos = [];
  let filtros = { busca: '', status: '' };

  function $(id) { return document.getElementById(id); }

  function statusLabel(s) {
    if (s === 'aberto_whatsapp') return 'Aberto no WhatsApp';
    if (s === 'copiado') return 'Copiado';
    return s || '—';
  }

  function aplicarFiltros(lista) {
    return lista.filter(h => {
      if (filtros.busca) {
        const q = filtros.busca.toLowerCase();
        if (!(h.produto || '').toLowerCase().includes(q)) return false;
      }
      if (filtros.status && h.status !== filtros.status) return false;
      return true;
    });
  }

  // ---------- RENDER ----------
  function render() {
    const container = $('lista-historico');
    const contador = $('contador-historico');
    if (!container) return;

    const lista = aplicarFiltros(todos);

    if (contador) {
      contador.textContent = `${lista.length} registro(s) de ${todos.length} total.`;
    }

    if (lista.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <i data-lucide="history" style="width:48px;height:48px;margin:0 auto 1rem;color:#CBD5E1;"></i>
            <h3>Nenhuma divulgação registrada</h3>
            <p>As divulgações aparecerão aqui quando você copiar ou abrir o WhatsApp de uma promoção.</p>
          </div>
        </div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Produto</th>
                <th>Template</th>
                <th>Status</th>
                <th style="text-align:right;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${lista.map(h => `
                <tr>
                  <td class="text-small">${CurioUtils.formatarDataHora(h.dataHora)}</td>
                  <td style="font-weight:600;">${CurioUtils.escapeHtml(h.produto || '—')}</td>
                  <td class="text-small">${CurioUtils.escapeHtml(h.templateNome || '—')}</td>
                  <td>
                    <span class="badge ${h.status === 'aberto_whatsapp' ? 'badge-divulgada' : 'badge-pendente'}">
                      ${statusLabel(h.status)}
                    </span>
                  </td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-sm btn-detalhe" data-id="${h.id}" title="Ver detalhes">
                      <i data-lucide="eye" style="width:14px;height:14px;"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindAcoes();
  }

  // ---------- MODAL ----------
  function abrirDetalhe(id) {
    const h = todos.find(x => x.id === id);
    if (!h) return;

    $('modal-detalhe-conteudo').innerHTML = `
      <div style="display:grid;gap:0.75rem;font-size:0.875rem;">
        <div>
          <div class="text-muted text-small">Produto</div>
          <div style="font-weight:600;">${CurioUtils.escapeHtml(h.produto || '—')}</div>
        </div>
        <div>
          <div class="text-muted text-small">Data/Hora</div>
          <div>${CurioUtils.formatarDataHora(h.dataHora)}</div>
        </div>
        <div>
          <div class="text-muted text-small">Template</div>
          <div>${CurioUtils.escapeHtml(h.templateNome || '—')}</div>
        </div>
        <div>
          <div class="text-muted text-small">Status</div>
          <div>${statusLabel(h.status)}</div>
        </div>
        <div>
          <div class="text-muted text-small">Link utilizado</div>
          <div style="word-break:break-all;">
            ${h.linkUtilizado
              ? `<a href="${CurioUtils.escapeHtml(h.linkUtilizado)}" target="_blank" rel="noopener" style="color:var(--azul-marinho);">${CurioUtils.escapeHtml(h.linkUtilizado)}</a>`
              : '—'}
          </div>
        </div>
        <div>
          <div class="text-muted text-small">Mensagem gerada</div>
          <pre style="background:var(--cinza-fundo);padding:0.75rem;border-radius:var(--raio-sm);white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:0.8125rem;max-height:280px;overflow-y:auto;">${CurioUtils.escapeHtml(h.mensagemGerada || '—')}</pre>
        </div>
      </div>
    `;

    $('modal-detalhe').classList.remove('hidden');
  }

  function fecharDetalhe() {
    $('modal-detalhe').classList.add('hidden');
  }

  // ---------- AÇÕES ----------
  function bindAcoes() {
    document.querySelectorAll('.btn-detalhe').forEach(btn => {
      btn.onclick = () => abrirDetalhe(btn.dataset.id);
    });
  }

  // ---------- FILTROS ----------
  function bindFiltros() {
    $('filtro-busca').addEventListener('input', (e) => {
      filtros.busca = e.target.value.trim();
      render();
    });
    $('filtro-status').addEventListener('change', (e) => {
      filtros.status = e.target.value;
      render();
    });
  }

  // ---------- CARREGAR ----------
  async function carregar() {
    try {
      todos = await CurioDB.listarHistorico();
      render();
    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao carregar histórico.', 'erro');
    }
  }

  // ---------- INIT ----------
  async function init() {
    $('modal-detalhe-fechar').onclick = fecharDetalhe;
    $('modal-detalhe').addEventListener('click', (e) => {
      if (e.target.id === 'modal-detalhe') fecharDetalhe();
    });

    bindFiltros();
    await carregar();
  }

  return { init };
})();