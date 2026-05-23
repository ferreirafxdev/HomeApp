// ============================================
// HOME CARE APP — Dashboard Page
// ============================================

const DashboardPage = (() => {

  function render() {
    const patients = Store.getAll('patients');
    const schedules = Store.getAll('schedules');
    const alerts = Store.getAll('alerts');
    const professionals = Store.getAll('professionals');
    const user = Store.get('currentUser');

    const activePatients = patients.filter(p => p.status === 'active' || p.status === 'palliative').length;
    const todaySchedules = schedules.filter(s => s.date === getTodayStr());
    const completedToday = todaySchedules.filter(s => s.status === 'completed').length;
    const pendingAlerts = alerts.filter(a => !a.read).length;
    const profInField = professionals.filter(p => p.status === 'in-visit').length;

    const greeting = getGreeting();

    return `
      <div class="page-enter">
        <!-- Welcome Banner -->
        <div class="dashboard-welcome animate-fade-in-up">
          <h2>${greeting}, ${user?.name?.split(' ')[0] || 'Doutor(a)'} 👋</h2>
          <p>Aqui está o resumo do seu dia — ${formatDate(new Date())}</p>
          ${Store.isFirebaseConnected() ? 
            '<div class="badge badge-success mt-sm"><span class="badge-dot active"></span> Firebase conectado</div>' : 
            '<div class="badge badge-neutral mt-sm"><span class="badge-dot inactive"></span> Modo offline</div>'}
        </div>

        <!-- KPI Cards -->
        <div class="grid-scroll section">
          <div class="kpi-card kpi-blue animate-fade-in-up delay-1">
            <div class="kpi-icon"><i data-lucide="users"></i></div>
            <div class="kpi-value">${activePatients}</div>
            <div class="kpi-label">Pacientes Ativos</div>
            <div class="kpi-trend up"><i data-lucide="trending-up" style="width:12px;height:12px"></i> +2 este mês</div>
          </div>
          <div class="kpi-card kpi-green animate-fade-in-up delay-2">
            <div class="kpi-icon"><i data-lucide="calendar-check"></i></div>
            <div class="kpi-value">${completedToday}/${todaySchedules.length}</div>
            <div class="kpi-label">Atendimentos Hoje</div>
            <div class="kpi-trend up"><i data-lucide="trending-up" style="width:12px;height:12px"></i> No prazo</div>
          </div>
          <div class="kpi-card kpi-orange animate-fade-in-up delay-3">
            <div class="kpi-icon"><i data-lucide="alert-triangle"></i></div>
            <div class="kpi-value">${pendingAlerts}</div>
            <div class="kpi-label">Alertas Pendentes</div>
            ${pendingAlerts > 0 ? '<div class="kpi-trend down"><i data-lucide="alert-circle" style="width:12px;height:12px"></i> Atenção</div>' : ''}
          </div>
          <div class="kpi-card kpi-purple animate-fade-in-up delay-4">
            <div class="kpi-icon"><i data-lucide="map-pin"></i></div>
            <div class="kpi-value">${profInField}</div>
            <div class="kpi-label">Profissionais em Campo</div>
            <div class="kpi-trend up">de ${professionals.length} total</div>
          </div>
        </div>

        <!-- Main Grid -->
        <div class="grid-2">
          <!-- Chart Section -->
          <div class="card animate-fade-in-up delay-3">
            <div class="card-header">
              <h3 class="card-title">Atendimentos da Semana</h3>
              <span class="badge badge-primary">Últimos 7 dias</span>
            </div>
            <div class="dashboard-chart-container">
              <canvas id="weeklyChart"></canvas>
            </div>
          </div>

          <!-- Upcoming Appointments -->
          <div class="card animate-fade-in-up delay-4">
            <div class="card-header">
              <h3 class="card-title">Próximos Atendimentos</h3>
              <button class="btn btn-ghost btn-sm" onclick="Sidebar.navigate('schedule')">
                Ver todos <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
              </button>
            </div>
            <div class="dashboard-upcoming">
              ${renderUpcomingSchedules(todaySchedules)}
            </div>
          </div>
        </div>

        <!-- Alerts + Team Status -->
        <div class="grid-2 mt-lg">
          <!-- Active Alerts -->
          <div class="card animate-fade-in-up delay-5">
            <div class="card-header">
              <h3 class="card-title">🚨 Alertas Ativos</h3>
              <span class="badge badge-danger">${pendingAlerts}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
              ${renderAlerts(alerts)}
            </div>
          </div>

          <!-- Team Status -->
          <div class="card animate-fade-in-up delay-6">
            <div class="card-header">
              <h3 class="card-title">Equipe</h3>
              <button class="btn btn-ghost btn-sm" onclick="Sidebar.navigate('admin')">
                Gerenciar
              </button>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px">
              ${renderTeamStatus(professionals)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderUpcomingSchedules(schedules) {
    const upcoming = schedules
      .filter(s => s.status === 'scheduled' || s.status === 'in-progress')
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 5);

    if (!upcoming.length) {
      return '<div class="empty-state p-md"><p class="text-secondary">Nenhum atendimento pendente hoje</p></div>';
    }

    return upcoming.map(s => {
      const patient = Store.getById('patients', s.patientId);
      const professional = Store.getById('professionals', s.professionalId);
      const statusBadge = s.status === 'in-progress' ?
        '<span class="badge badge-warning">Em andamento</span>' :
        '<span class="badge badge-primary">Agendado</span>';

      return `
        <div class="upcoming-item" onclick="App.navigate('patient-detail', {id:'${s.patientId}'})">
          <span class="upcoming-time">${s.time}</span>
          <div class="upcoming-info">
            <div class="upcoming-patient">${patient?.name || 'Paciente'}</div>
            <div class="upcoming-type">${s.title} — ${professional?.name || ''}</div>
          </div>
          ${statusBadge}
        </div>
      `;
    }).join('');
  }

  function renderAlerts(alerts) {
    const activeAlerts = alerts.filter(a => !a.read).slice(0, 4);
    if (!activeAlerts.length) {
      return '<div class="empty-state p-md"><i data-lucide="check-circle"></i><p class="text-secondary">Sem alertas ativos</p></div>';
    }

    return activeAlerts.map(a => `
      <div class="alert-card ${a.type}">
        <div class="alert-pulse"></div>
        <div>
          <div style="font-weight:500;font-size:var(--font-size-base)">${a.message}</div>
          ${a.patient ? `<div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-top:4px">${a.patient}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  function renderTeamStatus(professionals) {
    return professionals.slice(0, 6).map(p => {
      const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2);
      const statusMap = {
        'available': { label: 'Disponível', class: 'active' },
        'in-visit': { label: 'Em atendimento', class: 'warning' },
        'off-duty': { label: 'Folga', class: 'inactive' }
      };
      const status = statusMap[p.status] || statusMap['available'];

      return `
        <div class="list-item">
          <div class="avatar avatar-sm avatar-${p.avatarColor}">${initials}</div>
          <div class="list-item-content">
            <div class="list-item-title">${p.name}</div>
            <div class="list-item-subtitle">${p.role}</div>
          </div>
          <div class="status-indicator">
            <span class="badge-dot ${status.class}"></span>
            <span style="font-size:var(--font-size-xs);color:var(--text-secondary)">${status.label}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function afterRender() {
    // Render weekly chart
    setTimeout(() => {
      const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      Charts.lineChart('weeklyChart', {
        labels: days,
        datasets: [
          { values: [8, 12, 10, 14, 11, 6, 4], color: '#0A84FF', fillColor: 'rgba(10,132,255,0.15)', label: 'Atendimentos' },
          { values: [6, 10, 8, 12, 9, 5, 3], color: '#30D158', fillColor: 'rgba(48,209,88,0.08)', label: 'Concluídos' }
        ]
      });
    }, 100);

    // Update message badge
    const conversations = Store.getAll('conversations');
    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
    Sidebar.updateBadge('messages', totalUnread);
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function getTodayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('pt-BR', options);
  }

  return { render, afterRender };
})();
