// ============================================
// HOME CARE APP — Header Component
// ============================================

const Header = (() => {

  function render(title = 'Dashboard', breadcrumb = '') {
    const user = Store.get('currentUser') || { name: 'Usuário', avatarColor: 1 };
    const alerts = Store.getAll('alerts').filter(a => !a.read);
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2);

    return `
      <header class="app-header" id="appHeader">
        <div class="header-left">
          <button class="header-menu-btn" onclick="Sidebar.open()" id="menuBtn" aria-label="Abrir menu">
            <i data-lucide="menu"></i>
          </button>
          <div>
            <h1 class="header-title" id="headerTitle">${title}</h1>
            ${breadcrumb ? `
              <div class="header-breadcrumb" id="headerBreadcrumb">
                <span>Home</span>
                <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
                <span>${breadcrumb}</span>
              </div>` : ''}
          </div>
        </div>
        <div class="header-right">
          <div class="header-search" id="headerSearch">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Buscar paciente, profissional..." 
                   id="globalSearch" autocomplete="off"
                   oninput="Header.handleSearch(this.value)">
          </div>
          <button class="header-notification" onclick="Header.toggleNotifications()" 
                  id="notificationBtn" aria-label="Notificações">
            <i data-lucide="bell"></i>
            ${alerts.length > 0 ? `<span class="badge-count" id="alertBadge">${alerts.length}</span>` : ''}
          </button>
          <div class="header-profile" onclick="Header.toggleProfile()" id="profileBtn">
            <div class="avatar avatar-sm avatar-${user.avatarColor}">${initials}</div>
            <span class="header-profile-name">${user.name.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      <!-- Notification Dropdown -->
      <div class="notification-dropdown hidden" id="notificationDropdown">
        <div class="notification-dropdown-header">
          <h3>Alertas</h3>
          <button class="btn btn-ghost btn-sm" onclick="Header.markAllRead()">Marcar todos como lidos</button>
        </div>
        <div class="notification-dropdown-body" id="notificationList">
          ${renderAlerts()}
        </div>
      </div>
    `;
  }

  function renderAlerts() {
    const alerts = Store.getAll('alerts');
    if (!alerts.length) {
      return '<div class="empty-state p-lg"><p>Nenhum alerta</p></div>';
    }
    return alerts.slice(0, 10).map(alert => `
      <div class="notification-item ${alert.read ? '' : 'unread'}" onclick="Header.handleAlertClick('${alert.id}')">
        <div class="badge-dot ${alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : 'active'}"></div>
        <div class="notification-item-content">
          <p class="notification-item-text">${alert.message}</p>
          ${alert.patient ? `<span class="notification-item-patient">${alert.patient}</span>` : ''}
          <span class="notification-item-time">${formatTimeAgo(alert.timestamp)}</span>
        </div>
      </div>
    `).join('');
  }

  function updateTitle(title, breadcrumb) {
    const titleEl = document.getElementById('headerTitle');
    const breadcrumbEl = document.getElementById('headerBreadcrumb');
    if (titleEl) titleEl.textContent = title;
    if (breadcrumbEl && breadcrumb) {
      breadcrumbEl.innerHTML = `
        <span>Home</span>
        <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
        <span>${breadcrumb}</span>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden');
      // Refresh list
      const list = document.getElementById('notificationList');
      if (list) list.innerHTML = renderAlerts();
    }
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeDropdowns, { once: true });
    }, 10);
  }

  function toggleProfile() {
    // Simple profile toggle - could expand to dropdown
    Notifications.show('Perfil', 'Funcionalidade em desenvolvimento', 'info');
  }

  function closeDropdowns(e) {
    if (!e.target.closest('#notificationDropdown') && !e.target.closest('#notificationBtn')) {
      document.getElementById('notificationDropdown')?.classList.add('hidden');
    }
  }

  function markAllRead() {
    const alerts = Store.getAll('alerts');
    alerts.forEach(a => a.read = true);
    Store.set('alerts', alerts);
    const badge = document.getElementById('alertBadge');
    if (badge) badge.remove();
    const list = document.getElementById('notificationList');
    if (list) list.innerHTML = renderAlerts();
    Notifications.show('Alertas', 'Todos os alertas foram marcados como lidos', 'success');
  }

  function handleAlertClick(alertId) {
    const alert = Store.getById('alerts', alertId);
    if (alert) {
      Store.update('alerts', alertId, { read: true });
      if (alert.patient) {
        const patient = Store.getAll('patients').find(p => p.name === alert.patient);
        if (patient) {
          App.navigate('patient-detail', { id: patient.id });
        }
      }
    }
    document.getElementById('notificationDropdown')?.classList.add('hidden');
  }

  function handleSearch(query) {
    if (query.length < 2) return;
    // Search patients and professionals
    const patients = Store.search('patients', query, ['name', 'diagnosis']);
    const professionals = Store.search('professionals', query, ['name', 'role', 'specialty']);
    console.log('Search results:', { patients: patients.length, professionals: professionals.length });
  }

  function updateAlertBadge() {
    const alerts = Store.getAll('alerts').filter(a => !a.read);
    const badge = document.getElementById('alertBadge');
    if (alerts.length > 0) {
      if (badge) {
        badge.textContent = alerts.length;
      }
    } else {
      if (badge) badge.remove();
    }
  }

  function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  }

  return { render, updateTitle, toggleNotifications, toggleProfile, markAllRead, handleAlertClick, handleSearch, updateAlertBadge };
})();
