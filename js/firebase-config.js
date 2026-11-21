/* ============================================================
   CURIÓ PROMOS — CONFIGURAÇÃO DO FIREBASE
   Substitua os valores abaixo pelos do seu projeto Firebase.
   Estas chaves são públicas e seguras para o frontend.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyC2ndN0hHy4zeFlMFlNE2tyX3BpYgk4N80",
  authDomain: "curiopromos-b6f77.firebaseapp.com",
  projectId: "curiopromos-b6f77",
  storageBucket: "curiopromos-b6f77.firebasestorage.app",
  messagingSenderId: "178433587599",
  appId: "1:178433587599:web:cf4068db52504ae20873fa"
};

// Inicializa Firebase (compat SDK via CDN — mais simples para Vanilla JS)
firebase.initializeApp(firebaseConfig);

// Referências globais
const auth = firebase.auth();
const db = firebase.firestore();

// Persistência de sessão: mantém logado entre abas
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.warn('Erro ao configurar persistência:', error);
  });