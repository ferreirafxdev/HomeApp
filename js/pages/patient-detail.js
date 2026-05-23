// ============================================
// HOME CARE APP — Patient Detail Page
// ============================================

const PatientDetailPage = (() => {
  let currentTab = 'overview';
  let patientId = null;

  function render(params = {}) {
    patientId = params.id;
    const patient = Store.getById('patients', patientId);
    if (!patient) {
      return '<div class="empty-state"><i data-lucide="user-x"></i><h3>Paciente não encontrado</h3></div>';
    }

    const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    const statusMap = {
      'active': { label: 'Ativo', class: 'badge-success' },
      'palliative': { label: 'Paliativo', class: 'badge-warning' },
      'discharged': { label: 'Alta', class: 'badge-neutral' }
    };
    const status = statusMap[patient.status] || statusMap['active'];

    return `
      <div class="page-enter">
        <!-- Back Button -->
        <button class="btn btn-ghost mb-md" onclick="App.navigate('patients')" style="margin-left:-8px">
          <i data-lucide="arrow-left"></i> Voltar
        </button>

        <!-- Profile Header -->
        <div class="patient-profile-header animate-fade-in-up">
          <div class="avatar avatar-xl avatar-${patient.avatarColor}">${initials}</div>
          <div class="patient-profile-info" style="flex:1">
            <h2>${patient.name}</h2>
            <div class="patient-profile-details">
              <div class="patient-detail-item"><i data-lucide="calendar" style="width:14px;height:14px"></i> ${patient.age} anos (${patient.gender})</div>
              <div class="patient-detail-item"><i data-lucide="heart-pulse" style="width:14px;height:14px"></i> ${patient.bloodType || 'N/I'}</div>
              <div class="patient-detail-item"><i data-lucide="building" style="width:14px;height:14px"></i> ${patient.healthPlan || 'Particular'}</div>
              <span class="badge ${status.class}">${status.label}</span>
            </div>
            <div style="margin-top:var(--space-sm);font-size:var(--font-size-sm);color:var(--text-secondary)">
              <strong>Diagnóstico:</strong> ${patient.diagnosis} (${patient.diagnosisCode || '-'})
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs" id="patientTabs">
          <button class="tab active" onclick="PatientDetailPage.switchTab('overview')" data-tab="overview">
            <i data-lucide="layout-dashboard" style="width:16px;height:16px"></i> Resumo
          </button>
          <button class="tab" onclick="PatientDetailPage.switchTab('prescriptions')" data-tab="prescriptions">
            <i data-lucide="pill" style="width:16px;height:16px"></i> Prescrições
          </button>
          <button class="tab" onclick="PatientDetailPage.switchTab('vitals')" data-tab="vitals">
            <i data-lucide="activity" style="width:16px;height:16px"></i> Sinais Vitais
          </button>
          <button class="tab" onclick="PatientDetailPage.switchTab('evolutions')" data-tab="evolutions">
            <i data-lucide="file-text" style="width:16px;height:16px"></i> Evoluções
          </button>
          <button class="tab" onclick="PatientDetailPage.switchTab('info')" data-tab="info">
            <i data-lucide="user" style="width:16px;height:16px"></i> Dados
          </button>
        </div>

        <!-- Tab Content -->
        <div id="tabContent">
          ${renderTabContent('overview', patient)}
        </div>
      </div>
    `;
  }

  function switchTab(tabName) {
    currentTab = tabName;
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    // Update tab active state
    document.querySelectorAll('#patientTabs .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });

    // Render content
    const content = document.getElementById('tabContent');
    if (content) {
      content.innerHTML = renderTabContent(tabName, patient);
      if (typeof lucide !== 'undefined') lucide.createIcons();
      if (tabName === 'vitals') renderVitalsCharts(patient);
    }
  }

  function renderTabContent(tab, patient) {
    switch (tab) {
      case 'overview': return renderOverview(patient);
      case 'prescriptions': return renderPrescriptions(patient);
      case 'vitals': return renderVitals(patient);
      case 'evolutions': return renderEvolutions(patient);
      case 'info': return renderInfo(patient);
      default: return '';
    }
  }

  function renderOverview(patient) {
    const vitals = Store.getAll('vitalSigns')
      .filter(v => v.patientId === patient.id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const latest = vitals[0];
    const evolutions = Store.getAll('evolutions')
      .filter(e => e.patientId === patient.id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const schedules = Store.getAll('schedules')
      .filter(s => s.patientId === patient.id && s.status !== 'completed')
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

    return `
      <!-- Latest Vitals -->
      ${latest ? `
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">Sinais Vitais Recentes</h3>
            <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${formatDateTime(latest.timestamp)}</span>
          </div>
          <div class="vitals-grid">
            <div class="vital-card ${latest.systolic > 140 ? 'critical' : latest.systolic > 130 ? 'warning' : ''}">
              <div class="vital-icon" style="color:var(--danger)"><i data-lucide="heart" style="width:20px;height:20px"></i></div>
              <div class="vital-value">${latest.systolic}/${latest.diastolic}</div>
              <div class="vital-label">Pressão Arterial</div>
              <div class="vital-unit">mmHg</div>
            </div>
            <div class="vital-card ${latest.heartRate > 100 ? 'warning' : ''}">
              <div class="vital-icon" style="color:var(--primary)"><i data-lucide="activity" style="width:20px;height:20px"></i></div>
              <div class="vital-value">${latest.heartRate}</div>
              <div class="vital-label">Freq. Cardíaca</div>
              <div class="vital-unit">bpm</div>
            </div>
            <div class="vital-card ${latest.spo2 < 90 ? 'critical' : latest.spo2 < 94 ? 'warning' : ''}">
              <div class="vital-icon" style="color:var(--info)"><i data-lucide="wind" style="width:20px;height:20px"></i></div>
              <div class="vital-value">${latest.spo2}%</div>
              <div class="vital-label">SpO2</div>
              <div class="vital-unit">saturação</div>
            </div>
            <div class="vital-card ${latest.temperature > 37.5 ? 'warning' : ''}">
              <div class="vital-icon" style="color:var(--warning)"><i data-lucide="thermometer" style="width:20px;height:20px"></i></div>
              <div class="vital-value">${latest.temperature}°</div>
              <div class="vital-label">Temperatura</div>
              <div class="vital-unit">°C</div>
            </div>
            ${latest.glucose ? `
              <div class="vital-card ${latest.glucose > 160 ? 'warning' : ''}">
                <div class="vital-icon" style="color:var(--secondary)"><i data-lucide="droplets" style="width:20px;height:20px"></i></div>
                <div class="vital-value">${latest.glucose}</div>
                <div class="vital-label">Glicemia</div>
                <div class="vital-unit">mg/dL</div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Therapeutic Plan -->
      <div class="section">
        <h3 class="section-title">Plano Terapêutico</h3>
        <div class="card-flat mt-sm">
          <p style="color:var(--text-secondary);line-height:1.6">${patient.therapeuticPlan || 'Nenhum plano terapêutico registrado.'}</p>
        </div>
      </div>

      <!-- Upcoming Schedules -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">Próximos Atendimentos</h3>
          <span class="badge badge-primary">${schedules.length}</span>
        </div>
        ${schedules.length ? schedules.slice(0, 3).map(s => {
          const prof = Store.getById('professionals', s.professionalId);
          return `
            <div class="schedule-item ${s.type}" style="margin-bottom:var(--space-sm)">
              <span class="upcoming-time">${s.time}</span>
              <div style="flex:1">
                <div style="font-weight:500">${s.title}</div>
                <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">${s.date} — ${prof?.name || ''}</div>
              </div>
              <span class="badge badge-${s.status === 'in-progress' ? 'warning' : 'primary'}">${s.status === 'in-progress' ? 'Em andamento' : 'Agendado'}</span>
            </div>`;
        }).join('') : '<p class="text-secondary" style="font-size:var(--font-size-sm)">Nenhum atendimento agendado</p>'}
      </div>

      <!-- Recent Evolutions -->
      <div class="section">
        <h3 class="section-title">Evoluções Recentes</h3>
        <div class="timeline mt-md">
          ${evolutions.slice(0, 3).map(e => {
            const prof = Store.getById('professionals', e.professionalId);
            return `
              <div class="timeline-item">
                <div class="timeline-dot ${e.type === 'medical' ? 'success' : ''}"></div>
                <div class="timeline-time">${formatDateTime(e.timestamp)}</div>
                <div class="timeline-title">${prof?.name || 'Profissional'} — ${prof?.role || ''}</div>
                <div class="timeline-desc">${e.text}</div>
              </div>`;
          }).join('') || '<p class="text-secondary" style="font-size:var(--font-size-sm)">Nenhuma evolução registrada</p>'}
        </div>
  function renderPrescriptions(patient) {
    const prescriptions = patient.prescriptions || [];
    let changed = false;
    prescriptions.forEach(rx => {
      if (!rx.id) {
        rx.id = Store.generateId();
        changed = true;
      }
      if (!rx.status) {
        rx.status = 'active';
        changed = true;
      }
    });
    if (changed) {
      Store.update('patients', patient.id, { prescriptions });
    }

    const activeRx = prescriptions.filter(rx => rx.status !== 'suspended');
    const suspendedRx = prescriptions.filter(rx => rx.status === 'suspended');

    return `
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">Prescrições Ativas</h3>
          <button class="btn btn-primary btn-sm" onclick="PatientDetailPage.showAddPrescription()">
            <i data-lucide="plus"></i> Adicionar
          </button>
        </div>
        ${activeRx.length ? `
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${activeRx.map((rx) => `
              <div class="medication-item">
                <div style="width:32px;height:32px;background:var(--primary-light);border-radius:var(--border-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i data-lucide="pill" style="width:16px;height:16px;color:var(--primary)"></i>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${rx.medication}</div>
                  <div style="font-size:var(--font-size-sm);color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${rx.dosage}</div>
                </div>
                <span class="badge badge-info" style="margin-right:var(--space-sm);">${rx.route}</span>
                <button class="btn btn-ghost btn-sm text-danger" onclick="PatientDetailPage.suspendPrescription('${rx.id}')" style="color:var(--danger);min-height:36px;padding:4px 8px;min-width:auto;border-radius:var(--border-radius-sm);" title="Suspender medicação">
                  <i data-lucide="ban" style="width:14px;height:14px;color:var(--danger)"></i>
                </button>
              </div>
            `).join('')}
          </div>
        ` : '<div class="empty-state"><i data-lucide="pill"></i><p>Nenhuma prescrição ativa</p></div>'}
      </div>

      ${suspendedRx.length ? `
        <div class="section" style="margin-top:var(--space-xl)">
          <div class="section-header">
            <h3 class="section-title" style="color:var(--text-secondary);display:flex;align-items:center;gap:8px">
              <i data-lucide="pause-circle" style="width:18px;height:18px;color:var(--text-tertiary)"></i> Prescrições Suspensas
            </h3>
            <span class="badge badge-neutral">${suspendedRx.length}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm);margin-top:var(--space-sm)">
            ${suspendedRx.map((rx) => `
              <div class="medication-item" style="opacity:0.65;background:rgba(255,255,255,0.02);border:1px dashed var(--border-color)">
                <div style="width:32px;height:32px;background:var(--bg-tertiary);border-radius:var(--border-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i data-lucide="pill" style="width:16px;height:16px;color:var(--text-tertiary)"></i>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:500;text-decoration:line-through;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${rx.medication}</div>
                  <div style="font-size:var(--font-size-sm);color:var(--text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${rx.dosage}</div>
                </div>
                <span class="badge badge-neutral" style="margin-right:var(--space-sm);">${rx.route}</span>
                <button class="btn btn-ghost btn-sm text-success" onclick="PatientDetailPage.reactivatePrescription('${rx.id}')" style="color:var(--secondary);min-height:36px;padding:4px 8px;min-width:auto;border-radius:var(--border-radius-sm);" title="Reativar medicação">
                  <i data-lucide="rotate-ccw" style="width:14px;height:14px;color:var(--secondary)"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Allergies -->
      <div class="section">
        <h3 class="section-title">⚠️ Alergias</h3>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);margin-top:var(--space-sm)">
          ${patient.allergies?.length ? patient.allergies.map(a => 
            `<span class="badge badge-danger">${a}</span>`
          ).join('') : '<span class="text-secondary" style="font-size:var(--font-size-sm)">Nenhuma alergia registrada</span>'}
        </div>
      </div>

      <!-- Comorbidities -->
      <div class="section">
        <h3 class="section-title">Comorbidades</h3>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);margin-top:var(--space-sm)">
          ${patient.comorbidities?.length ? patient.comorbidities.map(c => 
            `<span class="badge badge-purple">${c}</span>`
          ).join('') : '<span class="text-secondary" style="font-size:var(--font-size-sm)">Nenhuma comorbidade registrada</span>'}
        </div>
      </div>
    `;
  }

  function renderVitals(patient) {
    const vitals = Store.getAll('vitalSigns')
      .filter(v => v.patientId === patient.id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return `
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">Histórico de Sinais Vitais</h3>
          <button class="btn btn-primary btn-sm" onclick="PatientDetailPage.showAddVitals()">
            <i data-lucide="plus"></i> Registrar
          </button>
        </div>
        <div class="grid-2">
          <div class="card-flat">
            <h4 style="margin-bottom:var(--space-sm)">Pressão Arterial (mmHg)</h4>
            <div style="height:180px"><canvas id="bpChart"></canvas></div>
          </div>
          <div class="card-flat">
            <h4 style="margin-bottom:var(--space-sm)">Freq. Cardíaca (bpm) / SpO2 (%)</h4>
            <div style="height:180px"><canvas id="hrChart"></canvas></div>
          </div>
        </div>
      </div>
      <div class="section">
        <h3 class="section-title">Registros</h3>
        <div class="table-cards">
          ${vitals.reverse().map(v => {
            const prof = Store.getById('professionals', v.professionalId);
            return `
              <div class="table-card-item">
                <div class="table-card-row">
                  <span class="table-card-label">Data/Hora</span>
                  <span class="table-card-value">${formatDateTime(v.timestamp)}</span>
                </div>
                <div class="table-card-row">
                  <span class="table-card-label">PA</span>
                  <span class="table-card-value">${v.systolic}/${v.diastolic}</span>
                </div>
                <div class="table-card-row">
                  <span class="table-card-label">FC / SpO2</span>
                  <span class="table-card-value">${v.heartRate} bpm / ${v.spo2}%</span>
                </div>
                <div class="table-card-row">
                  <span class="table-card-label">Temp.</span>
                  <span class="table-card-value">${v.temperature}°C</span>
                </div>
                ${v.glucose ? `<div class="table-card-row"><span class="table-card-label">Glicemia</span><span class="table-card-value">${v.glucose} mg/dL</span></div>` : ''}
                <div class="table-card-row">
                  <span class="table-card-label">Profissional</span>
                  <span class="table-card-value" style="font-size:var(--font-size-sm)">${prof?.name || '-'}</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderVitalsCharts(patient) {
    const vitals = Store.getAll('vitalSigns')
      .filter(v => v.patientId === patient.id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (vitals.length < 2) return;

    setTimeout(() => {
      const labels = vitals.map(v => {
        const d = new Date(v.timestamp);
        return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}h`;
      });

      Charts.lineChart('bpChart', {
        labels,
        datasets: [
          { values: vitals.map(v => v.systolic), color: '#FF453A', label: 'Sistólica' },
          { values: vitals.map(v => v.diastolic), color: '#FF9F0A', label: 'Diastólica' }
        ]
      });

      Charts.lineChart('hrChart', {
        labels,
        datasets: [
          { values: vitals.map(v => v.heartRate), color: '#0A84FF', label: 'FC' },
          { values: vitals.map(v => v.spo2), color: '#30D158', label: 'SpO2' }
        ]
      });
    }, 100);
  }

  function renderEvolutions(patient) {
    const evolutions = Store.getAll('evolutions')
      .filter(e => e.patientId === patient.id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return `
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">Evoluções Clínicas</h3>
          <button class="btn btn-primary btn-sm" onclick="PatientDetailPage.showAddEvolution()">
            <i data-lucide="plus"></i> Nova Evolução
          </button>
        </div>
        <div class="timeline mt-md">
          ${evolutions.map(e => {
            const prof = Store.getById('professionals', e.professionalId);
            const typeColors = { medical: 'success', nursing: '', physio: 'warning', psychology: '' };
            return `
              <div class="timeline-item">
                <div class="timeline-dot ${typeColors[e.type] || ''}"></div>
                <div class="timeline-time">${formatDateTime(e.timestamp)}</div>
                <div class="timeline-title">${prof?.name || 'Profissional'} <span class="badge badge-neutral" style="font-size:10px">${prof?.role || ''}</span></div>
                <div class="timeline-desc">${e.text}</div>
              </div>`;
          }).join('') || '<div class="empty-state"><i data-lucide="file-text"></i><p>Nenhuma evolução registrada</p></div>'}
        </div>
      </div>
    `;
  }

  function renderInfo(patient) {
    return `
      <div class="section">
        <h3 class="section-title">Dados Pessoais</h3>
        <div class="card-flat mt-sm">
          <div style="display:grid;grid-template-columns:1fr;gap:var(--space-md)">
            ${infoRow('Nome', patient.name)}
            ${infoRow('Idade', `${patient.age} anos`)}
            ${infoRow('Sexo', patient.gender === 'M' ? 'Masculino' : 'Feminino')}
            ${infoRow('CPF', patient.cpf || '-')}
            ${infoRow('Telefone', patient.phone || '-')}
            ${infoRow('Endereço', patient.address || '-')}
            ${infoRow('Tipo Sanguíneo', patient.bloodType || '-')}
            ${infoRow('Convênio', patient.healthPlan || 'Particular')}
            ${infoRow('Nº Carteirinha', patient.healthPlanNumber || '-')}
            ${infoRow('Data Admissão', patient.admissionDate || '-')}
          </div>
        </div>
      </div>
      <div class="section">
        <h3 class="section-title">Contato de Emergência</h3>
        <div class="card-flat mt-sm">
          ${infoRow('Contato', patient.emergencyContact || '-')}
          ${infoRow('Parentesco', patient.emergencyRelation || '-')}
        </div>
      </div>
    `;
  }

  function infoRow(label, value) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) 0;border-bottom:1px solid var(--border-color)">
        <span style="color:var(--text-secondary);font-size:var(--font-size-sm)">${label}</span>
        <span style="font-weight:500;text-align:right;max-width:60%">${value}</span>
      </div>
    `;
  }

  function showAddVitals() {
    Modal.show({
      title: 'Registrar Sinais Vitais',
      content: `
        <form id="addVitalsForm" onsubmit="PatientDetailPage.handleAddVitals(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">PA Sistólica *</label>
              <input class="form-input" name="systolic" type="number" required placeholder="120" min="60" max="250">
            </div>
            <div class="form-group">
              <label class="form-label">PA Diastólica *</label>
              <input class="form-input" name="diastolic" type="number" required placeholder="80" min="30" max="150">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Freq. Cardíaca *</label>
              <input class="form-input" name="heartRate" type="number" required placeholder="78" min="30" max="220">
            </div>
            <div class="form-group">
              <label class="form-label">SpO2 (%) *</label>
              <input class="form-input" name="spo2" type="number" required placeholder="96" min="50" max="100">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Temperatura (°C) *</label>
              <input class="form-input" name="temperature" type="number" step="0.1" required placeholder="36.5" min="34" max="42">
            </div>
            <div class="form-group">
              <label class="form-label">Glicemia (mg/dL)</label>
              <input class="form-input" name="glucose" type="number" placeholder="Opcional" min="30" max="600">
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-md">
            <i data-lucide="save"></i> Salvar Sinais Vitais
          </button>
        </form>
      `
    });
  }

  function handleAddVitals(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    const vitals = {
      patientId,
      timestamp: new Date().toISOString(),
      systolic: parseInt(data.get('systolic')),
      diastolic: parseInt(data.get('diastolic')),
      heartRate: parseInt(data.get('heartRate')),
      spo2: parseInt(data.get('spo2')),
      temperature: parseFloat(data.get('temperature')),
      glucose: data.get('glucose') ? parseInt(data.get('glucose')) : null,
      professionalId: Store.get('currentUser')?.id || 'usr001'
    };
    Store.add('vitalSigns', vitals);
    Store.addAuditLog('Registro de sinais vitais', {
      patient: patient?.name,
      details: `PA: ${vitals.systolic}/${vitals.diastolic}, FC: ${vitals.heartRate}, SpO2: ${vitals.spo2}%`
    });
    Modal.close();
    switchTab('vitals');
    Notifications.show('Sinais Vitais', 'Registro salvo com sucesso', 'success');
  }

  function showAddEvolution() {
    Modal.show({
      title: 'Nova Evolução Clínica',
      content: `
        <form id="addEvolutionForm" onsubmit="PatientDetailPage.handleAddEvolution(event)">
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-input" name="type" required>
              <option value="medical">Médica</option>
              <option value="nursing">Enfermagem</option>
              <option value="physio">Fisioterapia</option>
              <option value="psychology">Psicologia</option>
              <option value="nutrition">Nutrição</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Evolução *</label>
            <textarea class="form-input" name="text" required placeholder="Descreva a evolução clínica..." style="min-height:150px"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full">
            <i data-lucide="save"></i> Salvar Evolução
          </button>
        </form>
      `
    });
  }

  function handleAddEvolution(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    const evolution = {
      patientId,
      timestamp: new Date().toISOString(),
      professionalId: Store.get('currentUser')?.id || 'usr001',
      type: data.get('type'),
      text: data.get('text')
    };
    Store.add('evolutions', evolution);
    Store.addAuditLog('Evolução clínica registrada', { patient: patient?.name, details: data.get('text').substring(0, 100) });
    Modal.close();
    switchTab('evolutions');
    Notifications.show('Evolução', 'Registro salvo com sucesso', 'success');
  }

  function showAddPrescription() {
    Modal.show({
      title: 'Adicionar Prescrição',
      content: `
        <form id="addRxForm" onsubmit="PatientDetailPage.handleAddPrescription(event)">
          <div class="form-group">
            <label class="form-label">Medicamento *</label>
            <input class="form-input" name="medication" required placeholder="Ex: Enalapril 10mg">
          </div>
          <div class="form-group">
            <label class="form-label">Posologia *</label>
            <input class="form-input" name="dosage" required placeholder="Ex: 1 cp 12/12h">
          </div>
          <div class="form-group">
            <label class="form-label">Via de Administração *</label>
            <select class="form-input" name="route" required>
              <option value="VO">VO - Via Oral</option>
              <option value="EV">EV - Endovenosa</option>
              <option value="IM">IM - Intramuscular</option>
              <option value="SC">SC - Subcutânea</option>
              <option value="INH">INH - Inalatória</option>
              <option value="TOP">TOP - Tópica</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-full">
            <i data-lucide="plus"></i> Adicionar Prescrição
          </button>
        </form>
      `
    });
  }

  function handleAddPrescription(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    if (!patient) return;
    const rx = {
      id: Store.generateId(),
      medication: data.get('medication'),
      dosage: data.get('dosage'),
      route: data.get('route'),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    if (!patient.prescriptions) patient.prescriptions = [];
    patient.prescriptions.push(rx);
    Store.update('patients', patientId, { prescriptions: patient.prescriptions });
    Store.addAuditLog('Prescrição adicionada', { patient: patient.name, details: `${rx.medication} - ${rx.dosage}` });
    Modal.close();
    switchTab('prescriptions');
    Notifications.show('Prescrição', `${rx.medication} adicionado com sucesso`, 'success');
  }

  function suspendPrescription(id) {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;
    const prescriptions = patient.prescriptions || [];
    const rx = prescriptions.find(r => r.id === id);
    if (!rx) return;
    rx.status = 'suspended';
    Store.update('patients', patientId, { prescriptions });
    Store.addAuditLog('Prescrição suspensa', { patient: patient.name, details: `${rx.medication} - ${rx.dosage}` });
    switchTab('prescriptions');
    Notifications.show('Prescrição', `${rx.medication} suspenso com sucesso`, 'warning');
  }

  function reactivatePrescription(id) {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;
    const prescriptions = patient.prescriptions || [];
    const rx = prescriptions.find(r => r.id === id);
    if (!rx) return;
    rx.status = 'active';
    Store.update('patients', patientId, { prescriptions });
    Store.addAuditLog('Prescrição reativada', { patient: patient.name, details: `${rx.medication} - ${rx.dosage}` });
    switchTab('prescriptions');
    Notifications.show('Prescrição', `${rx.medication} reativado com sucesso`, 'success');
  }

  function formatDateTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function afterRender() {
    Header.updateTitle('Paciente', Store.getById('patients', patientId)?.name || '');
    const patient = Store.getById('patients', patientId);
    if (patient && currentTab === 'vitals') renderVitalsCharts(patient);
  }

  return {
    render, afterRender, switchTab,
    showAddVitals, handleAddVitals,
    showAddEvolution, handleAddEvolution,
    showAddPrescription, handleAddPrescription,
    suspendPrescription, reactivatePrescription
  };
})();
