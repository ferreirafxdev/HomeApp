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
          <button class="tab" onclick="PatientDetailPage.switchTab('plan')" data-tab="plan">
            <i data-lucide="clipboard-list" style="width:16px;height:16px"></i> Plano Terapêutico
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
      case 'plan': return renderTherapeuticPlan(patient);
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
        <div class="section-header">
          <h3 class="section-title">Plano Terapêutico</h3>
          <button class="btn btn-ghost btn-sm" onclick="PatientDetailPage.switchTab('plan')" style="color:var(--primary);padding:4px 8px;min-height:auto">
            Ver Plano Completo <i data-lucide="arrow-right" style="width:14px;height:14px;margin-left:4px"></i>
          </button>
        </div>
        <div class="card-flat mt-sm">
          <p style="color:var(--text-secondary);line-height:1.6;margin-bottom:var(--space-md)">
            ${patient.therapeuticPlan || 'Nenhum plano terapêutico registrado.'}
          </p>
          
          ${(patient.therapeuticGoals && patient.therapeuticGoals.length > 0) ? (() => {
            const goals = patient.therapeuticGoals;
            const achieved = goals.filter(g => g.status === 'achieved').length;
            const total = goals.length;
            const pct = Math.round((achieved / total) * 100);
            return `
              <div style="margin-top:var(--space-md);border-top:1px solid var(--border-color);padding-top:var(--space-md)">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:var(--font-size-xs)">
                  <span class="font-semibold text-success" style="display:flex;align-items:center;gap:4px">
                    <i data-lucide="target" style="width:12px;height:12px"></i> Metas Terapêuticas
                  </span>
                  <span style="color:var(--text-secondary)">${achieved} de ${total} alcançadas (${pct}%)</span>
                </div>
                <div style="width:100%;height:6px;background:var(--bg-tertiary);border-radius:var(--border-radius-full);overflow:hidden;margin-bottom:var(--space-sm)">
                  <div style="width:${pct}%;height:100%;background:linear-gradient(90deg, var(--secondary), var(--info));border-radius:var(--border-radius-full)"></div>
                </div>
              </div>
            `;
          })() : ''}

          ${(patient.therapeuticInterventions && patient.therapeuticInterventions.length > 0) ? (() => {
            const activeInts = patient.therapeuticInterventions.filter(i => i.status !== 'suspended');
            if (activeInts.length === 0) return '';
            const specialtyIcons = {
              'Fisioterapia': 'activity',
              'Fonoaudiologia': 'volume-2',
              'Enfermagem': 'heart',
              'Nutrição': 'apple',
              'Psicologia': 'brain',
              'Terapia Ocupacional': 'briefcase',
              'Medicina': 'stethoscope',
              'Outro': 'user'
            };
            return `
              <div style="margin-top:var(--space-sm);border-top:1px solid var(--border-color);padding-top:var(--space-sm)">
                <span class="font-semibold text-secondary" style="font-size:var(--font-size-xs);display:block;margin-bottom:8px">Intervenções & Condutas Ativas</span>
                <div style="display:flex;flex-wrap:wrap;gap:6px">
                  ${activeInts.slice(0, 3).map(int => `
                    <span class="badge badge-neutral" style="display:inline-flex;align-items:center;gap:4px;font-size:10px;padding:3px 6px">
                      <i data-lucide="${specialtyIcons[int.professionalType] || 'user'}" style="width:10px;height:10px"></i>
                      <strong>${int.professionalType}:</strong> ${int.frequency}
                    </span>
                  `).join('')}
                  ${activeInts.length > 3 ? `<span class="badge badge-neutral" style="font-size:10px;padding:3px 6px">+${activeInts.length - 3} mais</span>` : ''}
                </div>
              </div>
            `;
          })() : ''}
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
      </div>
    `;
  }

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

  // ---- PLANO TERAPÊUTICO METHODS & RENDERING ----

  function formatDateOnly(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function renderTherapeuticPlan(patient) {
    const goals = patient.therapeuticGoals || [];
    const interventions = patient.therapeuticInterventions || [];

    const achievedCount = goals.filter(g => g.status === 'achieved').length;
    const totalGoals = goals.length;
    const progressPercent = totalGoals > 0 ? Math.round((achievedCount / totalGoals) * 100) : 0;

    const specialtyIcons = {
      'Fisioterapia': 'activity',
      'Fonoaudiologia': 'volume-2',
      'Enfermagem': 'heart',
      'Nutrição': 'apple',
      'Psicologia': 'brain',
      'Terapia Ocupacional': 'briefcase',
      'Medicina': 'stethoscope',
      'Outro': 'user'
    };

    const statusBadgeClasses = {
      'pending': 'badge-info',
      'in-progress': 'badge-warning',
      'achieved': 'badge-success'
    };

    const statusLabels = {
      'pending': 'Pendente',
      'in-progress': 'Em Andamento',
      'achieved': 'Alcançado'
    };

    return `
      <!-- General Description Section -->
      <div class="section animate-fade-in-up">
        <div class="section-header">
          <h3 class="section-title">Descrição Geral</h3>
          <button class="btn btn-ghost btn-sm" onclick="PatientDetailPage.showEditPlanDescription()" style="color:var(--primary)">
            <i data-lucide="edit-3"></i> Editar Descrição
          </button>
        </div>
        <div class="card-flat mt-sm">
          <p style="color:var(--text-secondary);line-height:1.6;white-space:pre-line;">
            ${patient.therapeuticPlan || 'Nenhum plano terapêutico registrado. Adicione uma descrição para começar.'}
          </p>
        </div>
      </div>

      <!-- Goals Section -->
      <div class="section animate-fade-in-up delay-1">
        <div class="section-header">
          <h3 class="section-title">Metas Terapêuticas</h3>
          <button class="btn btn-primary btn-sm" onclick="PatientDetailPage.showAddGoal()">
            <i data-lucide="plus"></i> Adicionar Meta
          </button>
        </div>

        ${totalGoals > 0 ? `
          <!-- Goals Progress Bar -->
          <div class="card-flat mt-sm" style="margin-bottom:var(--space-md);background:rgba(48,209,88,0.03);border-color:rgba(48,209,88,0.15)">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:var(--font-size-sm)">
              <span class="font-semibold" style="color:var(--secondary)">Progresso Assistencial</span>
              <span style="color:var(--text-secondary)">${achievedCount} de ${totalGoals} metas alcançadas (${progressPercent}%)</span>
            </div>
            <div style="width:100%;height:8px;background:var(--bg-tertiary);border-radius:var(--border-radius-full);overflow:hidden">
              <div style="width:${progressPercent}%;height:100%;background:linear-gradient(90deg, var(--secondary), var(--info));border-radius:var(--border-radius-full);transition:width 0.4s ease"></div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${goals.map(g => `
              <div class="card-flat" style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md)">
                <div style="cursor:pointer;" onclick="PatientDetailPage.cycleGoalStatus('${g.id}')" title="Clique para alterar o status">
                  <span class="badge ${statusBadgeClasses[g.status] || 'badge-neutral'}" style="display:inline-flex;align-items:center;gap:4px;user-select:none;">
                    <i data-lucide="${g.status === 'achieved' ? 'check-circle-2' : g.status === 'in-progress' ? 'play-circle' : 'circle'}" style="width:12px;height:12px"></i>
                    ${statusLabels[g.status] || g.status}
                  </span>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:500;color:var(--text-primary);${g.status === 'achieved' ? 'text-decoration:line-through;opacity:0.6;' : ''}">${g.description}</div>
                  ${g.targetDate ? `<div style="font-size:var(--font-size-xs);color:var(--text-tertiary);margin-top:2px"><i data-lucide="calendar" style="width:10px;height:10px;display:inline-block;margin-right:2px"></i> Prazo: ${formatDateOnly(g.targetDate)}</div>` : ''}
                </div>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-ghost btn-sm" onclick="PatientDetailPage.showEditGoal('${g.id}')" style="min-height:32px;min-width:32px;padding:4px;border-radius:var(--border-radius-sm)" title="Editar Meta">
                    <i data-lucide="edit-2" style="width:14px;height:14px;color:var(--text-secondary)"></i>
                  </button>
                  <button class="btn btn-ghost btn-sm text-danger" onclick="PatientDetailPage.deleteGoal('${g.id}')" style="min-height:32px;min-width:32px;padding:4px;border-radius:var(--border-radius-sm)" title="Excluir Meta">
                    <i data-lucide="trash-2" style="width:14px;height:14px;color:var(--danger)"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state"><i data-lucide="target"></i><p>Nenhuma meta cadastrada no momento.</p></div>
        `}
      </div>

      <!-- Interventions Section -->
      <div class="section animate-fade-in-up delay-2">
        <div class="section-header">
          <h3 class="section-title">Condutas & Intervenções</h3>
          <button class="btn btn-primary btn-sm" onclick="PatientDetailPage.showAddIntervention()">
            <i data-lucide="plus"></i> Adicionar Intervenção
          </button>
        </div>

        ${interventions.length > 0 ? `
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${interventions.map(int => {
              const icon = specialtyIcons[int.professionalType] || 'user';
              const isSuspended = int.status === 'suspended';
              return `
                <div class="medication-item" style="${isSuspended ? 'opacity:0.65;background:rgba(255,255,255,0.02);border:1px dashed var(--border-color)' : ''}">
                  <div style="width:36px;height:36px;background:${isSuspended ? 'var(--bg-tertiary)' : 'var(--primary-light)'};border-radius:var(--border-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i data-lucide="${icon}" style="width:18px;height:18px;color:${isSuspended ? 'var(--text-tertiary)' : 'var(--primary)'}"></i>
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                      <strong style="${isSuspended ? 'text-decoration:line-through;color:var(--text-secondary);' : ''}">${int.professionalType}</strong>
                      <span class="badge ${isSuspended ? 'badge-neutral' : 'badge-primary'}">${int.frequency}</span>
                    </div>
                    <div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-top:4px;word-break:break-word">${int.description}</div>
                  </div>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-sm" onclick="PatientDetailPage.toggleInterventionStatus('${int.id}')" style="min-height:32px;min-width:32px;padding:4px;border-radius:var(--border-radius-sm)" title="${isSuspended ? 'Reativar Intervenção' : 'Suspender Intervenção'}">
                      <i data-lucide="${isSuspended ? 'play' : 'pause'}" style="width:14px;height:14px;color:${isSuspended ? 'var(--secondary)' : 'var(--warning)'}"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="PatientDetailPage.showEditIntervention('${int.id}')" style="min-height:32px;min-width:32px;padding:4px;border-radius:var(--border-radius-sm)" title="Editar Intervenção">
                      <i data-lucide="edit-2" style="width:14px;height:14px;color:var(--text-secondary)"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm text-danger" onclick="PatientDetailPage.deleteIntervention('${int.id}')" style="min-height:32px;min-width:32px;padding:4px;border-radius:var(--border-radius-sm)" title="Excluir Intervenção">
                      <i data-lucide="trash-2" style="width:14px;height:14px;color:var(--danger)"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="empty-state"><i data-lucide="activity"></i><p>Nenhuma intervenção cadastrada no momento.</p></div>
        `}
      </div>
    `;
  }

  // --- Description Methods ---
  function showEditPlanDescription() {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    Modal.show({
      title: 'Editar Descrição do Plano Terapêutico',
      content: `
        <form id="editPlanDescForm" onsubmit="PatientDetailPage.handleEditPlanDescription(event)">
          <div class="form-group">
            <label class="form-label">Descrição Geral *</label>
            <textarea class="form-input" name="therapeuticPlan" required placeholder="Descreva o plano terapêutico geral..." style="min-height:180px">${patient.therapeuticPlan || ''}</textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-md">
            <i data-lucide="save"></i> Salvar Alterações
          </button>
        </form>
      `
    });
  }

  function handleEditPlanDescription(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    const newPlanText = data.get('therapeuticPlan');
    Store.update('patients', patientId, { therapeuticPlan: newPlanText });
    Store.addAuditLog('Plano Terapêutico atualizado', { patient: patient.name, details: newPlanText.substring(0, 100) });

    Modal.close();
    switchTab('plan');
    Notifications.show('Sucesso', 'Descrição do plano atualizada', 'success');
  }

  // --- Goals Methods ---
  function showAddGoal() {
    Modal.show({
      title: 'Adicionar Meta Terapêutica',
      content: `
        <form id="addGoalForm" onsubmit="PatientDetailPage.handleAddGoal(event)">
          <div class="form-group">
            <label class="form-label">Descrição da Meta *</label>
            <input class="form-input" name="description" required placeholder="Ex: Ganhar amplitude de movimento no joelho esquerdo">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Prazo Estimado</label>
              <input class="form-input" type="date" name="targetDate">
            </div>
            <div class="form-group">
              <label class="form-label">Status Inicial</label>
              <select class="form-input" name="status">
                <option value="pending">Pendente</option>
                <option value="in-progress">Em Andamento</option>
                <option value="achieved">Alcançado</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-md">
            <i data-lucide="plus"></i> Adicionar Meta
          </button>
        </form>
      `
    });
  }

  function handleAddGoal(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    const goal = {
      id: Store.generateId(),
      description: data.get('description'),
      targetDate: data.get('targetDate') || null,
      status: data.get('status'),
      createdAt: new Date().toISOString()
    };

    const goals = patient.therapeuticGoals || [];
    goals.push(goal);
    Store.update('patients', patientId, { therapeuticGoals: goals });
    Store.addAuditLog('Meta terapêutica adicionada', { patient: patient.name, details: goal.description });

    Modal.close();
    switchTab('plan');
    Notifications.show('Meta Adicionada', 'A meta foi cadastrada com sucesso', 'success');
  }

  function showEditGoal(goalId) {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;
    const goals = patient.therapeuticGoals || [];
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    Modal.show({
      title: 'Editar Meta Terapêutica',
      content: `
        <form id="editGoalForm" onsubmit="PatientDetailPage.handleEditGoal(event, '${goalId}')">
          <div class="form-group">
            <label class="form-label">Descrição da Meta *</label>
            <input class="form-input" name="description" required value="${goal.description}" placeholder="Ex: Ganhar amplitude de movimento no joelho esquerdo">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Prazo Estimado</label>
              <input class="form-input" type="date" name="targetDate" value="${goal.targetDate || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" name="status">
                <option value="pending" ${goal.status === 'pending' ? 'selected' : ''}>Pendente</option>
                <option value="in-progress" ${goal.status === 'in-progress' ? 'selected' : ''}>Em Andamento</option>
                <option value="achieved" ${goal.status === 'achieved' ? 'selected' : ''}>Alcançado</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-md">
            <i data-lucide="save"></i> Salvar Alterações
          </button>
        </form>
      `
    });
  }

  function handleEditGoal(e, goalId) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    const goals = patient.therapeuticGoals || [];
    const index = goals.findIndex(g => g.id === goalId);
    if (index === -1) return;

    goals[index] = {
      ...goals[index],
      description: data.get('description'),
      targetDate: data.get('targetDate') || null,
      status: data.get('status'),
      updatedAt: new Date().toISOString()
    };

    Store.update('patients', patientId, { therapeuticGoals: goals });
    Store.addAuditLog('Meta terapêutica editada', { patient: patient.name, details: goals[index].description });

    Modal.close();
    switchTab('plan');
    Notifications.show('Meta Atualizada', 'As alterações foram salvas com sucesso', 'success');
  }

  function deleteGoal(goalId) {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    if (!confirm('Deseja realmente excluir esta meta terapêutica?')) return;

    const goals = patient.therapeuticGoals || [];
    const goal = goals.find(g => g.id === goalId);
    const updatedGoals = goals.filter(g => g.id !== goalId);

    Store.update('patients', patientId, { therapeuticGoals: updatedGoals });
    Store.addAuditLog('Meta terapêutica excluída', { patient: patient.name, details: goal?.description || '' });

    switchTab('plan');
    Notifications.show('Meta Excluída', 'A meta foi removida com sucesso', 'warning');
  }

  function cycleGoalStatus(goalId) {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    const goals = patient.therapeuticGoals || [];
    const index = goals.findIndex(g => g.id === goalId);
    if (index === -1) return;

    const statusCycle = {
      'pending': 'in-progress',
      'in-progress': 'achieved',
      'achieved': 'pending'
    };

    const oldStatus = goals[index].status || 'pending';
    const newStatus = statusCycle[oldStatus];
    goals[index].status = newStatus;
    goals[index].updatedAt = new Date().toISOString();

    Store.update('patients', patientId, { therapeuticGoals: goals });
    
    const statusLabels = {
      'pending': 'Pendente',
      'in-progress': 'Em Andamento',
      'achieved': 'Alcançado'
    };

    Store.addAuditLog('Status da meta alterado', { 
      patient: patient.name, 
      details: `${goals[index].description} -> ${statusLabels[newStatus]}` 
    });

    switchTab('plan');
    Notifications.show('Status Atualizado', `Meta alterada para: ${statusLabels[newStatus]}`, 'info');
  }

  // --- Interventions Methods ---
  function showAddIntervention() {
    Modal.show({
      title: 'Adicionar Intervenção',
      content: `
        <form id="addInterventionForm" onsubmit="PatientDetailPage.handleAddIntervention(event)">
          <div class="form-group">
            <label class="form-label">Especialidade / Profissional *</label>
            <select class="form-input" name="professionalType" required>
              <option value="Fisioterapia">Fisioterapia</option>
              <option value="Fonoaudiologia">Fonoaudiologia</option>
              <option value="Enfermagem">Enfermagem</option>
              <option value="Nutrição">Nutrição</option>
              <option value="Psicologia">Psicologia</option>
              <option value="Terapia Ocupacional">Terapia Ocupacional</option>
              <option value="Medicina">Medicina</option>
              <option value="Outro">Outro / Assistente</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Frequência *</label>
            <input class="form-input" name="frequency" required placeholder="Ex: 3x por semana, Semanal, Diário">
          </div>
          <div class="form-group">
            <label class="form-label">Descrição / Detalhes da Conduta *</label>
            <textarea class="form-input" name="description" required placeholder="Descreva os exercícios, metas de treino ou rotina de conduta desta especialidade..." style="min-height:100px"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full">
            <i data-lucide="plus"></i> Adicionar Intervenção
          </button>
        </form>
      `
    });
  }

  function handleAddIntervention(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    const intervention = {
      id: Store.generateId(),
      professionalType: data.get('professionalType'),
      frequency: data.get('frequency'),
      description: data.get('description'),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const interventions = patient.therapeuticInterventions || [];
    interventions.push(intervention);
    Store.update('patients', patientId, { therapeuticInterventions: interventions });
    Store.addAuditLog('Intervenção adicionada', { patient: patient.name, details: `${intervention.professionalType} - ${intervention.frequency}` });

    Modal.close();
    switchTab('plan');
    Notifications.show('Intervenção Adicionada', 'A conduta foi cadastrada com sucesso', 'success');
  }

  function showEditIntervention(intId) {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;
    const interventions = patient.therapeuticInterventions || [];
    const intObj = interventions.find(i => i.id === intId);
    if (!intObj) return;

    Modal.show({
      title: 'Editar Intervenção',
      content: `
        <form id="editInterventionForm" onsubmit="PatientDetailPage.handleEditIntervention(event, '${intId}')">
          <div class="form-group">
            <label class="form-label">Especialidade / Profissional *</label>
            <select class="form-input" name="professionalType" required>
              <option value="Fisioterapia" ${intObj.professionalType === 'Fisioterapia' ? 'selected' : ''}>Fisioterapia</option>
              <option value="Fonoaudiologia" ${intObj.professionalType === 'Fonoaudiologia' ? 'selected' : ''}>Fonoaudiologia</option>
              <option value="Enfermagem" ${intObj.professionalType === 'Enfermagem' ? 'selected' : ''}>Enfermagem</option>
              <option value="Nutrição" ${intObj.professionalType === 'Nutrição' ? 'selected' : ''}>Nutrição</option>
              <option value="Psicologia" ${intObj.professionalType === 'Psicologia' ? 'selected' : ''}>Psicologia</option>
              <option value="Terapia Ocupacional" ${intObj.professionalType === 'Terapia Ocupacional' ? 'selected' : ''}>Terapia Ocupacional</option>
              <option value="Medicina" ${intObj.professionalType === 'Medicina' ? 'selected' : ''}>Medicina</option>
              <option value="Outro" ${intObj.professionalType === 'Outro' ? 'selected' : ''}>Outro / Assistente</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Frequência *</label>
            <input class="form-input" name="frequency" required value="${intObj.frequency}" placeholder="Ex: 3x por semana, Semanal, Diário">
          </div>
          <div class="form-group">
            <label class="form-label">Descrição / Detalhes da Conduta *</label>
            <textarea class="form-input" name="description" required placeholder="Descreva os exercícios, metas de treino ou rotina de conduta..." style="min-height:100px">${intObj.description}</textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full">
            <i data-lucide="save"></i> Salvar Alterações
          </button>
        </form>
      `
    });
  }

  function handleEditIntervention(e, intId) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    const interventions = patient.therapeuticInterventions || [];
    const index = interventions.findIndex(i => i.id === intId);
    if (index === -1) return;

    interventions[index] = {
      ...interventions[index],
      professionalType: data.get('professionalType'),
      frequency: data.get('frequency'),
      description: data.get('description'),
      updatedAt: new Date().toISOString()
    };

    Store.update('patients', patientId, { therapeuticInterventions: interventions });
    Store.addAuditLog('Intervenção editada', { patient: patient.name, details: `${interventions[index].professionalType} - ${interventions[index].frequency}` });

    Modal.close();
    switchTab('plan');
    Notifications.show('Intervenção Atualizada', 'As alterações foram salvas com sucesso', 'success');
  }

  function deleteIntervention(intId) {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    if (!confirm('Deseja realmente excluir esta intervenção terapêutica?')) return;

    const interventions = patient.therapeuticInterventions || [];
    const intObj = interventions.find(i => i.id === intId);
    const updatedInts = interventions.filter(i => i.id !== intId);

    Store.update('patients', patientId, { therapeuticInterventions: updatedInts });
    Store.addAuditLog('Intervenção excluída', { patient: patient.name, details: `${intObj?.professionalType} - ${intObj?.frequency}` });

    switchTab('plan');
    Notifications.show('Intervenção Excluída', 'A conduta foi removida com sucesso', 'warning');
  }

  function toggleInterventionStatus(intId) {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    const interventions = patient.therapeuticInterventions || [];
    const index = interventions.findIndex(i => i.id === intId);
    if (index === -1) return;

    const oldStatus = interventions[index].status || 'active';
    const newStatus = oldStatus === 'active' ? 'suspended' : 'active';
    interventions[index].status = newStatus;
    interventions[index].updatedAt = new Date().toISOString();

    Store.update('patients', patientId, { therapeuticInterventions: interventions });
    
    const actionText = newStatus === 'active' ? 'reativada' : 'suspensa';
    Store.addAuditLog(`Intervenção ${actionText}`, { 
      patient: patient.name, 
      details: `${interventions[index].professionalType} - ${interventions[index].frequency}` 
    });

    switchTab('plan');
    Notifications.show(
      newStatus === 'active' ? 'Conduta Ativa' : 'Conduta Suspensa', 
      `Intervenção de ${interventions[index].professionalType} foi ${actionText}.`, 
      newStatus === 'active' ? 'success' : 'warning'
    );
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
    suspendPrescription, reactivatePrescription,
    // Plano Terapêutico methods
    showEditPlanDescription, handleEditPlanDescription,
    showAddGoal, handleAddGoal, showEditGoal, handleEditGoal, deleteGoal, cycleGoalStatus,
    showAddIntervention, handleAddIntervention, showEditIntervention, handleEditIntervention, deleteIntervention, toggleInterventionStatus
  };
})();
