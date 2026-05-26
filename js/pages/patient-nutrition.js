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
          <button class="tab ${subTab === 'photos' ? 'active' : ''}" onclick="PatientNutrition.switchSubTab('${patient.id}', 'photos')">Fotos</button>
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
        if (t.innerText.toLowerCase().includes(tab === 'plan' ? 'plano' : tab === 'assessment' ? 'aval' : tab === 'photos' ? 'foto' : 'anamnese')) {
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
    if (subTab === 'photos') return renderPhotos(patient);
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
          <div class="form-group"><label>Objetivo</label><input class="form-input" name="objective" value="${data.objective || ''}"></div>
          <div class="form-group"><label>Alergias</label><input class="form-input" name="allergies" value="${data.allergies || ''}"></div>
          <div class="form-group"><label>Intolerâncias</label><input class="form-input" name="intolerances" value="${data.intolerances || ''}"></div>
          <div class="form-group"><label>Doenças Base</label><input class="form-input" name="diseases" value="${data.diseases || ''}"></div>
          <div class="form-group"><label>Ingestão Hídrica (ml)</label><input class="form-input" type="number" name="water" value="${data.water || ''}"></div>
          <div class="form-group"><label>Histórico Clínico</label><textarea class="form-input" name="history">${data.history || ''}</textarea></div>
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
            <div class="form-group"><label>Peso (kg)</label><input class="form-input" type="number" step="0.1" name="weight" required></div>
            <div class="form-group"><label>Altura (cm)</label><input class="form-input" type="number" name="height" required></div>
            <div class="form-group"><label>Cintura (cm)</label><input class="form-input" type="number" step="0.1" name="waist"></div>
            <div class="form-group"><label>Pescoço (cm)</label><input class="form-input" type="number" step="0.1" name="neck"></div>
            <div class="form-group"><label>Quadril (cm) - Mulheres</label><input class="form-input" type="number" step="0.1" name="hip"></div>
            <div class="form-group"><label>Fator de Atividade</label>
              <select name="activityLevel" class="form-input">
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
              <button class="btn btn-ghost btn-sm" onclick="PdfExport.exportMealPlanPDF('${patient.id}', '${p.id}')">
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
          <div class="form-group"><label>Título</label><input class="form-input" name="title" required placeholder="Dieta Hipertrofia"></div>
          <div class="form-group"><label>Calorias (Total)</label><input class="form-input" type="number" name="calories" required></div>
          <div class="form-group"><label>Refeições (separadas por nova linha ex: 08:00 - Ovos)</label>
            <textarea class="form-input" name="meals" rows="5"></textarea>
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

  // ---- FOTOS EVOLUTIVAS ----
  function renderPhotos(patient) {
    const photos = Store.getAll('patientPhotos').filter(p => p.patientId === patient.id).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md)">
        <div>
          <h4 style="margin:0">Evolução Visual</h4>
          <p style="font-size:var(--font-size-sm);color:var(--text-secondary);margin:0">Acompanhamento através de fotos</p>
        </div>
        <div style="display:flex;gap:var(--space-sm)">
          <button class="btn btn-outline btn-sm" onclick="PatientNutrition.comparePhotosModal('${patient.id}')" ${photos.length < 2 ? 'disabled' : ''}>
            <i data-lucide="sliders"></i> Comparar
          </button>
          <button class="btn btn-primary btn-sm" onclick="PatientNutrition.newPhotoModal('${patient.id}')">
            <i data-lucide="camera"></i> Adicionar
          </button>
        </div>
      </div>
      
      ${photos.length === 0 ? '<div class="empty-state"><p>Nenhuma foto registrada ainda.</p></div>' : `
        <div class="photo-gallery-grid">
          ${photos.map(p => `
            <div class="photo-card animate-fade-in-up">
              <div class="photo-card-header">
                <span class="photo-card-date">${new Date(p.date + 'T00:00:00').toLocaleDateString()}</span>
              </div>
              <div class="photo-card-body">
                ${p.frontImg ? `<div class="photo-img-wrapper" onclick="Modal.show({title:'Frente', content:'<img src=\\'${p.frontImg}\\' style=\\'width:100%\\'>'})"><img src="${p.frontImg}"><div class="photo-img-label">Frente</div></div>` : ''}
                ${p.sideImg ? `<div class="photo-img-wrapper" onclick="Modal.show({title:'Perfil', content:'<img src=\\'${p.sideImg}\\' style=\\'width:100%\\'>'})"><img src="${p.sideImg}"><div class="photo-img-label">Perfil</div></div>` : ''}
                ${p.backImg ? `<div class="photo-img-wrapper" onclick="Modal.show({title:'Costas', content:'<img src=\\'${p.backImg}\\' style=\\'width:100%\\'>'})"><img src="${p.backImg}"><div class="photo-img-label">Costas</div></div>` : ''}
              </div>
              <div class="photo-card-footer">
                <div class="photo-stat">
                  <span class="photo-stat-val">${p.weight || '-'}kg</span>
                  <span class="photo-stat-lbl">Peso</span>
                </div>
                <div class="photo-stat">
                  <span class="photo-stat-val">${p.bmi || '-'}</span>
                  <span class="photo-stat-lbl">IMC</span>
                </div>
                <div class="photo-stat">
                  <span class="photo-stat-val">${p.bodyFat ? p.bodyFat + '%' : '-'}</span>
                  <span class="photo-stat-lbl">% Gord</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function newPhotoModal(patientId) {
    const ass = Store.getAll('nutritionalAssessments').filter(a => a.patientId === patientId);
    const latest = ass.length ? ass[ass.length - 1] : {};

    Modal.show({
      title: 'Adicionar Fotos Evolutivas',
      content: `
        <form onsubmit="PatientNutrition.savePhotos(event, '${patientId}')">
          <div class="grid-3" style="margin-bottom:var(--space-md)">
            <div class="form-group">
              <label>Frente</label>
              <input type="file" accept="image/*" id="upload-front" class="form-input" style="font-size:12px">
            </div>
            <div class="form-group">
              <label>Perfil</label>
              <input type="file" accept="image/*" id="upload-side" class="form-input" style="font-size:12px">
            </div>
            <div class="form-group">
              <label>Costas</label>
              <input type="file" accept="image/*" id="upload-back" class="form-input" style="font-size:12px">
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group"><label>Data</label><input type="date" name="date" class="form-input" required value="${new Date().toISOString().split('T')[0]}"></div>
            <div class="form-group"><label>Peso Atual (kg)</label><input type="number" step="0.1" name="weight" class="form-input" value="${latest.weight || ''}"></div>
          </div>
          <div class="form-group">
            <label>Observações</label>
            <textarea name="notes" class="form-input" rows="2"></textarea>
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:var(--space-sm);background:var(--bg-secondary);padding:var(--space-sm);border-radius:var(--border-radius);border:1px solid var(--border-color)">
            <input type="checkbox" id="lgpd-consent" required style="width:18px;height:18px">
            <label for="lgpd-consent" style="margin:0;font-size:var(--font-size-xs);color:var(--text-secondary)">
              Confirmo que tenho autorização para armazenar estas fotos (LGPD).
            </label>
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-sm">Salvar Fotos</button>
        </form>
      `
    });
  }

  function savePhotos(e, patientId) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Processando...';

    const data = new FormData(e.target);
    const date = data.get('date');
    const weight = data.get('weight');
    const notes = data.get('notes');
    
    const ass = Store.getAll('nutritionalAssessments').filter(a => a.patientId === patientId);
    const latest = ass.length ? ass[ass.length - 1] : null;
    let bmi = '-';
    if (latest && latest.height && weight) {
      bmi = NutritionCalc.calculateBMI(parseFloat(weight), parseFloat(latest.height)).toFixed(1);
    }
    const bodyFat = latest ? (latest.bodyFat ? latest.bodyFat.toFixed(1) : '') : '';

    const toBase64 = file => new Promise((resolve, reject) => {
      if (!file || file.size === 0) return resolve(null);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

    const frontFile = document.getElementById('upload-front').files[0];
    const sideFile = document.getElementById('upload-side').files[0];
    const backFile = document.getElementById('upload-back').files[0];

    Promise.all([toBase64(frontFile), toBase64(sideFile), toBase64(backFile)]).then(([frontImg, sideImg, backImg]) => {
      Store.add('patientPhotos', {
        patientId,
        date,
        weight,
        bmi,
        bodyFat,
        notes,
        frontImg,
        sideImg,
        backImg,
        consentLGPD: true,
        consentDate: new Date().toISOString()
      });
      Modal.close();
      if (typeof PatientDashboardPage !== 'undefined' && App.currentRoute === 'patient-dashboard') {
         App.navigate('patient-dashboard'); // refresh if in patient dashboard
      } else {
         switchSubTab(patientId, 'photos');
      }
    }).catch(err => {
      console.error(err);
      btn.disabled = false;
      btn.innerText = 'Erro ao salvar';
    });
  }

  function comparePhotosModal(patientId) {
    const photos = Store.getAll('patientPhotos').filter(p => p.patientId === patientId).sort((a,b) => new Date(a.date) - new Date(b.date));
    if (photos.length < 2) return;

    Modal.show({
      title: 'Comparação Antes e Depois',
      content: `
        <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md)">
          <div style="flex:1">
            <label style="font-size:var(--font-size-xs)">Antes (Data)</label>
            <select id="compare-before" class="form-input" onchange="PatientNutrition.updateComparison()">
              ${photos.map((p,i) => `<option value="${p.id}" ${i===0?'selected':''}>${new Date(p.date+'T00:00:00').toLocaleDateString()}</option>`).join('')}
            </select>
          </div>
          <div style="flex:1">
            <label style="font-size:var(--font-size-xs)">Depois (Data)</label>
            <select id="compare-after" class="form-input" onchange="PatientNutrition.updateComparison()">
              ${photos.map((p,i) => `<option value="${p.id}" ${i===photos.length-1?'selected':''}>${new Date(p.date+'T00:00:00').toLocaleDateString()}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="comparison-render-area"></div>
      `
    });
    setTimeout(() => updateComparison(), 50);
  }

  function updateComparison() {
    const beforeId = document.getElementById('compare-before').value;
    const afterId = document.getElementById('compare-after').value;
    const beforeP = Store.getAll('patientPhotos').find(p => p.id === beforeId);
    const afterP = Store.getAll('patientPhotos').find(p => p.id === afterId);
    const area = document.getElementById('comparison-render-area');
    
    const imgBefore = beforeP.frontImg || beforeP.sideImg || beforeP.backImg;
    const imgAfter = afterP.frontImg || afterP.sideImg || afterP.backImg;

    if (!imgBefore || !imgAfter) {
      area.innerHTML = '<p>Fotos insuficientes para comparação.</p>';
      return;
    }

    area.innerHTML = `
      <div class="comparison-container" id="comp-container">
        <div class="comparison-img-wrapper">
          <img src="${imgAfter}" class="comparison-img-after">
          <div class="comparison-overlay" id="comp-overlay">
            <img src="${imgBefore}">
          </div>
          <div class="comparison-slider-handle" id="comp-handle">
            <div class="comparison-slider-button"><i data-lucide="chevrons-left-right"></i></div>
          </div>
          <div class="comparison-labels">
            <div class="comparison-label">Antes</div>
            <div class="comparison-label">Depois</div>
          </div>
        </div>
      </div>
      <div class="grid-2 mt-md" style="font-size:var(--font-size-sm);text-align:center">
        <div style="background:var(--bg-secondary);padding:var(--space-sm);border-radius:var(--border-radius)">
          <div style="color:var(--text-secondary)">Antes</div>
          <div style="font-weight:700">${beforeP.weight||'-'}kg | IMC: ${beforeP.bmi||'-'}</div>
        </div>
        <div style="background:var(--bg-secondary);padding:var(--space-sm);border-radius:var(--border-radius)">
          <div style="color:var(--text-secondary)">Depois</div>
          <div style="font-weight:700">${afterP.weight||'-'}kg | IMC: ${afterP.bmi||'-'}</div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initSlider();
  }

  function initSlider() {
    const container = document.getElementById('comp-container');
    const overlay = document.getElementById('comp-overlay');
    const handle = document.getElementById('comp-handle');
    if(!container) return;

    let isDragging = false;
    
    const moveSlider = (e) => {
      if(!isDragging) return;
      const rect = container.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      let percent = (x / rect.width) * 100;
      percent = Math.max(0, Math.min(100, percent));
      overlay.style.width = percent + '%';
      handle.style.left = percent + '%';
    };

    handle.addEventListener('mousedown', () => isDragging = true);
    handle.addEventListener('touchstart', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('mousemove', moveSlider);
    window.addEventListener('touchmove', moveSlider);
  }

  return { 
    render, 
    switchSubTab,
    editAnamnesis, saveAnamnesis,
    newAssessment, saveAssessment,
    newPlan, savePlan,
    newPhotoModal, savePhotos,
    comparePhotosModal, updateComparison,
    renderPhotos
  };
})();

if (typeof module !== 'undefined') module.exports = PatientNutrition;
