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

    const temDesconto = promocao.precoOriginal && promocao.precoOriginal > promocao.precoPromocional;

    // --- 1. LIMPEZA DO TEXTO (Remove os erros do template antigo) ---
    msg = msg.replace(/\{comentario\}/g, promocao.comentarioPessoal || '');
    msg = msg.replace(/\{produto\}/g, promocao.produto || '');
    msg = msg.replace(/\{link\}/g, promocao.linkAfiliado || promocao.linkOferta || '');
    
    // Remove a frase final antiga (se existir)
    msg = msg.replace(/⚡ Aproveite! Condição especial por tempo limitado\.?/gi, '').trim();

    // --- 2. CONSTRUÇÃO DOS PREÇOS (Do zero) ---
    // Limpa qualquer resquício de preço do template
    msg = msg.replace(/❌ De:.*?(\n|$)/gi, '');
    msg = msg.replace(/✅ Por:.*?(\n|$)/gi, '');
    msg = msg.replace(/\(.*?% OFF.*?\)/gi, ''); // Remove () antigos
    
    // Monta a linha de preços perfeita
    let textoPrecos = "";
    if (temDesconto) {
      textoPrecos = `❌ De: ${tacharTexto(CurioUtils.formatarMoeda(promocao.precoOriginal))}\n✅ Por: ${CurioUtils.formatarMoeda(promocao.precoPromocional)} (${promocao.desconto}% OFF 🔥)`;
    } else {
      textoPrecos = `✅ Por: ${CurioUtils.formatarMoeda(promocao.precoPromocional)}`;
    }

    // Insere os preços no lugar certo
    if (!msg.includes(textoPrecos)) {
      msg = msg.replace(/\{preco_original_tachado\}|\{preco_original\}|\{preco_promocional\}|\{desconto\}/g, '');
      // Coloca depois do título (ou no início se não achar título)
      const linhas = msg.split('\n').filter(l => l.trim() !== '');
      if (linhas.length > 1) {
        linhas.splice(2, 0, textoPrecos); // Tenta colocar na 3ª linha
        msg = linhas.join('\n\n');
      } else {
        msg += `\n\n${textoPrecos}`;
      }
    }

    // --- 3. ADICIONA EXTRAS (Pix, Cupom, etc) ---
    const extras = [];
    if (promocao.precoPix) extras.push(`💠 Preço no Pix: ${CurioUtils.formatarMoeda(promocao.precoPix)}`);
    if (promocao.cupom) {
      let linha = `🎟️ Cupom: \`${promocao.cupom}\``;
      if (promocao.precoComCupom) linha += ` — preço final: ${CurioUtils.formatarMoeda(promocao.precoComCupom)}`;
      extras.push(linha);
    }
    if (extras.length && !msg.includes('Cupom:')) {
      msg += `\n\n${extras.join('\n')}`;
    }

    // --- 4. COMPLEMENTOS POR LOJA ---
    const loja = (promocao.lojaNome || '').toLowerCase();
    const linkFormatado = promocao.linkAfiliado || promocao.linkOferta;
    
    if (loja.includes('shopee')) {
      if (msg.includes(`👉 ${linkFormatado}`)) msg = msg.replace(`👉 ${linkFormatado}`, `Compre aqui 👇\n${linkFormatado}`);
      else if (msg.includes(linkFormatado)) msg = msg.replace(linkFormatado, `Compre aqui 👇\n${linkFormatado}`);
      
      if (promocao.incluirCuponsShopee && !msg.includes('Resgate os cupons')) {
        msg += `\n\n${TEXTOS.shopeeCupons}`;
      }
    }
    
    if (loja.includes('amazon')) {
      if (promocao.incluirProgramePoupe && !msg.includes('PRA CHEGAR NO VALOR')) {
        msg += `\n\n${TEXTOS.amazonPrograme}`;
      }
      if (promocao.incluirPrime && !msg.includes('FRETE GRÁTIS PRIME')) {
        msg += `\n\n${TEXTOS.amazonPrime}`;
      }
    }

    // --- 5. FRASE FINAL ---
    msg += `\n\n_*⚡ Aproveite! Condição especial por tempo limitado.*_`;

    // Limpa linhas em branco extras que possam ter sobrado
    return msg.replace(/\n{3,}/g, '\n\n').trim();
  }

  function abrirWhatsApp(mensagem) {
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
  }

  async function copiar(mensagem) { return CurioUtils.copiarTexto(mensagem); }

  return { TEXTOS, tacharTexto, aplicarVariaveis, dadosDaPromocao, gerar, abrirWhatsApp, copiar };
})();
