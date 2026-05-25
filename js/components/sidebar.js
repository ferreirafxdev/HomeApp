// ============================================
// HOME CARE APP — Sidebar Component
// Desktop: sidebar | Mobile: bottom nav
// ============================================

const Sidebar = (() => {
  function getNavItems(user) {
    const role = user?.role || '';
    if (role === 'Paciente') {
      return [
        { id: 'dashboard', icon: 'layout-dashboard', label: 'Minha Área', section: 'principal' },
        { id: 'food-diary', icon: 'apple', label: 'Diário Alimentar', section: 'principal' },
        { id: 'messages', icon: 'message-circle', label: 'Mensagens', section: 'comunicação', badge: 0 }
      ];
    } else if (role === 'Nutricionista') {
      return [
        { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard', section: 'principal' },
        { id: 'patients', icon: 'users', label: 'Pacientes', section: 'principal' },
        { id: 'schedule', icon: 'calendar-days', label: 'Atendimentos', section: 'principal' },
        { id: 'messages', icon: 'message-circle', label: 'Mensagens', section: 'comunicação', badge: 0 }
      ];
    } else {
      // Default (Enfermeiro, Médico, Administrador)
      return [
        { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard', section: 'principal' },
        { id: 'patients', icon: 'users', label: 'Pacientes', section: 'principal' },
        { id: 'schedule', icon: 'calendar-days', label: 'Atendimentos', section: 'principal' },
        { id: 'monitoring', icon: 'activity', label: 'Monitoramento', section: 'clínico' },
        { id: 'messages', icon: 'message-circle', label: 'Mensagens', section: 'clínico', badge: 0 },
        { id: 'admin', icon: 'briefcase', label: 'Administrativo', section: 'gestão' },
        { id: 'audit', icon: 'shield-check', label: 'Auditoria', section: 'gestão' }
      ];
    }
  }

  function render() {
    const user = Store.get('currentUser') || {};
    const items = getNavItems(user);
    const bottomNavItems = items.map(i => i.id).slice(0, 5);

    return `
      <!-- Desktop Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-logo">
            <i data-lucide="heart-pulse"></i>
          </div>
          <div class="sidebar-brand-text">
            <span class="sidebar-brand-name">HomeCare</span>
            <span class="sidebar-brand-sub">Gestão Assistencial</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${renderNavSections(user, items)}
        </nav>
        <div class="sidebar-footer">
          <div class="nav-item" onclick="Sidebar.handleLogout()" id="nav-logout">
            <i data-lucide="log-out"></i>
            <span class="nav-item-text">Sair</span>
          </div>
        </div>
      </aside>

      <!-- Mobile Overlay -->
      <div class="sidebar-overlay" id="sidebarOverlay" onclick="Sidebar.close()"></div>

      <!-- Mobile Bottom Navigation -->
      <nav class="bottom-nav" id="bottomNav">
        ${bottomNavItems.map(id => {
          const item = items.find(n => n.id === id);
          return `
            <div class="bottom-nav-item${id === 'dashboard' ? ' active' : ''}" 
                 onclick="Sidebar.navigate('${item.id}')"
                 data-nav="${item.id}"
                 id="bottom-nav-${item.id}">
              <i data-lucide="${item.icon}"></i>
              <span>${item.label}</span>
              ${item.badge ? `<span class="bottom-nav-badge" data-badge="${item.id}">${item.badge}</span>` : 
                item.id === 'messages' ? `<span class="bottom-nav-badge hidden" data-badge="${item.id}"></span>` : ''}
            </div>
          `;
        }).join('')}
      </nav>
    `;
  }

  function renderNavSections(user, items) {
    const isAdmin = user.role === 'Administrador';

    const sections = {};
    items.forEach(item => {
      // Ocultar itens administrativos se o usuário não for administrador
      if ((item.id === 'admin' || item.id === 'audit') && !isAdmin) {
        return;
      }

      if (!sections[item.section]) sections[item.section] = [];
      sections[item.section].push(item);
    });

    const sectionLabels = {
      'principal': 'Principal',
      'clínico': 'Clínico',
      'comunicação': 'Comunicação',
      'gestão': 'Gestão'
    };

    // Filtrar seções vazias
    return Object.entries(sections)
      .filter(([_, items]) => items.length > 0)
      .map(([key, items]) => `
        <div class="sidebar-section-title">${sectionLabels[key]}</div>
        ${items.map(item => `
          <div class="nav-item${item.id === 'dashboard' ? ' active' : ''}" 
               onclick="Sidebar.navigate('${item.id}')"
               data-nav="${item.id}"
               id="nav-${item.id}">
            <i data-lucide="${item.icon}"></i>
            <span class="nav-item-text">${item.label}</span>
            ${item.badge ? `<span class="nav-item-badge" data-badge="${item.id}">${item.badge}</span>` : 
              item.id === 'messages' ? `<span class="nav-item-badge hidden" data-badge="${item.id}"></span>` : ''}
          </div>
        `).join('')}
      `).join('');
  }

  function navigate(pageId) {
    // Update active state on sidebar
    document.querySelectorAll('.nav-item[data-nav]').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === pageId);
    });

    // Update active state on bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === pageId);
    });

    // Close sidebar on mobile
    close();

    // Navigate via router
    if (typeof App !== 'undefined' && App.navigate) {
      App.navigate(pageId);
    }
  }

  function open() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateBadge(navId, count) {
    const badges = document.querySelectorAll(`[data-badge="${navId}"]`);
    badges.forEach(badge => {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });
  }

  function setActive(pageId) {
    document.querySelectorAll('.nav-item[data-nav]').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === pageId);
    });
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === pageId);
    });
  }

  function handleLogout() {
    if (confirm('Deseja realmente sair do sistema de HomeCare?')) {
      Store.set('currentUser', null);
      Notifications.show('Sessão encerrada', 'Até logo!', 'info');
      setTimeout(() => {
        window.location.hash = '#/dashboard';
        window.location.reload();
      }, 500);
    }
  }

  return { render, navigate, open, close, updateBadge, setActive, handleLogout };
})();
