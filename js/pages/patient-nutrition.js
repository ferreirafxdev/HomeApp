// ============================================
// HOME CARE APP — Patient Nutrition Module
// ============================================

const PatientNutrition = (() => {

  let subTab = 'anamnese';

  function render(patient) {
    return `
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">Prontuário Nutricional</h3>
        </div>
        
        <div class="tabs mt-sm" style="border-bottom:1px solid var(--border-color);padding-bottom:0">
          <button class="tab ${subTab === 'anamnese' ? 'active' : ''}" onclick="PatientNutrition.switchSubTab('${patient.id}', 'anamnese')">Anamnese</button>
          <button class="tab ${subTab === 'assessment' ? 'active' : ''}" onclick="PatientNutrition.switchSubTab('${patient.id}', 'assessment')">Avaliação</button>
          <button class="tab ${subTab === 'plan' ? 'active' : ''}" onclick="PatientNutrition.switchSubTab('${patient.id}', 'plan')">Plano Alimentar</button>
        </div>

        <div id="nutritionContent" style="margin-top:var(--space-md)">
          ${renderSubTabContent(patient)}
        </div>
      </div>
    `;
  }

  function switchSubTab(patientId, tab) {
    subTab = tab;
    const patient = Store.getById('patients', patientId);
    const container = document.getElementById('nutritionContent');
    if (container && patient) {
      container.innerHTML = renderSubTabContent(patient);
      
      // Update active class on buttons
      document.querySelectorAll('#tabContent .tabs .tab').forEach(t => {
        t.classList.remove('active');
        if (t.innerText.toLowerCase().includes(tab === 'plan' ? 'plano' : tab === 'assessment' ? 'aval' : 'anamnese')) {
          t.classList.add('active');
        }
      });
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  function renderSubTabContent(patient) {
    if (subTab === 'anamnese') return renderAnamnesis(patient);
    if (subTab === 'assessment') return renderAssessment(patient);
    if (subTab === 'plan') return renderMealPlan(patient);
    return '';
  }

  // ---- ANAMNESE ----
  function renderAnamnesis(patient) {
    const data = patient.nutritionAnamnesis || {};
    return `
      <div class="card-flat">
        <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-md)">
          <h4>Dados Nutricionais</h4>
          <button class="btn btn-outline btn-sm" onclick="PatientNutrition.editAnamnesis('${patient.id}')">Editar</button>
        </div>
        <div class="grid-2">
          <div>
            <p><strong>Alergias:</strong> ${data.allergies || 'Nenhuma'}</p>
            <p><strong>Intolerâncias:</strong> ${data.intolerances || 'Nenhuma'}</p>
            <p><strong>Doenças Base:</strong> ${data.diseases || 'Nenhuma'}</p>
            <p><strong>Medicamentos:</strong> ${data.medications || 'Nenhum'}</p>
          </div>
          <div>
            <p><strong>Objetivo:</strong> ${data.objective || 'Manutenção'}</p>
            <p><strong>Ingestão Hídrica:</strong> ${data.water || '0'} ml/dia</p>
            <p><strong>Histórico Clínico:</strong> ${data.history || 'Sem histórico relevante'}</p>
            <p><strong>Rotina:</strong> ${data.routine || 'Não informada'}</p>
          </div>
        </div>
      </div>
    `;
  }

  function editAnamnesis(patientId) {
    const patient = Store.getById('patients', patientId);
    const data = patient.nutritionAnamnesis || {};
    Modal.show({
      title: 'Editar Anamnese',
      content: `
        <form onsubmit="PatientNutrition.saveAnamnesis(event, '${patientId}')">
          <div class="form-group"><label>Objetivo</label><input class="form-control" name="objective" value="${data.objective || ''}"></div>
          <div class="form-group"><label>Alergias</label><input class="form-control" name="allergies" value="${data.allergies || ''}"></div>
          <div class="form-group"><label>Intolerâncias</label><input class="form-control" name="intolerances" value="${data.intolerances || ''}"></div>
          <div class="form-group"><label>Doenças Base</label><input class="form-control" name="diseases" value="${data.diseases || ''}"></div>
          <div class="form-group"><label>Ingestão Hídrica (ml)</label><input class="form-control" type="number" name="water" value="${data.water || ''}"></div>
          <div class="form-group"><label>Histórico Clínico</label><textarea class="form-control" name="history">${data.history || ''}</textarea></div>
          <button type="submit" class="btn btn-primary btn-full mt-sm">Salvar</button>
        </form>
      `
    });
  }

  function saveAnamnesis(e, patientId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    patient.nutritionAnamnesis = {
      objective: formData.get('objective'),
      allergies: formData.get('allergies'),
      intolerances: formData.get('intolerances'),
      diseases: formData.get('diseases'),
      water: formData.get('water'),
      history: formData.get('history')
    };
    Store.update('patients', patientId, { nutritionAnamnesis: patient.nutritionAnamnesis });
    Modal.close();
    switchSubTab(patientId, 'anamnese');
  }

  // ---- AVALIAÇÃO ----
  function renderAssessment(patient) {
    const ass = Store.getAll('nutritionalAssessments').filter(a => a.patientId === patient.id);
    const latest = ass.length ? ass[ass.length - 1] : null;

    return `
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-md)">
        <h4>Avaliação Física e Cálculos</h4>
        <button class="btn btn-primary btn-sm" onclick="PatientNutrition.newAssessment('${patient.id}')">Nova Avaliação</button>
      </div>
      ${latest ? `
        <div class="grid-3">
          <div class="stat-box" style="background:var(--bg-secondary);padding:var(--space-md);border-radius:var(--border-radius-md)">
            <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">Peso Atual</div>
            <div style="font-weight:700;font-size:1.2rem">${latest.weight} kg</div>
          </div>
          <div class="stat-box" style="background:var(--bg-secondary);padding:var(--space-md);border-radius:var(--border-radius-md)">
            <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">IMC</div>
            <div style="font-weight:700;font-size:1.2rem">${latest.bmi.toFixed(1)}</div>
            <div style="font-size:var(--font-size-xs)">${NutritionCalc.getBMICategory(latest.bmi)}</div>
          </div>
          <div class="stat-box" style="background:var(--bg-secondary);padding:var(--space-md);border-radius:var(--border-radius-md)">
            <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">% Gordura</div>
            <div style="font-weight:700;font-size:1.2rem">${latest.bodyFat ? latest.bodyFat.toFixed(1) + '%' : '-'}</div>
          </div>
        </div>
        <div class="card-flat mt-sm">
          <h5>Metabolismo e Metas (TMB e GET)</h5>
          <p>TMB: ${latest.bmr.toFixed(0)} kcal</p>
          <p>GET: ${latest.tee.toFixed(0)} kcal</p>
          <p>Meta Calórica: ${latest.caloricGoal.toFixed(0)} kcal (${latest.objective})</p>
        </div>
      ` : '<div class="empty-state"><p>Nenhuma avaliação cadastrada.</p></div>'}
    `;
  }

  function newAssessment(patientId) {
    const patient = Store.getById('patients', patientId);
    Modal.show({
      title: 'Nova Avaliação Nutricional',
      content: `
        <form onsubmit="PatientNutrition.saveAssessment(event, '${patientId}')">
          <div class="grid-2">
            <div class="form-group"><label>Peso (kg)</label><input class="form-control" type="number" step="0.1" name="weight" required></div>
            <div class="form-group"><label>Altura (cm)</label><input class="form-control" type="number" name="height" required></div>
            <div class="form-group"><label>Cintura (cm)</label><input class="form-control" type="number" step="0.1" name="waist"></div>
            <div class="form-group"><label>Pescoço (cm)</label><input class="form-control" type="number" step="0.1" name="neck"></div>
            <div class="form-group"><label>Quadril (cm) - Mulheres</label><input class="form-control" type="number" step="0.1" name="hip"></div>
            <div class="form-group"><label>Fator de Atividade</label>
              <select name="activityLevel" class="form-control">
                <option value="1.2">Sedentário (1.2)</option>
                <option value="1.375">Leve (1.375)</option>
                <option value="1.55">Moderado (1.55)</option>
                <option value="1.725">Ativo (1.725)</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-sm">Calcular e Salvar</button>
        </form>
      `
    });
  }

  function saveAssessment(e, patientId) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    
    const weight = parseFloat(data.get('weight'));
    const height = parseFloat(data.get('height'));
    const waist = parseFloat(data.get('waist'));
    const neck = parseFloat(data.get('neck'));
    const hip = parseFloat(data.get('hip'));
    const activity = parseFloat(data.get('activityLevel'));
    
    // Calcula
    const bmi = NutritionCalc.calculateBMI(weight, height);
    const age = parseInt(patient.age) || 30;
    const gender = patient.gender || 'M';
    const bmr = NutritionCalc.calculateBMR(weight, height, age, gender);
    const tee = NutritionCalc.calculateTEE(bmr, activity);
    const bodyFat = NutritionCalc.calculateBodyFatNavy(gender, waist, neck, height, hip);
    const objective = patient.nutritionAnamnesis?.objective?.toLowerCase().includes('emagrecimento') ? 'emagrecimento' : 'manutencao';
    const caloricGoal = NutritionCalc.calculateCaloricGoal(tee, objective);

    Store.add('nutritionalAssessments', {
      patientId,
      date: new Date().toISOString().split('T')[0],
      weight, height, bmi, bmr, tee, bodyFat, caloricGoal, objective
    });
    
    Modal.close();
    switchSubTab(patientId, 'assessment');
  }

  // ---- PLANO ALIMENTAR ----
  function renderMealPlan(patient) {
    const plans = Store.getAll('nutritionalPlans').filter(p => p.patientId === patient.id);
    return `
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-md)">
        <h4>Planos Alimentares</h4>
        <button class="btn btn-primary btn-sm" onclick="PatientNutrition.newPlan('${patient.id}')">Criar Plano</button>
      </div>
      <div>
        ${plans.map(p => `
          <div class="card-flat" style="margin-bottom:var(--space-sm)">
            <div style="display:flex;justify-content:space-between">
              <strong>${p.title} (${p.calories} kcal)</strong>
              <button class="btn btn-ghost btn-sm" onclick="PDFExport.exportMealPlanPDF('${patient.id}', '${p.id}')">
                <i data-lucide="download"></i> PDF
              </button>
            </div>
            <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">Refeições: ${p.meals?.length || 0}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function newPlan(patientId) {
    // In a real app, this would open a complex builder. Here we do a simplified version.
    Modal.show({
      title: 'Novo Plano (Simplificado)',
      content: `
        <form onsubmit="PatientNutrition.savePlan(event, '${patientId}')">
          <div class="form-group"><label>Título</label><input class="form-control" name="title" required placeholder="Dieta Hipertrofia"></div>
          <div class="form-group"><label>Calorias (Total)</label><input class="form-control" type="number" name="calories" required></div>
          <div class="form-group"><label>Refeições (separadas por nova linha ex: 08:00 - Ovos)</label>
            <textarea class="form-control" name="meals" rows="5"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-sm">Salvar Plano</button>
        </form>
      `
    });
  }

  function savePlan(e, patientId) {
    e.preventDefault();
    const data = new FormData(e.target);
    const mealsStr = data.get('meals').split('\n').filter(Boolean);
    const meals = mealsStr.map(m => {
      const parts = m.split('-');
      return { time: parts[0]?.trim() || '', name: parts[1]?.trim() || '', items: [parts[1]?.trim()] };
    });

    Store.add('nutritionalPlans', {
      patientId,
      title: data.get('title'),
      calories: data.get('calories'),
      protein: Math.round(data.get('calories') * 0.3 / 4), // fake calculation
      meals
    });

    Modal.close();
    switchSubTab(patientId, 'plan');
  }

  return { 
    render, 
    switchSubTab,
    editAnamnesis, saveAnamnesis,
    newAssessment, saveAssessment,
    newPlan, savePlan
  };
})();

if (typeof module !== 'undefined') module.exports = PatientNutrition;
