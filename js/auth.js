/* ============================================================
   CURIÓ PROMOS — AUTENTICAÇÃO
   Proteção de rotas e logout.
   ============================================================ */

const CurioAuth = (() => {

  /**
   * Protege uma página: redireciona para login se não autenticado.
   * Retorna uma Promise com o user (ou null).
   */
  function protegerPagina() {
    return new Promise((resolve) => {
      auth.onAuthStateChanged((user) => {
        if (!user) {
          window.location.href = 'login.html';
          resolve(null);
        } else {
          resolve(user);
        }
      });
    });
  }

  /**
   * Faz logout e redireciona para login.
   */
  async function logout() {
    try {
      await auth.signOut();
      window.location.href = 'login.html';
    } catch (error) {
      CurioUtils.toast('Erro ao sair. Tente novamente.', 'erro');
    }
  }

  /**
   * Retorna o usuário atual (ou null) de forma síncrona após carregamento.
   */
  function usuarioAtual() {
    return auth.currentUser;
  }

  return { protegerPagina, logout, usuarioAtual };
})();