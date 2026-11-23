/* ============================================================
   CURIÓ PROMOS — MOTOR DE DIVULGAÇÃO
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
    // Se não tem preço original válido, enviamos vazio para o template
    const temDesconto = p.precoOriginal && p.precoOriginal > p.precoPromocional;
    
    return {
      produto: p.produto || '',
      preco_original: temDesconto ? CurioUtils.formatarMoeda(p.precoOriginal) : '',
      preco_original_tachado: temDesconto ? tacharTexto(CurioUtils.formatarMoeda(p.precoOriginal)) : '',
      preco_promocional: CurioUtils.formatarMoeda(p.precoPromocional),
      desconto: temDesconto ? `${p.desconto}% OFF 🔥` : '', // Limpa o desconto se não houver
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

    // 1. Remove a frase final do template (para não ficar no meio do texto)
    const fraseFinalBase = "⚡ Aproveite! Condição especial por tempo limitado.";
    msg = msg.replace(fraseFinalBase, '').trim();

    // 2. Se o template NÃO contém {comentario}, adiciona no topo
    if (promocao.comentarioPessoal && !templateConteudo.includes('{comentario}')) {
      msg = `${promocao.comentarioPessoal}\n\n${msg}`;
    }

    // 3. Adiciona Pix/Cupom
    const extras = [];
    if (promocao.precoPix && !templateConteudo.includes('{preco_pix}')) {
      extras.push(`💠 Preço no Pix: ${CurioUtils.formatarMoeda(promocao.precoPix)}`);
    }
    if (promocao.cupom && !templateConteudo.includes('{cupom}')) {
      let linha = `🎟️ Cupom: \`${promocao.cupom}\``;
      if (promocao.precoComCupom) {
        linha += ` — preço final: ${CurioUtils.formatarMoeda(promocao.precoComCupom)}`;
      }
      extras.push(linha);
    }
    if (extras.length) {
      msg += `\n\n${extras.join('\n')}`;
    }

    // 4. Complementos por loja
    const loja = (promocao.lojaNome || '').toLowerCase();
    
    if (loja.includes('shopee')) {
      const linkFormatado = promocao.linkAfiliado || promocao.linkOferta;
      if (msg.includes(`👉 ${linkFormatado}`)) {
        msg = msg.replace(`👉 ${linkFormatado}`, `Compre aqui 👇\n${linkFormatado}`);
      } else if (msg.includes(linkFormatado)) {
        msg = msg.replace(linkFormatado, `Compre aqui 👇\n${linkFormatado}`);
      }
      if (promocao.incluirCuponsShopee) msg += `\n\n${TEXTOS.shopeeCupons}`;
    }
    
    if (loja.includes('amazon')) {
      if (promocao.incluirProgramePoupe) msg += `\n\n${TEXTOS.amazonPrograme}`;
      if (promocao.incluirPrime) msg += `\n\n${TEXTOS.amazonPrime}`;
    }

    // 5. Adiciona a frase final com Negrito e Itálico do WhatsApp (_*texto*_)
    const fraseFinalFormatada = `_*⚡ Aproveite! Condição especial por tempo limitado.*_`;
    msg += `\n\n${fraseFinalFormatada}`;

    // 6. Limpeza final: remove linhas em branco que sobraram se não houver preço antigo
    msg = msg.replace(/\n{3,}/g, '\n\n');

    return msg.trim();
  }

  function abrirWhatsApp(mensagem) {
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank', 'noopener');
  }

  async function copiar(mensagem) {
    return CurioUtils.copiarTexto(mensagem);
  }

  return { TEXTOS, tacharTexto, aplicarVariaveis, dadosDaPromocao, gerar, abrirWhatsApp, copiar };
})();
