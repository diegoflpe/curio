/* ============================================================
   CURIÓ PROMOS — MOTOR DE DIVULGAÇÃO
   Gera mensagens e organiza a ordem das informações.
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

    // Remove o fechamento padrão do template temporariamente
    const fraseFinal = "⚡ Aproveite! Condição especial por tempo limitado.";
    msg = msg.replace(fraseFinal, '').trim();

    // Se o template NÃO contém {comentario}, adiciona no topo
    if (promocao.comentarioPessoal && !templateConteudo.includes('{comentario}')) {
      msg = `${promocao.comentarioPessoal}\n\n${msg}`;
    }

    // Adiciona Pix/Cupom
    const extras = [];
    if (promocao.precoPix && !templateConteudo.includes('{preco_pix}')) {
      extras.push(`💠 Preço no Pix: ${CurioUtils.formatarMoeda(promocao.precoPix)}`);
    }
    if (promocao.cupom && !templateConteudo.includes('{cupom}')) {
      // AQUI ESTÁ O AJUSTE DO CUPOM EM CÓDIGO INLINE
      let linha = 🎟️ Cupom: \`${promocao.cupom}\`;
      if (promocao.precoComCupom) linha += ` — preço final: ${CurioUtils.formatarMoeda(promocao.precoComCupom)}`;
      extras.push(linha);
    }
    if (extras.length) {
      msg += `\n\n${extras.join('\n')}`;
    }

    // Complementos por loja (Inseridos ANTES da frase final)
    const loja = (promocao.lojaNome || '').toLowerCase();
    
    if (loja.includes('shopee')) {
      // AQUI ESTÁ O AJUSTE DO "COMPRE AQUI" DA SHOPEE
      // Como o template padrão usa 👉 {link}, nós substituímos o 👉 por "Compre aqui 👇"
      if (msg.includes(`👉 ${promocao.linkAfiliado || promocao.linkOferta}`)) {
        msg = msg.replace(`👉 ${promocao.linkAfiliado || promocao.linkOferta}`, `Compre aqui 👇\n${promocao.linkAfiliado || promocao.linkOferta}`);
      } else if (msg.includes(promocao.linkAfiliado || promocao.linkOferta)) {
        // Fallback caso o template não use o emoji
        msg = msg.replace(promocao.linkAfiliado || promocao.linkOferta, `Compre aqui 👇\n${promocao.linkAfiliado || promocao.linkOferta}`);
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

    // Adiciona a frase final novamente no final de TUDO
    msg += `\n\n${fraseFinal}`;

    return msg.trim();
  }

  // ---------- AÇÕES ----------
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
