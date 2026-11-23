/* ============================================================
   CURIÓ PROMOS — CAMADA DE BANCO (Firestore)
   ============================================================ */

const CurioDB = (() => {

  async function listarCategorias() {
    const snap = await db.collection('categorias').orderBy('nome').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function criarCategoria(nome) {
    return db.collection('categorias').add({ nome: nome.trim(), criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
  }

  async function atualizarCategoria(id, nome) {
    return db.collection('categorias').doc(id).update({ nome: nome.trim(), atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() });
  }

  async function excluirCategoria(id) {
    return db.collection('categorias').doc(id).delete();
  }

  async function listarLojas() {
    const snap = await db.collection('lojas').orderBy('nome').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function criarLoja(nome) {
    return db.collection('lojas').add({ nome: nome.trim(), criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
  }

  async function atualizarLoja(id, nome) {
    return db.collection('lojas').doc(id).update({ nome: nome.trim(), atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() });
  }

  async function excluirLoja(id) {
    return db.collection('lojas').doc(id).delete();
  }

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
    return criarPromocao({ ...dados, produto: `${dados.produto} (cópia)`, status: 'pendente' });
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

      const snap = await db.collection('promocoes').where('criadoEm', '<', limiteTimestamp).get();
      if (snap.empty) return;

      const chunks = [];
      for (let i = 0; i < snap.docs.length; i += 400) chunks.push(snap.docs.slice(i, i + 400));
      
      for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      console.log(`🗑️ Promoções antigas excluídas.`);
    } catch (e) {
      console.warn('Erro na limpeza:', e);
    }
  }

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
    return db.collection('templates').add({ nome: dados.nome.trim(), conteudo: dados.conteudo, padrao: !!dados.padrao, criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
  }

  async function atualizarTemplate(id, dados) {
    if (dados.padrao) await desmarcarTemplatesPadrao(id);
    return db.collection('templates').doc(id).update({ nome: dados.nome.trim(), conteudo: dados.conteudo, padrao: !!dados.padrao, atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() });
  }

  async function excluirTemplate(id) {
    return db.collection('templates').doc(id).delete();
  }

  async function desmarcarTemplatesPadrao(excetoId = null) {
    const snap = await db.collection('templates').where('padrao', '==', true).get();
    if (snap.empty) return;
    const batch = db.batch();
    snap.docs.forEach(doc => { if (doc.id !== excetoId) batch.update(doc.ref, { padrao: false }); });
    await batch.commit();
  }

  async function obterTemplatePadrao() {
    const snap = await db.collection('templates').where('padrao', '==', true).limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }

  async function obterConfiguracoes() {
    const doc = await db.collection('configuracoes').doc('app').get();
    if (!doc.exists) {
      const padrao = { nomeApp: 'Curió Promos', templatePadraoId: '', preferencias: { mostrarImagensCards: true, confirmarExclusao: true }, criadoEm: firebase.firestore.FieldValue.serverTimestamp() };
      await db.collection('configuracoes').doc('app').set(padrao);
      return padrao;
    }
    return { id: doc.id, ...doc.data() };
  }

  async function salvarConfiguracoes(dados) {
    return db.collection('configuracoes').doc('app').set({ ...dados, atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  async function registrarDivulgacao(dados) {
    return db.collection('historico_divulgacao').add({
      promocaoId: dados.promocaoId, produto: dados.produto, dataHora: firebase.firestore.FieldValue.serverTimestamp(),
      linkUtilizado: dados.linkUtilizado || '', templateId: dados.templateId || '', templateNome: dados.templateNome || '',
      mensagemGerada: dados.mensagemGerada || '', status: dados.status || 'copiado'
    });
  }

  async function listarHistorico() {
    const snap = await db.collection('historico_divulgacao').orderBy('dataHora', 'desc').limit(500).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

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

{preco_original_tachado}
✅ Por: {preco_promocional} ({desconto})

👉 {link}`
        }
      ];
      const batch = db.batch();
      modelos.forEach(m => batch.set(db.collection('templates').doc(), { ...m, criadoEm: firebase.firestore.FieldValue.serverTimestamp() }));
      await batch.commit();
    }
  }

  return {
    listarCategorias, criarCategoria, atualizarCategoria, excluirCategoria,
    listarLojas, criarLoja, atualizarLoja, excluirLoja,
    listarPromocoes, obterPromocao, criarPromocao, atualizarPromocao, excluirPromocao, duplicarPromocao, contarPromocoes, limparPromocoesAntigas,
    listarTemplates, obterTemplate, criarTemplate, atualizarTemplate, excluirTemplate, desmarcarTemplatesPadrao, obterTemplatePadrao,
    obterConfiguracoes, salvarConfiguracoes,
    registrarDivulgacao, listarHistorico,
    seedInicial
  };
})();
