/* ============================================================
   CURIÓ PROMOS — MOTOR DE DIVULGAÇÃO
   Gera mensagens a partir de templates + dados de promoção.
   ============================================================ */

const CurioDivulgacao = (() => {

  const TEXTOS = {
    shopeeCupons:
`🎟️ Resgate os cupons aqui:
https://s.shopee.com.br/9zzKf0aJV8`,

    amazonPrograme:
`PRA CHEGAR NO VALOR:
* selecione: programe e poupe (cancele quando quiser)
* desconto na finalização`,

    amazonPrime:
`FRETE GRÁTIS PRIME 🚚

🧡 Teste o prime grátis por 30 dias e cancele quando quiser
https://link.amazon/B09yJ3i1Z`
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
    return {
      produto: p.produto || '',
      preco_original: CurioUtils.formatarMoeda(p.precoOriginal),
      preco_promocional: CurioUtils.formatarMoeda(p.precoPromocional),
      preco_original_tachado: tacharTexto(CurioUtils.formatarMoeda(p.precoOriginal)),
      desconto: p.desconto || 0,
      loja: p.lojaNome || '',
      link: p.linkAfiliado || p.linkOferta || '',
      descricao: p.descricao || '',
      comentario: p.comentarioPessoal || '',
      preco_pix: p.precoPix ? CurioUtils.formatarMoeda(p.precoPix) : '',
      cupom: p.cupom || '',
      preco_com_cupom: p.precoComCupom ? CurioUtils.formatarMoeda(p.precoComCupom) : ''
    };
  }

  // ---------- GERAÇÃO ----------
  function gerar(templateConteudo, promocao) {
    let msg = aplicarVariaveis(templateConteudo, dadosDaPromocao(promocao));

    // Se o template NÃO contém {comentario} mas a promoção tem comentário,
    // adiciona no topo automaticamente.
    if (promocao.comentarioPessoal && !templateConteudo.includes('{comentario}')) {
      msg = `${promocao.comentarioPessoal}\n\n${msg}`;
    }

    // Adiciona Pix/Cupom se o template não os menciona
    const extras = [];
    if (promocao.precoPix && !templateConteudo.includes('{preco_pix}')) {
      extras.push(`💠 Preço no Pix: ${CurioUtils.formatarMoeda(promocao.precoPix)}`);
    }
    if (promocao.cupom && !templateConteudo.includes('{cupom}')) {
      // AJUSTE 1: Cupom com código inline (apenas o nome do cupom)
      let linha = `🎟️ Cupom: \`${promocao.cupom}\``;
      if (promocao.precoComCupom) {
        linha += ` — preço final: ${CurioUtils.formatarMoeda(promocao.precoComCupom)}`;
      }
      extras.push(linha);
    }
    if (extras.length) {
      msg += `\n\n${extras.join('\n')}`;
    }

    // Complementos por loja
    const loja = (promocao.lojaNome || '').toLowerCase();
    
    // AJUSTE 2: Compre aqui 👇 antes do link da Shopee
    if (loja.includes('shopee')) {
      const linkFormatado = promocao.linkAfiliado || promocao.linkOferta;
      if (msg.includes(`👉 ${linkFormatado}`)) {
        msg = msg.replace(`👉 ${linkFormatado}`, `Compre aqui 👇\n${linkFormatado}`);
      } else if (msg.includes(linkFormatado)) {
        msg = msg.replace(linkFormatado, `Compre aqui 👇\n${linkFormatado}`);
      }

      if (promocao.incluirCuponsShopee) {
        msg += `\n\n${TEXTOS.shopeeCupons}`;
      }
    }
    
    if (loja.includes('amazon')) {
      if (promocao.incluirProgramePoupe) {
        msg += `\n\n${TEXTOS.amazonPrograme}`;
      }
      if (promocao.incluirPrime) {
        msg += `\n\n${TEXTOS.amazonPrime}`;
      }
    }

    return msg.trim();
  }

  function abrirWhatsApp(mensagem) {
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank', 'noopener');
  }

  async function copiar(mensagem) {
    return CurioUtils.copiarTexto(mensagem);
  }

  return {
    TEXTOS,
    tacharTexto,
    aplicarVariaveis,
    dadosDaPromocao,
    gerar,
    abrirWhatsApp,
    copiar
  };
})();
