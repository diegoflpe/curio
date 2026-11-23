/* ============================================================
   CURIÓ PROMOS — GERADOR DE OFERTAS (FORMULÁRIO BLINDADO)
   ============================================================ */

const CurioForm = (() => {

  let categorias = [];
  let lojas = [];
  let templates = [];
  let lojaDetectada = null;
  let textoGerado = "";

  function $(id) { return document.getElementById(id); }

  // ---------- DETECÇÃO DE LOJA ----------
  function detectarLojaPorUrl(url) {
    const u = (url || '').toLowerCase().trim();
    if (!u) return null;
    if (u.includes('shopee.com.br') || u.includes('shope.ee') || u.includes('shopee.com') || u.includes('s.shopee')) return 'Shopee';
    if (u.includes('amazon.com.br') || u.includes('amazon.com') || u.includes('amzn.to') || u.includes('a.co') || u.includes('link.amazon') || u.includes('amzn.eu') || u.includes('amzn.asia')) return 'Amazon';
    if (u.includes('mercadolivre') || u.includes('mercadolibre') || u.includes('ml.com') || u.includes('mercl')) return 'Mercado Livre';
    if (u.includes('magazineluiza') || u.includes('magalu')) return 'Magalu';
    if (u.includes('aliexpress')) return 'AliExpress';
    if (u.includes('casasbahia')) return 'Casas Bahia';
    return 'Outras';
  }

  function atualizarBadgeLoja() {
    const badge = $('badge-loja-detectada');
    const url = $('linkOferta').value;
    lojaDetectada = detectarLojaPorUrl(url);

    if (badge) {
      if (url && lojaDetectada !== 'Outras') {
        badge.textContent = lojaDetectada;
        badge.className = 'badge badge-divulgada';
        badge.style.marginLeft = '0.5rem';
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  // ---------- BUSCA AUTOMÁTICA ----------
  async function buscarDadosLink() {
    const url = $('linkOferta').value.trim();
    if (!url) { CurioUtils.toast('Cole o link primeiro.', 'aviso'); return; }

    const btn = $('btn-buscar-dados');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;"></div>';

    try {
      const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const resp = await fetch(proxy);
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      let titulo = '';
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      if (ogTitle) titulo = ogTitle.getAttribute('content') || '';
      if (!titulo) { const t = doc.querySelector('title'); if (t) titulo = t.textContent || ''; }

      if (titulo) {
        titulo = titulo.replace(/\s*\|\s*Mercado Livre.*$/i, '').replace(/\s*-\s*Mercado Livre.*$/i, '').replace(/^Mercado Livre\s*[-|]\s*/i, '').replace(/\s*\|\s*Shopee.*$/i, '').replace(/\s*-\s*Shopee.*$/i, '').replace(/\s*[-|]\s*Amazon\.com\.br.*$/i, '').replace(/\s*[-|]\s*Amazon\.com.*$/i, '').trim();
        if (!$('produto').value) $('produto').value = titulo;
      }

      let preco = null;
      const ogPrice = doc.querySelector('meta[property="product:price:amount"]');
      if (ogPrice) preco = parseFloat(ogPrice.getAttribute('content'));

      if (!preco) {
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        for (const s of scripts) {
          try {
            const json = JSON.parse(s.textContent);
            if (json.offers?.price) { preco = parseFloat(json.offers.price); break; }
            if (Array.isArray(json.offers) && json.offers[0]?.price) { preco = parseFloat(json.offers[0].price); break; }
          } catch (_) {}
        }
      }
      if (preco && !$('precoPromocional').value) $('precoPromocional').value = preco.toFixed(2);

      CurioUtils.toast('Busca concluída! Confira os dados.', 'sucesso');
    } catch (err) {
      console.warn(err);
      CurioUtils.toast('Site bloqueou a busca. Preencha manualmente.', 'aviso');
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  // ---------- COLAR LINK ----------
  async function colarLink() {
    try {
        const texto = await navigator.clipboard.readText();
        $('linkOferta').value = texto;
        atualizarBadgeLoja();
        CurioUtils.toast('Link colado!', 'sucesso');
        await buscarDadosLink();
    } catch {
        CurioUtils.toast('Permissão negada. Cole manualmente (Ctrl+V).', 'aviso');
    }
  }

  // ---------- SUBMIT (GERAR E SALVAR) ----------
  async function onSubmit(e) {
    e.preventDefault();
    
    const produto = $('produto').value.trim();
    const linkOferta = $('linkOferta').value.trim();
    const precoPromocional = parseFloat($('precoPromocional').value);
    const precoOriginal = parseFloat($('precoOriginal').value) || 0;
    const categoriaId = $('categoria').value;
    const templateId = $('select-template').value;

    if (!linkOferta || !CurioUtils.validarUrl(linkOferta)) { CurioUtils.toast('Link inválido.', 'erro'); return; }
    if (!produto) { CurioUtils.toast('Informe o título.', 'erro'); return; }
    if (!precoPromocional || precoPromocional <= 0) { CurioUtils.toast('Preço atual inválido.', 'erro'); return; }
    if (precoOriginal > 0 && precoOriginal < precoPromocional) { CurioUtils.toast('O Preço Antigo não pode ser menor que o Atual.', 'erro'); return; }
    if (!categoriaId) { CurioUtils.toast('Selecione uma categoria.', 'erro'); return; }
    if (!templateId) { CurioUtils.toast('Selecione um template.', 'erro'); return; }

    const btn = $('btn-gerar');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;"></div> Gerando...';

    try {
      const lojaNome = lojaDetectada || 'Outras';
      const lojaOpt = lojas.find(l => l.nome === lojaNome) || lojas.find(l => l.nome === 'Outras');
      const catOpt = categorias.find(c => c.id === categoriaId);
      const template = templates.find(t => t.id === templateId);

      const dados = {
        produto,
        imagemUrl: '',
        descricao: '',
        precoOriginal: precoOriginal, // Pode ser 0
        precoPromocional,
        desconto: CurioUtils.calcularDesconto(precoOriginal || precoPromocional, precoPromocional),
        lojaId: lojaOpt.id,
        lojaNome: lojaOpt.nome,
        categoriaId,
        categoriaNome: catOpt.nome,
        linkOferta,
        linkAfiliado: linkOferta,
        dataValidade: null,
        observacoes: '',
        status: 'pendente',
        precoPix: $('isPix').checked ? precoPromocional : null,
        cupom: $('cupom').value.trim().toUpperCase() || '',
        precoComCupom: parseFloat($('precoComCupom').value) || null,
        incluirCuponsShopee: false,
        incluirProgramePoupe: false,
        incluirPrime: false,
        comentarioPessoal: $('comentarioPessoal').value.trim()
      };

      textoGerado = CurioDivulgacao.gerar(template.conteudo, dados);
      await CurioDB.criarPromocao(dados);

      $('result-box').textContent = textoGerado;
      $('resultado-area').classList.remove('hidden');
      $('resultado-area').scrollIntoView({ behavior: 'smooth', block: 'center' });
      CurioUtils.toast('Anúncio salvo e gerado!', 'sucesso');

      btn.innerHTML = '<i data-lucide="check"></i> Salvo';
      if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (err) {
      console.error(err);
      CurioUtils.toast(err.message || 'Erro ao salvar.', 'erro');
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="sparkles"></i> Gerar e Salvar Anúncio';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  // ---------- RESETAR (BLINDADO CONTRA ERROS) ----------
  function resetarFormulario() {
    if ($('linkOferta')) $('linkOferta').value = '';
    if ($('produto')) $('produto').value = '';
    if ($('comentarioPessoal')) $('comentarioPessoal').value = '';
    if ($('precoPromocional')) $('precoPromocional').value = '';
    if ($('precoOriginal')) $('precoOriginal').value = '';
    if ($('cupom')) $('cupom').value = '';
    if ($('precoComCupom')) $('precoComCupom').value = '';
    if ($('categoria')) $('categoria').value = '';
    if ($('isPix')) $('isPix').checked = false;

    if ($('resultado-area')) $('resultado-area').classList.add('hidden');
    if ($('badge-loja-detectada')) $('badge-loja-detectada').classList.add('hidden');

    const btn = $('btn-gerar');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="sparkles"></i> Gerar e Salvar Anúncio';
    }
    
    textoGerado = "";
    lojaDetectada = null;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { if ($('linkOferta')) $('linkOferta').focus(); }, 300);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ---------- AÇÕES PÓS-GERAÇÃO ----------
  function bindResultActions() {
    $('btn-copiar').onclick = async () => {
      if (!textoGerado) return;
      const ok = await CurioUtils.copiarTexto(textoGerado);
      if (ok) {
        CurioUtils.toast('Copiado! Limpando para o próximo...', 'sucesso');
        setTimeout(resetarFormulario, 300);
      }
    };

    $('btn-whatsapp').onclick = () => {
      if (!textoGerado) return;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textoGerado)}`, '_blank');
      setTimeout(resetarFormulario, 500);
    };
  }

  // ---------- INIT ----------
  async function init() {
    try {
      // Adiciona o try/catch individual para não quebrar tudo se um falhar
      try { categorias = await CurioDB.listarCategorias(); } catch(e) { console.warn(e); }
      try { lojas = await CurioDB.listarLojas(); } catch(e) { console.warn(e); }
      try { templates = await CurioDB.listarTemplates(); } catch(e) { console.warn(e); }

      // Categorias
      const selCat = $('categoria');
      if (selCat) {
        categorias.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.nome;
          selCat.appendChild(opt);
        });
      }

      // Templates
      const selTpl = $('select-template');
      if (selTpl) {
        templates.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.nome + (t.padrao ? ' ⭐' : '');
          selTpl.appendChild(opt);
        });
        const padraoT = templates.find(t => t.padrao) || templates[0];
        if (padraoT) selTpl.value = padraoT.id;
      }

      // Eventos
      if ($('linkOferta')) $('linkOferta').addEventListener('input', atualizarBadgeLoja);
      if ($('btn-colar-link')) $('btn-colar-link').onclick = colarLink;
      if ($('btn-buscar-dados')) $('btn-buscar-dados').onclick = buscarDadosLink;
      if ($('cupom')) $('cupom').addEventListener('input', (e) => e.target.value = e.target.value.toUpperCase());
      
      document.querySelectorAll('[data-comentario]').forEach(btn => {
        btn.onclick = () => {
          if ($('comentarioPessoal')) $('comentarioPessoal').value = btn.dataset.comentario;
          CurioUtils.toast('Comentário aplicado!', 'sucesso');
        };
      });

      bindResultActions();
      if ($('form-promocao')) $('form-promocao').addEventListener('submit', onSubmit);

      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
      console.error("Erro real:", e);
      CurioUtils.toast('Erro ao inicializar formulário.', 'erro');
    }
  }

  return { init };
})();
