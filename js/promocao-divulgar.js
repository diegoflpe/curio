/* ============================================================
   CURIÓ PROMOS — DIVULGAR PROMOÇÃO
   Gera mensagem por template, permite editar, copiar, abrir
   WhatsApp, exportar imagem e registra no histórico.
   ============================================================ */

const CurioDivulgar = (() => {

  let promocao = null;
  let templates = [];
  let templateAtual = null;
  let jaRegistrouDivulgacao = false;

  function $(id) { return document.getElementById(id); }

  // ---------- PREVIEW DO CARD ----------
  function renderPreview() {
    if (!promocao) return;

    $('titulo-produto').textContent = promocao.produto || '—';
    $('subtitulo-produto').textContent =
      `${promocao.lojaNome || '—'} · ${promocao.categoriaNome || '—'}`;

    const img = promocao.imagemUrl
      ? `<img src="${CurioUtils.escapeHtml(promocao.imagemUrl)}"
              style="width:100%;max-height:180px;object-fit:cover;border-radius:var(--raio-sm);margin-bottom:0.75rem;"
              onerror="this.style.display='none'">`
      : '';

    let pixBadge = '';
    if (promocao.precoPix) {
      pixBadge = `<div class="text-small" style="margin-top:0.25rem;color:#0E7490;">
        💠 Pix: <strong>${CurioUtils.formatarMoeda(promocao.precoPix)}</strong></div>`;
    }

    let cupomBadge = '';
    if (promocao.cupom) {
      cupomBadge = `<div class="text-small" style="margin-top:0.25rem;">
        🎟️ Cupom: <code>${CurioUtils.escapeHtml(promocao.cupom)}</code>
        ${promocao.precoComCupom ? ` → <strong>${CurioUtils.formatarMoeda(promocao.precoComCupom)}</strong>` : ''}
      </div>`;
    }

    $('preview-promocao').innerHTML = `
      ${img}
      <div class="flex-between" style="margin-bottom:0.5rem;">
        <span class="badge badge-${promocao.status || 'pendente'}">${promocao.status || 'pendente'}</span>
        <span class="text-small text-muted">${CurioUtils.escapeHtml(promocao.lojaNome || '—')}</span>
      </div>
      <div style="font-size:0.875rem;">
        <div class="text-muted text-small" style="text-decoration:line-through;">
          ${CurioUtils.formatarMoeda(promocao.precoOriginal)}
        </div>
        <div class="flex gap-sm" style="align-items:baseline;">
          <span style="font-size:1.25rem;font-weight:700;color:var(--azul-marinho);">
            ${CurioUtils.formatarMoeda(promocao.precoPromocional)}
          </span>
          <span class="badge" style="background:#DCFCE7;color:#166534;">
            -${promocao.desconto || 0}%
          </span>
        </div>
        ${pixBadge}
        ${cupomBadge}
      </div>
    `;
  }

  // ---------- MENSAGEM ----------
  function atualizarMensagem() {
    if (!promocao || !templateAtual) return;
    const msg = CurioDivulgacao.gerar(templateAtual.conteudo, promocao);
    $('mensagem-editavel').value = msg;
    $('preview-mensagem').textContent = msg || 'Selecione um template...';
  }

  // ---------- SELECT ----------
  async function preencherTemplates() {
    const sel = $('select-template');
    sel.innerHTML = '';

    if (templates.length === 0) {
      sel.innerHTML = '<option value="">Nenhum template cadastrado</option>';
      $('mensagem-editavel').value = '';
      $('preview-mensagem').textContent =
        'Cadastre um template em Templates para gerar mensagens.';
      return;
    }

    templates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.nome + (t.padrao ? ' ⭐' : '');
      sel.appendChild(opt);
    });

    // Prioriza template das configurações, senão o ⭐, senão o primeiro
    let escolhido = null;
    try {
      const cfg = await CurioDB.obterConfiguracoes();
      if (cfg && cfg.templatePadraoId) {
        escolhido = templates.find(t => t.id === cfg.templatePadraoId) || null;
      }
    } catch (e) { console.warn(e); }

    if (!escolhido) escolhido = templates.find(t => t.padrao) || templates[0];

    sel.value = escolhido.id;
    templateAtual = escolhido;

    if (!sel.dataset.listenerAtivo) {
      sel.addEventListener('change', () => {
        templateAtual = templates.find(t => t.id === sel.value) || null;
        atualizarMensagem();
      });
      sel.dataset.listenerAtivo = 'true';
    }
  }

  // ---------- REGISTRO ----------
  async function registrar(status) {
    if (!promocao || !templateAtual) return;
    const msg = $('mensagem-editavel').value.trim();
    if (!msg) return;

    try {
      await CurioDB.registrarDivulgacao({
        promocaoId: promocao.id,
        produto: promocao.produto,
        linkUtilizado: promocao.linkAfiliado || promocao.linkOferta || '',
        templateId: templateAtual.id,
        templateNome: templateAtual.nome,
        mensagemGerada: msg,
        status
      });

      if (!jaRegistrouDivulgacao && promocao.status !== 'divulgada') {
        await CurioDB.atualizarPromocao(promocao.id, {
          ...extrairCamposEditaveis(promocao),
          status: 'divulgada'
        });
        jaRegistrouDivulgacao = true;
        promocao.status = 'divulgada';
        renderPreview();
      }
    } catch (e) {
      console.warn('Erro ao registrar:', e);
    }
  }

  function extrairCamposEditaveis(p) {
    return {
      produto: p.produto,
      imagemUrl: p.imagemUrl || '',
      descricao: p.descricao || '',
      precoOriginal: p.precoOriginal,
      precoPromocional: p.precoPromocional,
      desconto: p.desconto,
      lojaId: p.lojaId,
      lojaNome: p.lojaNome,
      categoriaId: p.categoriaId,
      categoriaNome: p.categoriaNome,
      linkOferta: p.linkOferta,
      linkAfiliado: p.linkAfiliado || '',
      dataValidade: p.dataValidade || null,
      observacoes: p.observacoes || '',
      precoPix: p.precoPix || null,
      cupom: p.cupom || '',
      precoComCupom: p.precoComCupom || null,
      incluirCuponsShopee: !!p.incluirCuponsShopee,
      incluirProgramePoupe: !!p.incluirProgramePoupe,
      incluirPrime: !!p.incluirPrime,
      comentarioPessoal: p.comentarioPessoal || ''
    };
  }

  // ---------- EXPORTAR IMAGEM ----------
  async function exportarImagem() {
    if (!promocao) return;

    const cp = $('card-preview');

    // Preenche o card oculto
    $('cp-comment').textContent = promocao.comentarioPessoal || '';
    $('cp-comment').style.display = promocao.comentarioPessoal ? 'block' : 'none';
    $('cp-title').textContent = promocao.produto || '';

    // Imagem do produto
    if (promocao.imagemUrl) {
      $('cp-img-wrap').innerHTML =
        `<img src="${CurioUtils.escapeHtml(promocao.imagemUrl)}" crossorigin="anonymous" alt="">`;
      $('cp-img-wrap').style.display = 'block';
    } else {
      $('cp-img-wrap').innerHTML = '';
      $('cp-img-wrap').style.display = 'none';
    }

    $('cp-old').textContent = `De: ${CurioUtils.formatarMoeda(promocao.precoOriginal)}`;
    $('cp-new').innerHTML =
      `Por: ${CurioUtils.formatarMoeda(promocao.precoPromocional)}
       <span class="cp-off">-${promocao.desconto || 0}%</span>`;

    if (promocao.precoPix) {
      $('cp-pix').textContent = `💠 ${CurioUtils.formatarMoeda(promocao.precoPix)} no Pix`;
      $('cp-pix').style.display = 'inline-block';
    } else {
      $('cp-pix').style.display = 'none';
    }

    if (promocao.cupom) {
      $('cp-coupon').innerHTML = `🎟️ CUPOM: <code>${CurioUtils.escapeHtml(promocao.cupom)}</code>`;
      $('cp-coupon').style.display = 'inline-block';
    } else {
      $('cp-coupon').style.display = 'none';
    }

    const cta = $('cp-cta');
    cta.textContent = (promocao.lojaNome || '').toLowerCase().includes('shopee')
      ? '👇 COMPRE AQUI 👇'
      : '👉 LINK NA DESCRIÇÃO / COMENTÁRIO';

    await new Promise(r => setTimeout(r, 100));

    try {
      CurioUtils.toast('Gerando imagem...', 'aviso');
      const canvas = await html2canvas(cp, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob(blob => {
        if (!blob) {
          CurioUtils.toast('Falha ao gerar imagem.', 'erro');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `curio-promo-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        CurioUtils.toast('Imagem baixada!', 'sucesso');
      });
    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao gerar imagem.', 'erro');
    }
  }

  // ---------- AÇÕES ----------
  function bindAcoes() {
    $('mensagem-editavel').addEventListener('input', () => {
      $('preview-mensagem').textContent = $('mensagem-editavel').value;
    });

    $('btn-copiar').onclick = async () => {
      const msg = $('mensagem-editavel').value.trim();
      if (!msg) { CurioUtils.toast('Nada para copiar.', 'aviso'); return; }
      const ok = await CurioDivulgacao.copiar(msg);
      if (ok) {
        CurioUtils.toast('Mensagem copiada!', 'sucesso');
        await registrar('copiado');
      } else {
        CurioUtils.toast('Não foi possível copiar.', 'erro');
      }
    };

    $('btn-whatsapp').onclick = async () => {
      const msg = $('mensagem-editavel').value.trim();
      if (!msg) { CurioUtils.toast('Nada para enviar.', 'aviso'); return; }
      await CurioDivulgacao.copiar(msg);
      CurioDivulgacao.abrirWhatsApp(msg);
      CurioUtils.toast('Mensagem copiada e WhatsApp aberto.', 'sucesso');
      await registrar('aberto_whatsapp');
    };

    $('btn-imagem').onclick = exportarImagem;
  }

  // ---------- INIT ----------
  async function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      CurioUtils.toast('Promoção não informada.', 'erro');
      setTimeout(() => window.location.href = 'promocoes.html', 1200);
      return;
    }

    try {
      [promocao, templates] = await Promise.all([
        CurioDB.obterPromocao(id),
        CurioDB.listarTemplates()
      ]);

      if (!promocao) {
        CurioUtils.toast('Promoção não encontrada.', 'erro');
        setTimeout(() => window.location.href = 'promocoes.html', 1200);
        return;
      }

      renderPreview();
      await preencherTemplates();
      atualizarMensagem();
      bindAcoes();

      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
      console.error(e);
      CurioUtils.toast('Erro ao carregar promoção.', 'erro');
    }
  }

  return { init };
})();