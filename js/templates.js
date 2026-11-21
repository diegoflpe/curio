/* ============================================================
   CURIÓ PROMOS — TEMPLATES
   CRUD com definição de padrão e restauração forçada.
   ============================================================ */

const CurioTemplates = (() => {

  let templates = [];
  let editandoId = null;

  function $(id) { return document.getElementById(id); }

  // ---------- RENDER ----------
  function render() {
    const container = $('lista-templates');
    const contador = $('contador-templates');
    if (!container) return;

    if (contador) {
      contador.textContent = `${templates.length} template(s) cadastrado(s).`;
    }

    if (templates.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <i data-lucide="message-square" style="width:48px;height:48px;margin:0 auto 1rem;color:var(--text-muted);"></i>
            <h3>Nenhum template</h3>
            <p>Clique em "Restaurar Padrão" para criar o modelo base do Curió Promos.</p>
          </div>
        </div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem;">
        ${templates.map(t => `
          <div class="card" style="display:flex;flex-direction:column;${t.padrao ? 'border:2px solid var(--verde-whats);' : ''}">
            <div class="flex-between" style="margin-bottom:0.5rem;">
              <h4 style="font-size:0.9375rem;">${CurioUtils.escapeHtml(t.nome)}</h4>
              ${t.padrao ? '<span class="badge" style="background:#DCFCE7;color:#166534;">Padrão</span>' : ''}
            </div>
            <pre style="background:var(--bg-body);padding:0.75rem;border-radius:var(--raio-sm);font-family:monospace;font-size:0.8125rem;white-space:pre-wrap;word-break:break-word;flex:1;color:var(--text-main);max-height:200px;overflow-y:auto;border:1px solid var(--border-color);">${CurioUtils.escapeHtml(t.conteudo)}</pre>
            <div class="flex gap-sm" style="margin-top:0.75rem;flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm btn-editar" data-id="${t.id}" style="flex:1;">
                <i data-lucide="pencil" style="width:14px;height:14px;"></i> Editar
              </button>
              ${!t.padrao ? `
                <button class="btn btn-ghost btn-sm btn-padrao" data-id="${t.id}" title="Definir como padrão">
                  <i data-lucide="star" style="width:14px;height:14px;"></i>
                </button>
              ` : ''}
              <button class="btn btn-ghost btn-sm btn-excluir" data-id="${t.id}" data-nome="${CurioUtils.escapeHtml(t.nome)}" style="color:#EF4444;" title="Excluir">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindAcoes();
  }

  // ---------- MODAL ----------
  function abrirModal(id = null) {
    editandoId = id;
    const t = id ? templates.find(x => x.id === id) : null;
    $('modal-template-titulo').textContent = id ? 'Editar template' : 'Novo template';
    $('template-nome').value = t ? t.nome : '';
    $('template-conteudo').value = t ? t.conteudo : '';
    $('template-padrao').checked = t ? !!t.padrao : false;
    $('modal-template').classList.remove('hidden');
    setTimeout(() => $('template-nome').focus(), 50);
  }

  function fecharModal() {
    editandoId = null;
    $('modal-template').classList.add('hidden');
    $('form-template').reset();
  }

  // ---------- AÇÕES ----------
  function bindAcoes() {
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.onclick = () => abrirModal(btn.dataset.id);
    });

    document.querySelectorAll('.btn-padrao').forEach(btn => {
      btn.onclick = async () => {
        try {
          const t = templates.find(x => x.id === btn.dataset.id);
          await CurioDB.atualizarTemplate(t.id, { nome: t.nome, conteudo: t.conteudo, padrao: true });
          CurioUtils.toast('Template padrão atualizado.', 'sucesso');
          await carregar();
        } catch (e) {
          CurioUtils.toast('Erro ao definir padrão.', 'erro');
        }
      };
    });

    document.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.onclick = async () => {
        const t = templates.find(x => x.id === btn.dataset.id);
        if (t && t.padrao) {
          CurioUtils.toast('Defina outro template como padrão antes de excluir este.', 'aviso');
          return;
        }
        if (!confirm(`Excluir o template "${btn.dataset.nome}"?`)) return;
        try {
          await CurioDB.excluirTemplate(btn.dataset.id);
          CurioUtils.toast('Template excluído.', 'sucesso');
          await carregar();
        } catch (e) {
          CurioUtils.toast('Erro ao excluir.', 'erro');
        }
      };
    });
  }

  // ---------- SUBMIT ----------
  async function onSubmit(e) {
    e.preventDefault();
    const nome = $('template-nome').value.trim();
    const conteudo = $('template-conteudo').value.trim();
    const padrao = $('template-padrao').checked;

    if (!nome || !conteudo) {
      CurioUtils.toast('Preencha nome e conteúdo.', 'aviso');
      return;
    }

    const btn = $('modal-template-salvar');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      if (editandoId) {
        await CurioDB.atualizarTemplate(editandoId, { nome, conteudo, padrao });
        CurioUtils.toast('Template atualizado.', 'sucesso');
      } else {
        await CurioDB.criarTemplate({ nome, conteudo, padrao });
        CurioUtils.toast('Template criado.', 'sucesso');
      }
      fecharModal();
      await carregar();
    } catch (err) {
      CurioUtils.toast('Erro ao salvar template.', 'erro');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  }

  // ---------- CARREGAR ----------
  async function carregar() {
    try {
      templates = await CurioDB.listarTemplates();
      render();
    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao carregar templates.', 'erro');
    }
  }

  // ---------- INIT ----------
  async function init() {
    $('btn-novo-template').onclick = () => abrirModal();
    $('modal-template-fechar').onclick = fecharModal;
    $('modal-template-cancelar').onclick = fecharModal;
    $('form-template').addEventListener('submit', onSubmit);

    $('modal-template').addEventListener('click', (e) => {
      if (e.target.id === 'modal-template') fecharModal();
    });

    // NOVO: Botão Restaurar Padrão
    $('btn-forcar-template').onclick = async () => {
      if (!confirm('⚠️ Isso apagará todos os seus templates atuais e criará o modelo oficial do Curió Promos.\n\nDeseja continuar?')) return;
      
      const btn = $('btn-forcar-template');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;"></div>';

      try {
        const snap = await db.collection('templates').get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        
        // Chama o Seed do db.js que contém o novo modelo
        await CurioDB.seedInicial();
        
        CurioUtils.toast('Template Padrão restaurado com sucesso!', 'sucesso');
        await carregar();
      } catch (e) {
        console.error(e);
        CurioUtils.toast('Erro ao restaurar templates.', 'erro');
      } finally {
        btn.disabled = false;
        btn.innerHTML = original;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    };

    await carregar();
  }

  return { init };
})();