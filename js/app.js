/* ============================================================
   CURIÓ PROMOS — APP (Inicialização Geral)
   Menu mobile, ícones Lucide, link ativo e DARK MODE.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // 1. LÓGICA DO DARK MODE
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // Injeta o botão de tema no topbar
  const topbarActions = document.querySelector('.topbar-actions');
  if (topbarActions) {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'btn-theme';
    themeBtn.title = 'Alternar Tema';
    themeBtn.innerHTML = currentTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
    
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeBtn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
    
    topbarActions.appendChild(themeBtn);
  }

  // 2. ÍCONES LUCIDE
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 3. MENU MOBILE
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('aberta');
      overlay.classList.toggle('ativo');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('aberta');
      overlay.classList.remove('ativo');
    });

    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('aberta');
          overlay.classList.remove('ativo');
        }
      });
    });
  }

  // 4. LINK ATIVO
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('ativo');
    }
  });
});

/* ============================================================
   AVISO DE INSTALAÇÃO NO iOS
   ============================================================ */
function mostrarAvisoIOS() {
  // Verifica se é iOS, se está no Safari e se não está rodando como App
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true;
  const jaViuAviso = localStorage.getItem('ios_install_dismissed');

  if (isIOS && !isStandalone && !jaViuAviso) {
    // Cria o banner
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed; bottom: 20px; left: 20px; right: 20px; z-index: 9999;
      background: #1E293B; color: #FFF; padding: 1rem; border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 12px;
      font-family: 'Inter', sans-serif; font-size: 0.875rem; animation: fadeInUp 0.5s ease;
    `;
    
    // Ícone de compartilhamento do iOS
    banner.innerHTML = `
      <div style="font-size: 1.5rem;">📲</div>
      <div style="flex: 1;">
        <strong style="display:block; margin-bottom: 2px;">Instale o Curió Promos</strong>
        Toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.
      </div>
      <button id="fechar-aviso-ios" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 8px; border-radius: 8px; cursor: pointer;">✕</button>
    `;
    
    document.body.appendChild(banner);

    // Botão de fechar o aviso
    document.getElementById('fechar-aviso-ios').onclick = () => {
      banner.remove();
      localStorage.setItem('ios_install_dismissed', 'true');
    };
  }
}

// Roda o aviso quando a página carregar
window.addEventListener('load', mostrarAvisoIOS);