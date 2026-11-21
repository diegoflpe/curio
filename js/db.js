/* ============================================================
   CURIÓ PROMOS — CAMADA DE BANCO (Firestore)
   ============================================================ */

const CurioDB = (() => {

  // ---------- CATEGORIAS ----------
  async function listarCategorias() {
    const snap = await db.collection('categorias').orderBy('nome').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function criarCategoria(nome) {
    return db.collection('categorias').add({
      nome: nome.trim(),
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function atualizarCategoria(id, nome) {
    return db.collection('categorias').doc(id).update({
      nome: nome.trim(),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function excluirCategoria(id) {
    return db.collection('categorias').doc(id).delete();
  }

  // ---------- LOJAS ----------
  async function listarLojas() {
    const snap = await db.collection('lojas').orderBy('nome').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function criarLoja(nome) {
    return db.collection('lojas').add({
      nome: nome.trim(),
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function atualizarLoja(id, nome) {
    return db.collection('lojas').doc(id).update({
      nome: nome.trim(),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function excluirLoja(id) {
    return db.collection('lojas').doc(id).delete();
  }

  // ---------- PROMOÇÕES ----------
  async function listarPromocoes() {
    const snap = await db.collection('promocoes').orderBy('criadoEm', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function obterPromocao(id) {
    const doc = await db.collection('promocoes').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async function criarPromocao(dados) {
    return db.collection('promocoes').add({
      ...dados,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function atualizarPromocao(id, dados) {
    return db.collection('promocoes').doc(id).update({
      ...dados,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function excluirPromocao(id) {
    return db.collection('promocoes').doc(id).delete();
  }

  async function duplicarPromocao(id) {
    const original = await obterPromocao(id);
    if (!original) throw new Error('Promoção não encontrada.');
    const { id: _, criadoEm, atualizadoEm, ...dados } = original;
    return criarPromocao({
      ...dados,
      produto: `${dados.produto} (cópia)`,
      status: 'pendente'
    });
  }

  async function contarPromocoes() {
    const snap = await db.collection('promocoes').get();
    return snap.size;
  }

  async function limparPromocoesAntigas() {
    try {
      const limite = new Date();
      limite.setDate(limite.getDate() - 7);
      const limiteTimestamp = firebase.firestore.Timestamp.fromDate(limite);

      const snap = await db.collection('promocoes')
        .where('criadoEm', '<', limiteTimestamp)
        .get();

      if (snap.empty) return;

      const chunks = [];
      for (let i = 0; i < snap.docs.length; i += 400) {
        chunks.push(snap.docs.slice(i, i + 400));
      }
      let total = 0;
      for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
        total += chunk.length;
      }
      console.log(`🗑️ ${total} promoções antigas (mais de 7 dias) excluídas.`);
    } catch (e) {
      console.warn('Erro na limpeza automática:', e);
    }
  }

  // ---------- TEMPLATES ----------
  async function listarTemplates() {
    const snap = await db.collection('templates').orderBy('criadoEm', 'asc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function obterTemplate(id) {
    const doc = await db.collection('templates').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async function criarTemplate(dados) {
    if (dados.padrao) await desmarcarTemplatesPadrao();
    return db.collection('templates').add({
      nome: dados.nome.trim(),
      conteudo: dados.conteudo,
      padrao: !!dados.padrao,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function atualizarTemplate(id, dados) {
    if (dados.padrao) await desmarcarTemplatesPadrao(id);
    return db.collection('templates').doc(id).update({
      nome: dados.nome.trim(),
      conteudo: dados.conteudo,
      padrao: !!dados.padrao,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function excluirTemplate(id) {
    return db.collection('templates').doc(id).delete();
  }

  async function desmarcarTemplatesPadrao(excetoId = null) {
    const snap = await db.collection('templates').where('padrao', '==', true).get();
    if (snap.empty) return;
    const batch = db.batch();
    snap.docs.forEach(doc => {
      if (doc.id !== excetoId) {
        batch.update(doc.ref, { padrao: false });
      }
    });
    await batch.commit();
  }

  async function obterTemplatePadrao() {
    const snap = await db.collection('templates').where('padrao', '==', true).limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }

  // ---------- CONFIGURAÇÕES ----------
  async function obterConfiguracoes() {
    const doc = await db.collection('configuracoes').doc('app').get();
    if (!doc.exists) {
      const padrao = {
        nomeApp: 'Curió Promos',
        templatePadraoId: '',
        preferencias: { mostrarImagensCards: true, confirmarExclusao: true },
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('configuracoes').doc('app').set(padrao);
      return padrao;
    }
    return { id: doc.id, ...doc.data() };
  }

  async function salvarConfiguracoes(dados) {
    return db.collection('configuracoes').doc('app').set({
      ...dados,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  // ---------- HISTÓRICO ----------
  async function registrarDivulgacao(dados) {
    return db.collection('historico_divulgacao').add({
      promocaoId: dados.promocaoId,
      produto: dados.produto,
      dataHora: firebase.firestore.FieldValue.serverTimestamp(),
      linkUtilizado: dados.linkUtilizado || '',
      templateId: dados.templateId || '',
      templateNome: dados.templateNome || '',
      mensagemGerada: dados.mensagemGerada || '',
      status: dados.status || 'copiado'
    });
  }

  async function listarHistorico() {
    const snap = await db.collection('historico_divulgacao')
      .orderBy('dataHora', 'desc')
      .limit(500)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // ---------- SEED ----------
    async function seedInicial() {
    const catSnap = await db.collection('categorias').limit(1).get();
    if (catSnap.empty) {
      const categorias = ['Eletrônicos', 'Informática', 'Casa', 'Cozinha', 'Moda', 'Beleza', 'Games', 'Acessórios', 'Eletrodomésticos', 'Outros'];
      const batch = db.batch();
      categorias.forEach(nome => batch.set(db.collection('categorias').doc(), { nome, criadoEm: firebase.firestore.FieldValue.serverTimestamp() }));
      await batch.commit();
    }

    const lojaSnap = await db.collection('lojas').limit(1).get();
    if (lojaSnap.empty) {
      const lojas = ['Amazon', 'Shopee', 'Mercado Livre', 'Magalu', 'AliExpress', 'Casas Bahia', 'Outras'];
      const batch = db.batch();
      lojas.forEach(nome => batch.set(db.collection('lojas').doc(), { nome, criadoEm: firebase.firestore.FieldValue.serverTimestamp() }));
      await batch.commit();
    }

    const tplSnap = await db.collection('templates').limit(1).get();
    if (tplSnap.empty) {
      const modelos = [
        {
          nome: '🐦 Padrão Curió Promos',
          padrao: true,
          conteudo: `{comentario}

🐦 {produto}

❌ De: {preco_original_tachado}
✅ Por: {preco_promocional} ({desconto}% OFF 🔥)

👉 {link}

⚡ Aproveite! Condição especial por tempo limitado.`
        }
      ];
      const batch = db.batch();
      modelos.forEach(m => batch.set(db.collection('templates').doc(), { ...m, criadoEm: firebase.firestore.FieldValue.serverTimestamp() }));
      await batch.commit();
    }
  }

  // ---------- BACKUP ----------
  async function exportarColecao(nomeColecao) {
    const snap = await db.collection(nomeColecao).get();
    return snap.docs.map(d => {
      const data = d.data();
      const out = { id: d.id };
      Object.keys(data).forEach(k => {
        const v = data[k];
        if (v && typeof v.toDate === 'function') out[k] = v.toDate().toISOString();
        else out[k] = v;
      });
      return out;
    });
  }

  async function exportarTudo() {
    const [promocoes, categorias, lojas, templates, historico, configuracoes] = await Promise.all([
      exportarColecao('promocoes'), exportarColecao('categorias'), exportarColecao('lojas'),
      exportarColecao('templates'), exportarColecao('historico_divulgacao'), exportarColecao('configuracoes')
    ]);
    return { meta: { app: 'Curió Promos', versao: '1.0', exportadoEm: new Date().toISOString() }, colecoes: { promocoes, categorias, lojas, templates, historico_divulgacao: historico, configuracoes } };
  }

  async function importarBackup(backup, modo = 'merge') {
    if (!backup || !backup.colecoes) throw new Error('Arquivo de backup inválido.');
    const resumo = {};
    for (const nome of Object.keys(backup.colecoes)) {
      const docs = backup.colecoes[nome];
      if (!Array.isArray(docs)) continue;
      resumo[nome] = { criados: 0, atualizados: 0, erros: 0 };

      if (modo === 'substituir') {
        const existentes = await db.collection(nome).get();
        const batchDel = db.batch();
        existentes.docs.forEach(d => batchDel.delete(d.ref));
        if (!existentes.empty) await batchDel.commit();
      }

      for (let i = 0; i < docs.length; i += 400) {
        const chunk = docs.slice(i, i + 400);
        const batch = db.batch();
        for (const doc of chunk) {
          try {
            const { id, ...resto } = doc;
            const dadosFinal = {};
            Object.keys(resto).forEach(k => {
              const v = resto[k];
              if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
                const dt = new Date(v);
                if (!isNaN(dt.getTime())) { dadosFinal[k] = firebase.firestore.Timestamp.fromDate(dt); return; }
              }
              dadosFinal[k] = v;
            });
            if (modo === 'substituir' || !id) {
              batch.set(id ? db.collection(nome).doc(id) : db.collection(nome).doc(), dadosFinal);
              resumo[nome].criados++;
            } else {
              batch.set(db.collection(nome).doc(id), dadosFinal, { merge: true });
              resumo[nome].atualizados++;
            }
          } catch (e) { resumo[nome].erros++; }
        }
        await batch.commit();
      }
    }
    return resumo;
  }

  async function limparColecao(nomeColecao) {
    const snap = await db.collection(nomeColecao).get();
    if (snap.empty) return 0;
    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 400) chunks.push(snap.docs.slice(i, i + 400));
    let total = 0;
    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
      total += chunk.length;
    }
    return total;
  }

  return {
    listarCategorias, criarCategoria, atualizarCategoria, excluirCategoria,
    listarLojas, criarLoja, atualizarLoja, excluirLoja,
    listarPromocoes, obterPromocao, criarPromocao, atualizarPromocao, excluirPromocao, duplicarPromocao, contarPromocoes, limparPromocoesAntigas,
    listarTemplates, obterTemplate, criarTemplate, atualizarTemplate, excluirTemplate, desmarcarTemplatesPadrao, obterTemplatePadrao,
    obterConfiguracoes, salvarConfiguracoes,
    registrarDivulgacao, listarHistorico,
    seedInicial,
    exportarTudo, exportarColecao, importarBackup, limparColecao
  };
})();