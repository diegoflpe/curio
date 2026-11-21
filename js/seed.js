/* ============================================================
   CURIÓ PROMOS — SEED
   Popula categorias e lojas iniciais na primeira execução.
   ============================================================ */

// Executa o seed apenas uma vez por sessão
// (a função interna verifica se as coleções já têm dados)
(async () => {
  try {
    await CurioDB.seedInicial();
  } catch (e) {
    console.warn('Seed: erro ao popular dados iniciais.', e);
  }
})();