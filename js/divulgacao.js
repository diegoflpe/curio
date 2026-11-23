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

  function aplicarVariaveis(template, dados) {
    let msg = template;
    Object.keys(dados).forEach(chave => {
      const regex = new RegExp(`\\{${chave}\\}`, 'g');
      msg = msg.replace(regex, dados[chave] ?? '');
    });
    return msg;
  }

  function dadosDaPromocao(p) {
    const temDesconto = p.precoOriginal && p.precoOriginal > p.precoPromocional;
    return {
      produto: p.produto || '',
      preco_original: temDesconto ? CurioUtils.formatarMoeda(p.precoOriginal) : '',
      preco_original_tachado: temDesconto ? tacharTexto(CurioUtils.formatarMoeda(p.precoOriginal)) : '',
      preco_promocional: CurioUtils.formatarMoeda(p.precoPromocional),
      desconto: temDesconto ? `${p.desconto}% OFF 🔥` : '',
      loja: p.lojaNome || '',
      link: p.linkAfiliado || p.linkOferta || '',
      descricao: p.descricao || '',
      comentario: p.comentarioPessoal || '',
      preco_pix: p.precoPix ? CurioUtils.formatarMoeda(p.precoPix) : '',
      cupom: p.cupom || '',
      preco_com_cupom: p.precoComCupom ? CurioUtils.formatarMoeda(p.precoComCupom) : ''
    };
  }

  function gerar(templateConteudo, promocao) {
    let msg = aplicarVariaveis(templateConteudo, dadosDaPromocao(promocao));

    const fraseFinalBase = "⚡ Aproveite! Condição especial por tempo limitado.";
    msg = msg.replace(fraseFinalBase, '').trim();

    if (promocao.comentarioPessoal && !templateConteudo.includes('{comentario}')) {
      msg = `${promocao.comentarioPessoal}\n\n${msg}`;
    }

    const extras = [];
    if (promocao.precoPix && !templateConteudo.includes('{preco_pix}')) extras.push(`💠 Preço no Pix: ${CurioUtils.formatarMoeda(promocao.precoPix)}`);
    if (promocao.cupom && !templateConteudo.includes('{cupom}')) {
      let linha = `🎟️ Cupom: \`${promocao.cupom}\``;
      if (promocao.precoComCupom) linha += ` — preço final: ${CurioUtils.formatarMoeda(promocao.precoComCupom)}`;
      extras.push(linha);
    }
    if (extras.length) msg += `\n\n${extras.join('\n')}`;

    const loja = (promocao.lojaNome || '').toLowerCase();
    if (loja.includes('shopee')) {
      const linkFormatado = promocao.linkAfiliado || promocao.linkOferta;
      if (msg.includes(`👉 ${linkFormatado}`)) msg = msg.replace(`👉 ${linkFormatado}`, `Compre aqui 👇\n${linkFormatado}`);
      else if (msg.includes(linkFormatado)) msg = msg.replace(linkFormatado, `Compre aqui 👇\n${linkFormatado}`);
      
      if (promocao.incluirCuponsShopee) msg += `\n\n${TEXTOS.shopeeCupons}`;
    }
    
    if (loja.includes('amazon')) {
      if (promocao.incluirProgramePoupe) msg += `\n\n${TEXTOS.amazonPrograme}`;
      if (promocao.incluirPrime) msg += `\n\n${TEXTOS.amazonPrime}`;
    }

    msg += `\n\n_*⚡ Aproveite! Condição especial por tempo limitado.*_`;
    return msg.replace(/\n{3,}/g, '\n\n').trim();
  }

  function abrirWhatsApp(mensagem) {
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
  }

  async function copiar(mensagem) { return CurioUtils.copiarTexto(mensagem); }

  return { TEXTOS, tacharTexto, aplicarVariaveis, dadosDaPromocao, gerar, abrirWhatsApp, copiar };
})();
