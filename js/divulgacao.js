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

    // --- 1. CONSTRUÇÃO DO TEXTO BASE ---
    // Limpa o template de variaveis antigas e monta a base
    let msg = templateConteudo
      .replace(/\{comentario\}/g, promocao.comentarioPessoal || '')
      .replace(/\{produto\}/g, promocao.produto || '')
      .replace(/\{link\}/g, link)
      .replace(/\{preco_original_tachado\}/g, '') // Ignora a linha solta do template antigo
      .replace(/\{preco_original\}/g, '')
      .replace(/\{preco_promocional\}/g, '')
      .replace(/\{desconto\}/g, '')
      .replace(/⚡ Aproveite! Condição especial por tempo limitado\.?/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // --- 2. BLOCO DE PREÇOS ---
    let blocoPrecos = "";
    if (temDesconto) {
      blocoPrecos = `❌ De: ${tacharTexto(CurioUtils.formatarMoeda(promocao.precoOriginal))}\n✅ Por: ${CurioUtils.formatarMoeda(promocao.precoPromocional)} (${promocao.desconto}% OFF 🔥)`;
    } else {
      blocoPrecos = `✅ Por: ${CurioUtils.formatarMoeda(promocao.precoPromocional)}`;
    }

    // Se tiver Pix, adiciona na linha de baixo sem repetir o valor
    if (promocao.precoPix) {
      blocoPrecos += `\n💠 Preço no Pix`;
    }

    // --- 3. BLOCO DE CUPOM ---
    let blocoCupom = "";
    if (promocao.cupom) {
      blocoCupom = `🎟️ Cupom: \`${promocao.cupom}\``;
      if (promocao.precoComCupom) blocoCupom += ` — preço final: ${CurioUtils.formatarMoeda(promocao.precoComCupom)}`;
    }

    // --- 4. MONTAGEM FINAL ---
    // Procura a posição do link no texto para colocar os preços antes dele
    if (msg.includes(link)) {
      let textoFormatado = msg.replace(link, `${blocoPrecos}\n\n${link}`);
      
      // Se tiver cupom, coloca depois do link
      if (blocoCupom) {
        textoFormatado = textoFormatado.replace(link, `${link}\n\n${blocoCupom}`);
      }
      
      // Se for Shopee, coloca o "Compre aqui"
      if ((promocao.lojaNome || '').toLowerCase().includes('shopee')) {
        if (textoFormatado.includes(`👉 ${link}`)) textoFormatado = textoFormatado.replace(`👉 ${link}`, `Compre aqui 👇\n${link}`);
        else textoFormatado = textoFormatado.replace(link, `Compre aqui 👇\n${link}`);
        
        if (promocao.incluirCuponsShopee) textoFormatado = textoFormatado.replace(link, `${link}\n\n${TEXTOS.shopeeCupons}`);
      }

      // Se for Amazon, coloca os extras
      if ((promocao.lojaNome || '').toLowerCase().includes('amazon')) {
        if (promocao.incluirProgramePoupe) textoFormatado = textoFormatado.replace(link, `${link}\n\n${TEXTOS.amazonPrograme}`);
        if (promocao.incluirPrime) textoFormatado = textoFormatado.replace(link, `${link}\n\n${TEXTOS.amazonPrime}`);
      }

      msg = textoFormatado;

    } else {
      // Caso não ache o link, joga tudo no final
      msg += `\n\n${blocoPrecos}\n\n👉 ${link}`;
      if (blocoCupom) msg += `\n\n${blocoCupom}`;
    }

    // Adiciona a frase final formatada
    msg += `\n\n_*⚡ Aproveite! Condição especial por tempo limitado.*_`;

    return msg.trim();
  }

  function abrirWhatsApp(mensagem) {
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
  }

  async function copiar(mensagem) { return CurioUtils.copiarTexto(mensagem); }

  return { TEXTOS, tacharTexto, gerar, abrirWhatsApp, copiar };
})();
