/* ============================================================
   CURIÓ PROMOS — UTILITÁRIOS
   Funções reutilizáveis: toast, formatação, validação.
   ============================================================ */

const CurioUtils = (() => {

  // ---------- TOAST ----------
  function toast(mensagem, tipo = 'sucesso', duracao = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) {
      console.warn('Toast container não encontrado.');
      return;
    }

    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.textContent = mensagem;

    container.appendChild(el);

    // Remove após duração
    setTimeout(() => {
      el.classList.add('removendo');
      setTimeout(() => el.remove(), 250);
    }, duracao);
  }

  // ---------- FORMATAÇÃO ----------
  function formatarMoeda(valor) {
    const num = Number(valor);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function formatarData(data) {
    if (!data) return '—';
    let d;
    if (data.toDate) d = data.toDate(); // Firestore Timestamp
    else if (data instanceof Date) d = data;
    else d = new Date(data);

    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  }

  function formatarDataHora(data) {
    if (!data) return '—';
    let d;
    if (data.toDate) d = data.toDate();
    else if (data instanceof Date) d = data;
    else d = new Date(data);

    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function calcularDesconto(precoOriginal, precoPromocional) {
    const orig = Number(precoOriginal);
    const prom = Number(precoPromocional);
    if (!orig || orig <= 0 || isNaN(orig) || isNaN(prom)) return 0;
    const desconto = ((orig - prom) / orig) * 100;
    return Math.round(desconto);
  }

  // ---------- VALIDAÇÃO ----------
  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validarUrl(url) {
    if (!url) return true; // URL opcional
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ---------- SEGURANÇA (XSS) ----------
  function escapeHtml(texto) {
    if (texto == null) return '';
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---------- CLIPBOARD ----------
  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Fallback para navegadores antigos
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        textarea.remove();
      }
    }
  }

  // ---------- API PÚBLICA ----------
  return {
    toast,
    formatarMoeda,
    formatarData,
    formatarDataHora,
    calcularDesconto,
    validarEmail,
    validarUrl,
    escapeHtml,
    copiarTexto
  };
})();