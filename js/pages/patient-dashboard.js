// ============================================
// HOME CARE APP — PatientDashboardPage
// ============================================

const PatientDashboardPage = (() => {

  function render() {
    const user = Store.get('currentUser');
    const patientData = Store.getById('patients', user.id) || user;
    const plans = Store.getAll('nutritionalPlans').filter(p => p.patientId === user.id);
    const currentPlan = plans.length ? plans[plans.length - 1] : null;

    return `
      <div class="page-enter">
        <div class="dashboard-welcome animate-fade-in-up">
          <h2>Olá, ${user.name.split(' ')[0]} 👋</h2>
          <p>Acompanhe sua rotina e evolução</p>
        </div>

        <div class="grid-scroll section mt-md">
          <div class="kpi-card kpi-blue animate-fade-in-up delay-1" style="cursor:pointer" onclick="App.navigate('food-diary')">
            <div class="kpi-icon"><i data-lucide="apple"></i></div>
            <div class="kpi-value">Diário</div>
            <div class="kpi-label">Registrar Refeição</div>
          </div>
          <div class="kpi-card kpi-purple animate-fade-in-up delay-2" style="cursor:pointer" onclick="App.navigate('messages')">
            <div class="kpi-icon"><i data-lucide="message-circle"></i></div>
            <div class="kpi-value">Chat</div>
            <div class="kpi-label">Falar com Nutri</div>
          </div>
          <div class="kpi-card kpi-green animate-fade-in-up delay-3" style="cursor:pointer" onclick="PatientNutrition.newPhotoModal('${user.id}')">
            <div class="kpi-icon"><i data-lucide="camera"></i></div>
            <div class="kpi-value">Fotos</div>
            <div class="kpi-label">Evolução Visual</div>
          </div>
        </div>

        <div class="card mt-lg animate-fade-in-up delay-3">
          <div class="card-header">
            <h3 class="card-title">Minha Dieta Atual</h3>
          </div>
          ${renderCurrentPlan(currentPlan)}
        </div>

        <div class="card mt-lg animate-fade-in-up delay-4">
          <div class="card-header">
            <h3 class="card-title">Minha Evolução Visual</h3>
          </div>
          <div style="padding:var(--space-md)">
            ${typeof PatientNutrition !== 'undefined' ? PatientNutrition.renderPhotos(patientData) : '<p>Módulo indisponível</p>'}
          </div>
        </div>
      </div>
    `;
  }

  function renderCurrentPlan(plan) {
    if (!plan) {
      return '<div class="empty-state p-md"><p class="text-secondary">Nenhum plano alimentar ativo. Aguarde sua nutricionista criar um.</p></div>';
    }

    return `
      <div style="padding:var(--space-md)">
        <h4 style="margin-bottom:var(--space-sm)">${plan.title}</h4>
        <div class="grid-3" style="margin-bottom:var(--space-md)">
          <div class="stat-box" style="background:var(--bg-secondary);padding:var(--space-sm);border-radius:var(--border-radius-md)">
            <div style="font-size:var(--font-size-xs);color:var(--text-secondary)">Calorias</div>
            <div style="font-weight:600">${plan.calories} kcal</div>
          </div>
          <div class="stat-box" style="background:var(--bg-secondary);padding:var(--space-sm);border-radius:var(--border-radius-md)">
            <div style="font-size:var(--font-size-xs);color:var(--text-secondary)">Proteínas</div>
            <div style="font-weight:600">${plan.protein}g</div>
          </div>
          <div class="stat-box" style="background:var(--bg-secondary);padding:var(--space-sm);border-radius:var(--border-radius-md)">
            <div style="font-size:var(--font-size-xs);color:var(--text-secondary)">Água</div>
            <div style="font-weight:600">${plan.water || 2000} ml</div>
          </div>
        </div>
        <div>
          ${(plan.meals || []).map(m => `
            <div style="border-left:3px solid var(--primary);padding-left:var(--space-sm);margin-bottom:var(--space-sm)">
              <div style="font-weight:500">${m.time} - ${m.name}</div>
              <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">${m.items.join(', ')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function afterRender() {}

  return { render, afterRender };
})();

if (typeof module !== 'undefined') module.exports = PatientDashboardPage;
