// ============================================
// HOME CARE APP — FoodDiaryPage
// ============================================

const FoodDiaryPage = (() => {

  function render() {
    const user = Store.get('currentUser');
    const today = new Date().toISOString().split('T')[0];
    const diaries = Store.getAll('foodDiaries').filter(d => d.patientId === user.id && d.date === today);

    return `
      <div class="page-enter">
        <div class="card animate-fade-in-up">
          <div class="card-header">
            <h3 class="card-title">Diário Alimentar — Hoje</h3>
            <button class="btn btn-primary btn-sm" onclick="FoodDiaryPage.openDiaryModal()">
              <i data-lucide="plus" style="width:14px;height:14px"></i> Registrar
            </button>
          </div>
          <div style="padding:var(--space-md)">
            ${renderDiaries(diaries)}
          </div>
        </div>
      </div>
    `;
  }

  function renderDiaries(diaries) {
    if (!diaries.length) {
      return '<div class="empty-state p-md"><p class="text-secondary">Nenhum registro hoje. Comece a anotar suas refeições!</p></div>';
    }

    return diaries.map(d => `
      <div style="border:1px solid var(--border-color);border-radius:var(--border-radius-md);padding:var(--space-md);margin-bottom:var(--space-md)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm)">
          <div style="font-weight:600;display:flex;align-items:center;gap:var(--space-sm)">
            <i data-lucide="clock" style="width:16px;color:var(--text-secondary)"></i> ${d.time} — ${d.mealName}
          </div>
          <span class="badge ${d.adherence ? 'badge-success' : 'badge-warning'}">
            ${d.adherence ? 'Na dieta' : 'Fora da dieta'}
          </span>
        </div>
        <div style="color:var(--text-secondary);margin-bottom:var(--space-sm)">
          ${d.description}
        </div>
        <div class="grid-3" style="font-size:var(--font-size-xs)">
          <div><strong>Fome:</strong> ${d.hunger}/10</div>
          <div><strong>Água:</strong> ${d.water} ml</div>
          <div><strong>Humor:</strong> ${d.mood}</div>
        </div>
      </div>
    `).join('');
  }

  function openDiaryModal() {
    const html = `
      <form id="formDiary" onsubmit="FoodDiaryPage.saveDiary(event)">
        <div class="form-group">
          <label>Horário</label>
          <input type="time" name="time" required class="form-control" value="${new Date().toTimeString().substring(0, 5)}">
        </div>
        <div class="form-group">
          <label>Refeição</label>
          <select name="mealName" class="form-control" required>
            <option value="Café da Manhã">Café da Manhã</option>
            <option value="Lanche da Manhã">Lanche da Manhã</option>
            <option value="Almoço">Almoço</option>
            <option value="Lanche da Tarde">Lanche da Tarde</option>
            <option value="Jantar">Jantar</option>
            <option value="Ceia">Ceia</option>
            <option value="Extra">Extra</option>
          </select>
        </div>
        <div class="form-group">
          <label>O que você comeu?</label>
          <textarea name="description" rows="3" class="form-control" required placeholder="Descreva os alimentos e quantidades..."></textarea>
        </div>
        <div class="form-group">
          <label>Água ingerida (ml)</label>
          <input type="number" name="water" class="form-control" placeholder="Ex: 300">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Nível de Fome (0-10)</label>
            <input type="number" name="hunger" min="0" max="10" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Humor</label>
            <select name="mood" class="form-control">
              <option value="Feliz">Feliz 😊</option>
              <option value="Normal">Normal 😐</option>
              <option value="Ansioso">Ansioso 😰</option>
              <option value="Cansado">Cansado 😴</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:var(--space-sm)">
          <input type="checkbox" name="adherence" id="adherence" checked>
          <label for="adherence" style="margin:0">Segui a dieta planejada</label>
        </div>
        <button type="submit" class="btn btn-primary btn-full mt-md">Salvar Registro</button>
      </form>
    `;
    Modal.show('Novo Registro Alimentar', html);
  }

  function saveDiary(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const user = Store.get('currentUser');
    
    Store.add('foodDiaries', {
      patientId: user.id,
      date: new Date().toISOString().split('T')[0],
      time: data.get('time'),
      mealName: data.get('mealName'),
      description: data.get('description'),
      water: data.get('water') || 0,
      hunger: data.get('hunger'),
      mood: data.get('mood'),
      adherence: data.get('adherence') === 'on'
    });

    Modal.close();
    Notifications.show('Sucesso', 'Refeição registrada!', 'success');
    App.navigate('food-diary');
  }

  function afterRender() {}

  return { render, afterRender, openDiaryModal, saveDiary };
})();

if (typeof module !== 'undefined') module.exports = FoodDiaryPage;
