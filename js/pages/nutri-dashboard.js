// ============================================
// HOME CARE APP — NutriDashboardPage
// ============================================

const NutriDashboardPage = (() => {

  function render() {
    const patients = Store.getAll('patients').filter(p => p.nutritionistId === Store.get('currentUser')?.id);
    const alerts = Store.getAll('alerts').filter(a => a.type === 'nutrition');

    const activePatients = patients.length;
    const pendingAlerts = alerts.filter(a => !a.read).length;

    return `
      <div class="page-enter">
        <div class="dashboard-welcome animate-fade-in-up">
          <h2>Dashboard Nutricional 🥗</h2>
          <p>Resumo dos seus pacientes e acompanhamentos</p>
        </div>

        <div class="grid-scroll section mt-md">
          <div class="kpi-card kpi-green animate-fade-in-up delay-1">
            <div class="kpi-icon"><i data-lucide="users"></i></div>
            <div class="kpi-value">${activePatients}</div>
            <div class="kpi-label">Meus Pacientes</div>
          </div>
          <div class="kpi-card kpi-orange animate-fade-in-up delay-2">
            <div class="kpi-icon"><i data-lucide="bell"></i></div>
            <div class="kpi-value">${pendingAlerts}</div>
            <div class="kpi-label">Alertas Nutricionais</div>
          </div>
        </div>

        <div class="grid-2 mt-lg">
          <div class="card animate-fade-in-up delay-3">
            <div class="card-header">
              <h3 class="card-title">Meus Pacientes</h3>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${renderPatientsList(patients)}
            </div>
          </div>

          <div class="card animate-fade-in-up delay-4">
            <div class="card-header">
              <h3 class="card-title">Atividades Recentes</h3>
            </div>
            <div class="empty-state p-md">
              <i data-lucide="activity"></i>
              <p class="text-secondary">Nenhuma atividade recente registrada.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPatientsList(patients) {
    if (!patients.length) {
      return '<div class="empty-state p-md"><p class="text-secondary">Nenhum paciente atribuído.</p></div>';
    }

    return patients.map(p => `
      <div class="list-item" style="cursor:pointer" onclick="App.navigate('patient-detail', {id:'${p.id}'})">
        <div class="avatar avatar-sm avatar-${p.avatarColor}">${p.name[0]}</div>
        <div class="list-item-content">
          <div class="list-item-title">${p.name}</div>
          <div class="list-item-subtitle">Status: ${p.status === 'active' ? 'Ativo' : 'Inativo'}</div>
        </div>
        <i data-lucide="chevron-right" style="width:16px;color:var(--text-tertiary)"></i>
      </div>
    `).join('');
  }

  function afterRender() {}

  return { render, afterRender };
})();

if (typeof module !== 'undefined') module.exports = NutriDashboardPage;
