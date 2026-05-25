// ============================================
// HOME CARE APP — SPA Router & Initialization
// ============================================

const App = (() => {
  let currentPage = 'dashboard';
  let currentParams = {};

  const pages = {
    'dashboard': { module: () => DashboardPage, title: 'Dashboard', breadcrumb: '' },
    'nutri-dashboard': { module: () => NutriDashboardPage, title: 'Dashboard Nutricional', breadcrumb: '' },
    'patient-dashboard': { module: () => PatientDashboardPage, title: 'Minha Área', breadcrumb: '' },
    'food-diary': { module: () => FoodDiaryPage, title: 'Diário Alimentar', breadcrumb: 'Diário' },
    'patients': { module: () => PatientsPage, title: 'Pacientes', breadcrumb: 'Pacientes' },
    'patient-detail': { module: () => PatientDetailPage, title: 'Paciente', breadcrumb: 'Detalhe' },
    'schedule': { module: () => SchedulePage, title: 'Atendimentos', breadcrumb: 'Atendimentos' },
    'monitoring': { module: () => MonitoringPage, title: 'Monitoramento', breadcrumb: 'Monitoramento' },
    'messages': { module: () => MessagesPage, title: 'Mensagens', breadcrumb: 'Mensagens' },
    'admin': { module: () => AdminPage, title: 'Administrativo', breadcrumb: 'Administrativo' },
    'audit': { module: () => AuditPage, title: 'Auditoria', breadcrumb: 'Auditoria' }
  };

  async function init() {
    console.log('🏥 HomeCare App — Inicializando...');

    // Initialize store with mock data
    await Store.init(MockData);
    console.log('✅ Store inicializado');

    // Initialize notifications
    Notifications.init();

    // Check session
    const user = Store.get('currentUser');
    if (!user) {
      renderLogin();
      return;
    }

    // Render app shell
    renderShell();

    // Handle hash navigation
    window.addEventListener('hashchange', handleHashChange);

    // Initial route
    handleHashChange();

    // Handle window resize for chart redraw
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const page = pages[currentPage];
        if (page) {
          const mod = page.module();
          if (mod.afterRender) mod.afterRender();
        }
      }, 300);
    });

    console.log('✅ HomeCare App pronto!');
  }

  function renderLogin() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="login-wrapper animate-fade-in" style="display:flex;align-items:center;justify-content:center;min-height:100vh;min-height:100dvh;background:linear-gradient(135deg, #E8F4FD 0%, #F0F8FF 40%, #FFFFFF 100%);padding:24px;">
        <div class="login-card animate-fade-in-up" style="width:100%;max-width:400px;background:rgba(255,255,255,0.85);border:1px solid rgba(93,173,226,0.2);border-radius:24px;padding:32px;box-shadow:0 16px 48px rgba(93,173,226,0.15);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
          <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:32px;text-align:center;">
            <div style="width:64px;height:64px;background:rgba(93,173,226,0.12);border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 0 20px rgba(93,173,226,0.2);animation:pulse 2s infinite;">
              <img src="favicon.png" alt="Logo" style="width:40px;height:40px;object-fit:contain;">
            </div>
            <h2 style="font-size:24px;font-weight:700;color:#1B2A4A;margin-bottom:6px;">HomeCare</h2>
            <p style="font-size:13px;color:#5A7184;">Sistema de Gestão Assistencial Domiciliar</p>
          </div>
          
          <form onsubmit="App.handleLogin(event)" style="display:flex;flex-direction:column;gap:20px;">
            <div class="form-group" style="display:flex;flex-direction:column;gap:6px;">
              <label style="font-size:12px;font-weight:500;color:#5A7184;display:flex;align-items:center;gap:6px;">
                <i data-lucide="user" style="width:14px;height:14px;"></i> Nome de Usuário
              </label>
              <input type="text" name="username" required placeholder="Digite seu usuário" style="width:100%;background:#E8F4FD;border:1px solid rgba(93,173,226,0.2);border-radius:12px;padding:12px 16px;color:#1B2A4A;font-size:14px;transition:border-color 0.2s;" onfocus="this.style.borderColor='#5DADE2';this.style.boxShadow='0 0 0 3px rgba(93,173,226,0.15)'" onblur="this.style.borderColor='rgba(93,173,226,0.2)';this.style.boxShadow='none'" autocomplete="username">
            </div>
            
            <div class="form-group" style="display:flex;flex-direction:column;gap:6px;">
              <label style="font-size:12px;font-weight:500;color:#5A7184;display:flex;align-items:center;gap:6px;">
                <i data-lucide="lock" style="width:14px;height:14px;"></i> Senha
              </label>
              <input type="password" name="password" required placeholder="Digite sua senha" style="width:100%;background:#E8F4FD;border:1px solid rgba(93,173,226,0.2);border-radius:12px;padding:12px 16px;color:#1B2A4A;font-size:14px;transition:border-color 0.2s;" onfocus="this.style.borderColor='#5DADE2';this.style.boxShadow='0 0 0 3px rgba(93,173,226,0.15)'" onblur="this.style.borderColor='rgba(93,173,226,0.2)';this.style.boxShadow='none'" autocomplete="current-password">
            </div>
            
            <button type="submit" class="btn btn-primary btn-full" style="margin-top:12px;padding:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;background:linear-gradient(135deg, #5DADE2, #85C1E9);border:none;color:#FFFFFF;box-shadow:0 4px 15px rgba(93,173,226,0.3);transition:transform 0.2s, opacity 0.2s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
              <i data-lucide="log-in" style="width:16px;height:16px;"></i> Entrar no Sistema
            </button>
          </form>
          
          <div style="margin-top:24px;text-align:center;font-size:11px;color:#8FA3B8;">
            <span>Primeiro acesso? Solicite suas credenciais ao administrador.</span>
          </div>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function handleLogin(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const username = data.get('username').toLowerCase().trim();
    const password = data.get('password').trim();

    const professionals = Store.getAll('professionals') || [];
    const patients = Store.getAll('patients') || [];
    
    // Buscar por correspondência exata de username e password
    const matchedUser = professionals.find(p => p.username === username && p.password === password) ||
                        patients.find(p => p.username === username && p.password === password);

    if (matchedUser) {
      Store.set('currentUser', {
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.role,
        avatar: matchedUser.avatar || null,
        avatarColor: matchedUser.avatarColor || 1
      });

      Store.addAuditLog('Login realizado com sucesso', { details: `${matchedUser.name} (${matchedUser.role})` });
      Notifications.show('Acesso', `Bem-vindo(a) de volta, ${matchedUser.name.split(' ')[0]}!`, 'success');

      // Inicializa shell e navegação
      renderShell();
      
      // Vincula hash navigation
      window.addEventListener('hashchange', handleHashChange);
      
      // Roteia para a página inicial
      handleHashChange();
    } else {
      Notifications.show('Erro de Acesso', 'Nome de usuário ou senha inválidos!', 'danger');
    }
  }

  function renderShell() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      ${Sidebar.render()}
      ${Header.render('Dashboard')}
      <div class="app-body">
        <main class="app-content" id="appContent">
          <!-- Page content renders here -->
        </main>
      </div>
    `;

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function navigate(pageId, params = {}) {
    if (!pages[pageId]) {
      console.warn('Page not found:', pageId);
      return;
    }

    currentParams = params;

    // Build hash
    let hash = `#/${pageId}`;
    if (params.id) hash += `/${params.id}`;

    window.location.hash = hash;
  }

  function handleHashChange() {
    const hash = window.location.hash || '#/dashboard';
    const parts = hash.replace('#/', '').split('/');
    const pageId = parts[0] || 'dashboard';
    const paramId = parts[1] || null;

    if (paramId) {
      currentParams = { id: paramId };
    }

    renderPage(pageId);
  }

  function renderPage(pageId) {
    // Verificar se o usuário está autenticado
    const user = Store.get('currentUser');
    if (!user) {
      renderLogin();
      return;
    }

    // Proteger rotas restritas de administrador
    if ((pageId === 'admin' || pageId === 'audit') && user.role !== 'Administrador') {
      Notifications.show('Acesso Restrito', 'Apenas administradores podem acessar esta seção!', 'danger');
      navigate('dashboard');
      return;
    }

    // Dashboard routing by role
    if (pageId === 'dashboard') {
      if (user.role === 'Nutricionista') {
        pageId = 'nutri-dashboard';
      } else if (user.role === 'Paciente') {
        pageId = 'patient-dashboard';
      }
    }

    const page = pages[pageId];
    if (!page) {
      renderPage('dashboard');
      return;
    }

    // Destroy previous page if needed
    if (currentPage !== pageId) {
      const prevPage = pages[currentPage];
      if (prevPage) {
        const prevMod = prevPage.module();
        if (prevMod.destroy) prevMod.destroy();
      }
    }

    currentPage = pageId;

    // Update header
    Header.updateTitle(page.title, page.breadcrumb);

    // Update sidebar active state
    Sidebar.setActive(pageId);

    // Render page content
    const content = document.getElementById('appContent');
    if (!content) return;

    const mod = page.module();
    content.innerHTML = mod.render(currentParams);

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Call afterRender
    if (mod.afterRender) {
      requestAnimationFrame(() => mod.afterRender());
    }

    // Scroll to top
    content.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function getCurrentPage() {
    return currentPage;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { navigate, getCurrentPage, init, handleLogin };
})();
