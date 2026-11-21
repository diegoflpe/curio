/* ============================================================
   CURIÓ PROMOS — CATEGORIAS
   CRUD completo com proteção contra exclusão em uso.
   ============================================================ */

const CurioCategorias = (() => {

  let categorias = [];
  let editandoId = null;
  let contagemPromocoesPorCategoria = {};

  function $(id) { return document.getElementById(id); }

  // ---------- CONTAGEM DE USO ----------
  async function carregarContagemUso() {
    try {
      const promocoes = await CurioDB.listarPromocoes();
      contagemPromocoesPorCategoria = {};
      promocoes.forEach(p => {
        const key = p.categoriaId || '_sem_id_';
        contagemPromocoesPorCategoria[key] = (contagemPromocoesPorCategoria[key] || 0) + 1;
      });
    } catch (e) {
      console.warn('Erro ao contar uso de categorias:', e);
    }
  }

  function usoCategoria(catId) {
    return contagemPromocoesPorCategoria[catId] || 0;
  }

  // ---------- RENDER ----------
  function render() {
    const container = $('lista-categorias');
    const contador = $('contador-categorias');
    if (!container) return;

    if (contador) {
      contador.textContent = `${categorias.length} categoria(s) cadastrada(s).`;
    }

    if (categorias.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <i data-lucide="folder" style="width:48px;height:48px;margin:0 auto 1rem;color:#CBD5E1;"></i>
            <h3>Nenhuma categoria</h3>
            <p>Cadastre a primeira categoria para organizar suas promoções.</p>
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
                <th>Nome</th>
                <th>Promoções</th>
                <th style="text-align:right;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${categorias.map(c => {
                const uso = usoCategoria(c.id);
                const bloqueado = uso > 0;
                return `
                  <tr>
                    <td style="font-weight:600;">${CurioUtils.escapeHtml(c.nome)}</td>
                    <td>
                      <span class="badge ${uso > 0 ? 'badge-divulgada' : 'badge-pendente'}">
                        ${uso} ${uso === 1 ? 'promoção' : 'promoções'}
                      </span>
                    </td>
                    <td style="text-align:right;">
                      <div class="flex gap-sm" style="justify-content:flex-end;">
                        <button class="btn btn-ghost btn-sm btn-editar" data-id="${c.id}" data-nome="${CurioUtils.escapeHtml(c.nome)}" title="Editar">
                          <i data-lucide="pencil" style="width:14px;height:14px;"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-excluir" data-id="${c.id}" data-nome="${CurioUtils.escapeHtml(c.nome)}" data-uso="${uso}" title="${bloqueado ? 'Categoria em uso — não pode ser excluída' : 'Excluir'}" style="color:${bloqueado ? '#CBD5E1' : 'var(--vermelho)'};" ${bloqueado ? 'disabled' : ''}>
                          <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindAcoes();
  }

  // ---------- MODAL ----------
  function abrirModal(id = null, nome = '') {
    editandoId = id;
    $('modal-categoria-titulo').textContent = id ? 'Editar categoria' : 'Nova categoria';
    $('categoria-nome').value = nome;
    $('modal-categoria').classList.remove('hidden');
    setTimeout(() => $('categoria-nome').focus(), 50);
  }

  function fecharModal() {
    editandoId = null;
    $('modal-categoria').classList.add('hidden');
    $('form-categoria').reset();
  }

  // ---------- AÇÕES ----------
  function bindAcoes() {
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.onclick = () => abrirModal(btn.dataset.id, btn.dataset.nome);
    });

    document.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.onclick = async () => {
        const uso = parseInt(btn.dataset.uso, 10) || 0;
        if (uso > 0) {
          CurioUtils.toast('Esta categoria está em uso e não pode ser excluída.', 'aviso');
          return;
        }
        const nome = btn.dataset.nome;
        if (!confirm(`Excluir a categoria "${nome}"?`)) return;
        try {
          await CurioDB.excluirCategoria(btn.dataset.id);
          CurioUtils.toast('Categoria excluída.', 'sucesso');
          await carregar();
        } catch (e) {
          CurioUtils.toast('Erro ao excluir categoria.', 'erro');
        }
      };
    });
  }

  // ---------- SUBMIT ----------
  async function onSubmit(e) {
    e.preventDefault();
    const nome = $('categoria-nome').value.trim();
    if (!nome) {
      CurioUtils.toast('Informe o nome da categoria.', 'aviso');
      return;
    }

    // Verifica duplicata (case-insensitive)
    const duplicada = categorias.some(c =>
      c.nome.toLowerCase() === nome.toLowerCase() && c.id !== editandoId
    );
    if (duplicada) {
      CurioUtils.toast('Já existe uma categoria com esse nome.', 'aviso');
      return;
    }

    const btn = $('modal-categoria-salvar');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      if (editandoId) {
        await CurioDB.atualizarCategoria(editandoId, nome);
        CurioUtils.toast('Categoria atualizada.', 'sucesso');
      } else {
        await CurioDB.criarCategoria(nome);
        CurioUtils.toast('Categoria criada.', 'sucesso');
      }
      fecharModal();
      await carregar();
    } catch (err) {
      CurioUtils.toast('Erro ao salvar categoria.', 'erro');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  }

  // ---------- CARREGAR ----------
  async function carregar() {
    try {
      categorias = await CurioDB.listarCategorias();
      await carregarContagemUso();
      render();
    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao carregar categorias.', 'erro');
    }
  }

  // ---------- INIT ----------
  async function init() {
    $('btn-nova-categoria').onclick = () => abrirModal();
    $('modal-categoria-fechar').onclick = fecharModal;
    $('modal-categoria-cancelar').onclick = fecharModal;
    $('form-categoria').addEventListener('submit', onSubmit);

    // Fecha modal ao clicar fora
    $('modal-categoria').addEventListener('click', (e) => {
      if (e.target.id === 'modal-categoria') fecharModal();
    });

    await carregar();
  }

  return { init };
})();