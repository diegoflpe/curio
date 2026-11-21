/* ============================================================
   CURIÓ PROMOS — BACKUP
   Exportação, importação e restauração em JSON.
   ============================================================ */

const CurioBackup = (() => {

  function $(id) { return document.getElementById(id); }

  // ---------- DOWNLOAD ----------
  function baixarJSON(objeto, nomeArquivo) {
    const blob = new Blob([JSON.stringify(objeto, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function timestampArquivo() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  }

  // ---------- EXPORTAR TUDO ----------
  async function exportarTudo() {
    const btn = $('btn-exportar');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Exportando...';

    try {
      const backup = await CurioDB.exportarTudo();
      const nome = `curio-promos-backup_${timestampArquivo()}.json`;
      baixarJSON(backup, nome);

      const total = Object.values(backup.colecoes)
        .reduce((acc, arr) => acc + arr.length, 0);

      CurioUtils.toast(`Backup exportado: ${total} documento(s).`, 'sucesso');
    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao exportar backup.', 'erro');
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  // ---------- EXPORTAR COLEÇÃO ----------
  async function exportarColecao(nome) {
    try {
      const dados = await CurioDB.exportarColecao(nome);
      const nomeArq = `curio-${nome}_${timestampArquivo()}.json`;
      baixarJSON({
        meta: { app: 'Curió Promos', colecao: nome, exportadoEm: new Date().toISOString() },
        dados
      }, nomeArq);
      CurioUtils.toast(`${dados.length} documento(s) exportado(s).`, 'sucesso');
    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao exportar coleção.', 'erro');
    }
  }

  // ---------- LER ARQUIVO ----------
  function lerArquivo(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const json = JSON.parse(e.target.result);
          resolve(json);
        } catch {
          reject(new Error('Arquivo JSON inválido.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
      reader.readAsText(file);
    });
  }

  // ---------- IMPORTAR ----------
  async function importar() {
    const fileInput = $('input-arquivo');
    const file = fileInput.files[0];
    if (!file) {
      CurioUtils.toast('Selecione um arquivo JSON.', 'aviso');
      return;
    }

    const modo = $('modo-importacao').value;
    if (modo === 'substituir') {
      const ok = confirm(
        '⚠️ MODO SUBSTITUIR\n\nIsso vai APAGAR todos os dados das coleções presentes no arquivo e recriá-los do zero.\n\nDeseja continuar?'
      );
      if (!ok) return;
    }

    const btn = $('btn-importar');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Importando...';

    try {
      const backup = await lerArquivo(file);

      // Aceita dois formatos: backup completo (colecoes) ou coleção única (dados)
      let payload;
      if (backup.colecoes) {
        payload = backup;
      } else if (backup.dados && backup.meta?.colecao) {
        payload = { colecoes: { [backup.meta.colecao]: backup.dados } };
      } else {
        throw new Error('Estrutura de arquivo não reconhecida.');
      }

      const resumo = await CurioDB.importarBackup(payload, modo);
      renderResultado(resumo, modo);
      CurioUtils.toast('Importação concluída.', 'sucesso');
      fileInput.value = '';
    } catch (e) {
      console.error(e);
      CurioUtils.toast(e.message || 'Erro ao importar backup.', 'erro');
    } finally {
      btn.disabled = !fileInput.files[0];
      btn.innerHTML = original;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  // ---------- RESULTADO ----------
  function renderResultado(resumo, modo) {
    const el = $('resultado-importacao');
    const linhas = Object.entries(resumo).map(([col, r]) => `
      <tr>
        <td style="font-weight:600;">${CurioUtils.escapeHtml(col)}</td>
        <td>${r.criados}</td>
        <td>${r.atualizados}</td>
        <td style="color:${r.erros > 0 ? 'var(--vermelho)' : 'inherit'};">${r.erros}</td>
      </tr>
    `).join('');

    el.innerHTML = `
      <h3 style="margin-bottom:0.5rem;font-size:1rem;">
        Resultado da importação (${modo === 'substituir' ? 'Substituir' : 'Mesclar'})
      </h3>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Coleção</th>
              <th>Criados</th>
              <th>Atualizados</th>
              <th>Erros</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;
    el.classList.remove('hidden');
  }

  // ---------- INIT ----------
  async function init() {
    // Exportar tudo
    $('btn-exportar').onclick = exportarTudo;

    // Exportar coleção específica
    document.querySelectorAll('[data-exportar]').forEach(btn => {
      btn.onclick = () => exportarColecao(btn.dataset.exportar);
    });

    // Habilitar botão importar quando arquivo é escolhido
    $('input-arquivo').addEventListener('change', () => {
      $('btn-importar').disabled = !$('input-arquivo').files.length;
    });

    // Importar
    $('btn-importar').onclick = importar;
  }

  return { init };
})();