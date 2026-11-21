/* ============================================================
   CURIÓ PROMOS — LOJAS
   CRUD completo com proteção contra exclusão em uso.
   ============================================================ */

const CurioLojas = (() => {

  let lojas = [];
  let editandoId = null;
  let contagemPromocoesPorLoja = {};

  function $(id) { return document.getElementById(id); }

  // ---------- CONTAGEM DE USO ----------
  async function carregarContagemUso() {
    try {
      const promocoes = await CurioDB.listarPromocoes();
      contagemPromocoesPorLoja = {};
      promocoes.forEach(p => {
        const key = p.lojaId || '_sem_id_';
        contagemPromocoesPorLoja[key] = (contagemPromocoesPorLoja[key] || 0) + 1;
      });
    } catch (e) {
      console.warn('Erro ao contar uso de lojas:', e);
    }
  }

  function usoLoja(lojaId) {
    return contagemPromocoesPorLoja[lojaId] || 0;
  }

  // ---------- RENDER ----------
  function render() {
    const container = $('lista-lojas');
    const contador = $('contador-lojas');
    if (!container) return;

    if (contador) {
      contador.textContent = `${lojas.length} loja(s) cadastrada(s).`;
    }

    if (lojas.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <i data-lucide="store" style="width:48px;height:48px;margin:0 auto 1rem;color:#CBD5E1;"></i>
            <h3>Nenhuma loja</h3>
            <p>Cadastre a primeira loja para vincular às promoções.</p>
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
              ${lojas.map(l => {
                const uso = usoLoja(l.id);
                const bloqueado = uso > 0;
                return `
                  <tr>
                    <td style="font-weight:600;">${CurioUtils.escapeHtml(l.nome)}</td>
                    <td>
                      <span class="badge ${uso > 0 ? 'badge-divulgada' : 'badge-pendente'}">
                        ${uso} ${uso === 1 ? 'promoção' : 'promoções'}
                      </span>
                    </td>
                    <td style="text-align:right;">
                      <div class="flex gap-sm" style="justify-content:flex-end;">
                        <button class="btn btn-ghost btn-sm btn-editar" data-id="${l.id}" data-nome="${CurioUtils.escapeHtml(l.nome)}" title="Editar">
                          <i data-lucide="pencil" style="width:14px;height:14px;"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-excluir" data-id="${l.id}" data-nome="${CurioUtils.escapeHtml(l.nome)}" data-uso="${uso}" title="${bloqueado ? 'Loja em uso — não pode ser excluída' : 'Excluir'}" style="color:${bloqueado ? '#CBD5E1' : 'var(--vermelho)'};" ${bloqueado ? 'disabled' : ''}>
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
    $('modal-loja-titulo').textContent = id ? 'Editar loja' : 'Nova loja';
    $('loja-nome').value = nome;
    $('modal-loja').classList.remove('hidden');
    setTimeout(() => $('loja-nome').focus(), 50);
  }

  function fecharModal() {
    editandoId = null;
    $('modal-loja').classList.add('hidden');
    $('form-loja').reset();
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
          CurioUtils.toast('Esta loja está em uso e não pode ser excluída.', 'aviso');
          return;
        }
        const nome = btn.dataset.nome;
        if (!confirm(`Excluir a loja "${nome}"?`)) return;
        try {
          await CurioDB.excluirLoja(btn.dataset.id);
          CurioUtils.toast('Loja excluída.', 'sucesso');
          await carregar();
        } catch (e) {
          CurioUtils.toast('Erro ao excluir loja.', 'erro');
        }
      };
    });
  }

  // ---------- SUBMIT ----------
  async function onSubmit(e) {
    e.preventDefault();
    const nome = $('loja-nome').value.trim();
    if (!nome) {
      CurioUtils.toast('Informe o nome da loja.', 'aviso');
      return;
    }

    const duplicada = lojas.some(l =>
      l.nome.toLowerCase() === nome.toLowerCase() && l.id !== editandoId
    );
    if (duplicada) {
      CurioUtils.toast('Já existe uma loja com esse nome.', 'aviso');
      return;
    }

    const btn = $('modal-loja-salvar');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      if (editandoId) {
        await CurioDB.atualizarLoja(editandoId, nome);
        CurioUtils.toast('Loja atualizada.', 'sucesso');
      } else {
        await CurioDB.criarLoja(nome);
        CurioUtils.toast('Loja criada.', 'sucesso');
      }
      fecharModal();
      await carregar();
    } catch (err) {
      CurioUtils.toast('Erro ao salvar loja.', 'erro');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  }

  // ---------- CARREGAR ----------
  async function carregar() {
    try {
      lojas = await CurioDB.listarLojas();
      await carregarContagemUso();
      render();
    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao carregar lojas.', 'erro');
    }
  }

  // ---------- INIT ----------
  async function init() {
    $('btn-nova-loja').onclick = () => abrirModal();
    $('modal-loja-fechar').onclick = fecharModal;
    $('modal-loja-cancelar').onclick = fecharModal;
    $('form-loja').addEventListener('submit', onSubmit);

    $('modal-loja').addEventListener('click', (e) => {
      if (e.target.id === 'modal-loja') fecharModal();
    });

    await carregar();
  }

  return { init };
})();