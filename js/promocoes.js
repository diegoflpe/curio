/* ============================================================
   CURIÓ PROMOS — LISTAGEM DE PROMOÇÕES
   Filtros, busca, renderização em cards e ações.
   ============================================================ */

const CurioPromocoes = (() => {

  let todas = [];
  let categorias = [];
  let lojas = [];
  let filtros = { busca: '', loja: '', categoria: '', status: '' };

  // ---------- HELPERS ----------
  function statusEfetivo(p) {
    if (p.status === 'expirada') return 'expirada';
    if (p.dataValidade) {
      const v = p.dataValidade.toDate ? p.dataValidade.toDate() : new Date(p.dataValidade);
      if (v < new Date()) return 'expirada';
    }
    return p.status || 'pendente';
  }

  function aplicarFiltros(lista) {
    return lista.filter(p => {
      if (filtros.busca) {
        const q = filtros.busca.toLowerCase();
        if (!(p.produto || '').toLowerCase().includes(q)) return false;
      }
      if (filtros.loja && p.lojaNome !== filtros.loja) return false;
      if (filtros.categoria && p.categoriaNome !== filtros.categoria) return false;
      if (filtros.status && statusEfetivo(p) !== filtros.status) return false;
      return true;
    });
  }

  // ---------- RENDER ----------
  function render() {
    const container = document.getElementById('lista-promocoes');
    const contador = document.getElementById('contador-promocoes');
    if (!container) return;

    const lista = aplicarFiltros(todas);

    if (contador) {
      contador.textContent =
        `${lista.length} promoção(ões) encontrada(s) de ${todas.length} total.`;
    }

    if (lista.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <i data-lucide="tag" style="width:48px;height:48px;margin:0 auto 1rem;color:#CBD5E1;"></i>
            <h3>Nenhuma promoção encontrada</h3>
            <p>Ajuste os filtros ou cadastre uma nova promoção.</p>
          </div>
        </div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">
        ${lista.map(p => cardHTML(p)).join('')}
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindAcoes();
  }

  function cardHTML(p) {
    const status = statusEfetivo(p);
    const img = p.imagemUrl
      ? `<img src="${CurioUtils.escapeHtml(p.imagemUrl)}" alt=""
              style="width:100%;height:160px;object-fit:cover;border-radius:var(--raio-sm) var(--raio-sm) 0 0;"
              onerror="this.style.display='none'">`
      : `<div style="height:160px;background:var(--cinza-fundo);display:flex;align-items:center;justify-content:center;border-radius:var(--raio-sm) var(--raio-sm) 0 0;">
           <i data-lucide="image" style="width:32px;height:32px;color:#CBD5E1;"></i>
         </div>`;

    return `
      <div class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column;">
        ${img}
        <div style="padding:1rem;flex:1;display:flex;flex-direction:column;">
          <div class="flex-between" style="margin-bottom:0.5rem;">
            <span class="badge badge-${status}">${status}</span>
            <span class="text-small text-muted">${CurioUtils.escapeHtml(p.lojaNome || '—')}</span>
          </div>
          <h4 style="margin-bottom:0.375rem;font-size:0.9375rem;line-height:1.3;">
            ${CurioUtils.escapeHtml(p.produto)}
          </h4>
          <div class="text-small text-muted" style="margin-bottom:0.75rem;">
            ${CurioUtils.escapeHtml(p.categoriaNome || '—')}
          </div>
          <div style="margin-top:auto;">
            <div class="text-small text-muted" style="text-decoration:line-through;">
              ${CurioUtils.formatarMoeda(p.precoOriginal)}
            </div>
            <div style="display:flex;align-items:baseline;gap:0.5rem;">
              <span style="font-size:1.25rem;font-weight:700;color:var(--azul-marinho);">
                ${CurioUtils.formatarMoeda(p.precoPromocional)}
              </span>
              <span class="badge" style="background:#DCFCE7;color:#166534;">
                -${p.desconto || 0}%
              </span>
            </div>
          </div>
          <div class="flex gap-sm" style="margin-top:0.75rem;flex-wrap:wrap;">
            <a href="promocao-divulgar.html?id=${p.id}" class="btn btn-whatsapp btn-sm" style="flex:1;">
              <i data-lucide="message-circle" style="width:14px;height:14px;"></i> Divulgar
            </a>
            <a href="promocao-form.html?id=${p.id}" class="btn btn-outline btn-sm" title="Editar">
              <i data-lucide="pencil" style="width:14px;height:14px;"></i>
            </a>
            <button class="btn btn-ghost btn-sm btn-duplicar" data-id="${p.id}" title="Duplicar">
              <i data-lucide="copy" style="width:14px;height:14px;"></i>
            </button>
            <button class="btn btn-ghost btn-sm btn-excluir"
                    data-id="${p.id}"
                    data-produto="${CurioUtils.escapeHtml(p.produto)}"
                    title="Excluir"
                    style="color:var(--vermelho);">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ---------- AÇÕES ----------
  function bindAcoes() {
    document.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const produto = btn.dataset.produto;
        if (!confirm(`Excluir a promoção "${produto}"?\n\nEsta ação não pode ser desfeita.`)) return;
        try {
          await CurioDB.excluirPromocao(id);
          CurioUtils.toast('Promoção excluída.', 'sucesso');
          await carregar();
        } catch (e) {
          CurioUtils.toast('Erro ao excluir promoção.', 'erro');
        }
      };
    });

    document.querySelectorAll('.btn-duplicar').forEach(btn => {
      btn.onclick = async () => {
        try {
          await CurioDB.duplicarPromocao(btn.dataset.id);
          CurioUtils.toast('Promoção duplicada.', 'sucesso');
          await carregar();
        } catch (e) {
          CurioUtils.toast('Erro ao duplicar promoção.', 'erro');
        }
      };
    });
  }

  // ---------- FILTROS ----------
  function bindFiltros() {
    const busca = document.getElementById('filtro-busca');
    const loja = document.getElementById('filtro-loja');
    const cat = document.getElementById('filtro-categoria');
    const st = document.getElementById('filtro-status');

    if (busca) busca.addEventListener('input', (e) => {
      filtros.busca = e.target.value.trim();
      render();
    });
    if (loja) loja.addEventListener('change', (e) => {
      filtros.loja = e.target.value;
      render();
    });
    if (cat) cat.addEventListener('change', (e) => {
      filtros.categoria = e.target.value;
      render();
    });
    if (st) st.addEventListener('change', (e) => {
      filtros.status = e.target.value;
      render();
    });
  }

  function preencherSelects() {
    const selLoja = document.getElementById('filtro-loja');
    const selCat = document.getElementById('filtro-categoria');
    if (selLoja && selLoja.options.length === 1) {
      lojas.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.nome;
        opt.textContent = l.nome;
        selLoja.appendChild(opt);
      });
    }
    if (selCat && selCat.options.length === 1) {
      categorias.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nome;
        opt.textContent = c.nome;
        selCat.appendChild(opt);
      });
    }
  }

  // ---------- CARREGAR ----------
  async function carregar() {
    try {
      [todas, categorias, lojas] = await Promise.all([
        CurioDB.listarPromocoes(),
        CurioDB.listarCategorias(),
        CurioDB.listarLojas()
      ]);
      render();
    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao carregar promoções.', 'erro');
    }
  }

  async function init() {
    await carregar();
    preencherSelects();
    bindFiltros();
  }

  return { init };
})();