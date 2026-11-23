/* ============================================================
   CURIÓ PROMOS — MOTOR DE DIVULGAÇÃO
   ============================================================ */

const CurioDivulgacao = (() => {

  const TEXTOS = {
    shopeeCupons: `🎟️ Resgate os cupons aqui:\nhttps://s.shopee.com.br/9zzKf0aJV8`,
    amazonPrograme: `PRA CHEGAR NO VALOR:\n* selecione: programe e poupe (cancele quando quiser)\n* desconto na finalização`,
    amazonPrime: `FRETE GRÁTIS PRIME 🚚\n\n🧡 Teste o prime grátis por 30 dias e cancele quando quiser\nhttps://link.amazon/B09yJ3i1Z`
  };

  function tacharTexto(texto) {
    return String(texto).split('').map(c => c + '\u0336').join('');
  }

    function gerar(templateConteudo, promocao) {
    const temDesconto = promocao.precoOriginal && promocao.precoOriginal > promocao.precoPromocional;
    const link = promocao.linkAfiliado || promocao.linkOferta || '';
    const loja = (promocao.lojaNome || '').toLowerCase();

    // --- 1. TÍTULO E COMENTÁRIO ---
    let msg = "";
    if (promocao.comentarioPessoal) {
      msg += `${promocao.comentarioPessoal}\n\n`;
    }
    msg += `🐦 ${promocao.produto}`;

    // --- 2. BLOCO DE PREÇOS ---
    msg += `\n\n`;
    if (temDesconto) {
      msg += `❌ De: ${tacharTexto(CurioUtils.formatarMoeda(promocao.precoOriginal))}\n`;
    }
    let linhaPromocional = `✅ Por: ${CurioUtils.formatarMoeda(promocao.precoPromocional)}`;
    if (promocao.precoPix) linhaPromocional += ` no Pix 💠`;
    if (temDesconto) linhaPromocional += ` (${promocao.desconto}% OFF 🔥)`;
    msg += `${linhaPromocional}\n`;

    // --- 3. LINK E COMPLEMENTOS DA LOJA ---
    msg += `\n`;
    if (loja.includes('shopee')) {
      // AQUI ESTÁ O AJUSTE: Força "Compre aqui 👇" antes do link
      msg += `Compre aqui 👇\n${link}\n`;
      if (promocao.incluirCuponsShopee) {
        msg += `\n${TEXTOS.shopeeCupons}\n`;
      }
    } else {
      msg += `👉 ${link}\n`;
    }

    if (loja.includes('amazon')) {
      if (promocao.incluirProgramePoupe) msg += `\n${TEXTOS.amazonPrograme}\n`;
      if (promocao.incluirPrime) msg += `\n${TEXTOS.amazonPrime}\n`;
    }

    // --- 4. CUPOM MANUAL ---
    if (promocao.cupom) {
      msg += `\n🎟️ Cupom: \`${promocao.cupom}\``;
      if (promocao.precoComCupom) {
        msg += ` — preço final: ${CurioUtils.formatarMoeda(promocao.precoComCupom)}`;
      }
      msg += `\n`;
    }

    // --- 5. FRASE FINAL ---
    msg += `\n_*⚡ Aproveite! Condição especial por tempo limitado.*_`;

    return msg.replace(/\n{3,}/g, '\n\n').trim();
  }

  function abrirWhatsApp(mensagem) {
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
  }

  async function copiar(mensagem) { return CurioUtils.copiarTexto(mensagem); }

  return { TEXTOS, tacharTexto, gerar, abrirWhatsApp, copiar };
})();
