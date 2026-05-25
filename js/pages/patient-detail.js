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
          <button class="tab" onclick="PatientDetailPage.switchTab('nutrology')" data-tab="nutrology">
            <i data-lucide="droplet" style="width:16px;height:16px"></i> Nutrologia & BH
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
      case 'nutrology': return renderNutrology(patient);
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
            const typeLabels = { medical: 'Médica', nursing: 'Enfermagem', physio: 'Fisioterapia', psychology: 'Psicologia', nutrition: 'Nutrição' };
            return `
              <div class="timeline-item">
                <div class="timeline-dot ${typeColors[e.type] || ''}"></div>
                <div class="timeline-time">
                  <i data-lucide="clock" style="width:14px;height:14px;flex-shrink:0"></i>
                  ${formatDateTime(e.timestamp)}
                </div>
                <div class="timeline-title">
                  ${prof?.name || 'Profissional'}
                  <span class="badge badge-neutral" style="font-size:var(--font-size-sm);margin-left:var(--space-sm);vertical-align:middle">${typeLabels[e.type] || prof?.role || ''}</span>
                </div>
                <div class="timeline-desc">${e.text}</div>
              </div>`;
          }).join('') || '<div class="empty-state"><i data-lucide="file-text"></i><h3>Nenhuma evolução registrada</h3><p>Clique em "Nova Evolução" para adicionar o primeiro registro clínico.</p></div>'}
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

  // --- NUTROLOGIA & MEDICINA DO ESPORTE METHODS ---

  let pepTexts = {};

  function calculateBodyFat(gender, height, waist, neck, hip) {
    try {
      if (!height || !waist || !neck) return null;
      
      if (gender === 'M' || gender === 'Masculino') {
        const diff = waist - neck;
        if (diff <= 0) return null;
        const val = 1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(height);
        const bf = (495 / val) - 450;
        return isNaN(bf) || bf < 0 ? null : bf;
      } else {
        if (!hip) return null;
        const sumDiff = waist + hip - neck;
        if (sumDiff <= 0) return null;
        const val = 1.29579 - 0.35004 * Math.log10(sumDiff) + 0.22100 * Math.log10(height);
        const bf = (495 / val) - 450;
        return isNaN(bf) || bf < 0 ? null : bf;
      }
    } catch (e) {
      return null;
    }
  }

  function classifyBmi(bmi) {
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidade Grau I';
    if (bmi < 40) return 'Obesidade Grau II';
    return 'Obesidade Grau III';
  }

  function classifyBf(gender, bf) {
    if (bf === null || bf === undefined || isNaN(bf)) return 'Não Calculado';
    if (gender === 'M' || gender === 'Masculino') {
      if (bf < 6) return 'Gordura Essencial';
      if (bf < 14) return 'Atleta';
      if (bf < 18) return 'Aptidão Física (Fitness)';
      if (bf < 25) return 'Médio / Aceitável';
      return 'Risco de Obesidade';
    } else {
      if (bf < 14) return 'Gordura Essencial';
      if (bf < 21) return 'Atleta';
      if (bf < 25) return 'Aptidão Física (Fitness)';
      if (bf < 32) return 'Médio / Aceitável';
      return 'Risco de Obesidade';
    }
  }

  function classifyBalance(fluidBalance) {
    if (fluidBalance < -1000) return 'Balanço Negativo Crítico (Risco de Desidratação)';
    if (fluidBalance < 0) return 'Balanço Negativo Leve';
    if (fluidBalance === 0) return 'Neutro';
    if (fluidBalance <= 1500) return 'Balanço Positivo Leve';
    return 'Balanço Positivo Crítico (Risco de Retenção Hídrica)';
  }

  function classifyDu(du) {
    if (du < 0.3) return 'Anúria / Oligúria Grave';
    if (du < 0.5) return 'Oligúria';
    if (du <= 2.0) return 'Normal / Adequado';
    return 'Poliúria';
  }

  function bfText(bf) {
    if (bf === null || bf === undefined || isNaN(bf)) return 'N/I';
    return `${bf.toFixed(1)}%`;
  }

  function fluidRow(label, value) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04)">
        <span style="color:var(--text-secondary)">${label}</span>
        <span style="font-weight:500;color:var(--text-primary)">${value}</span>
      </div>
    `;
  }

  function switchPepSubtab(e, type) {
    document.querySelectorAll('.pep-subtab').forEach(btn => {
      btn.style.color = 'var(--text-secondary)';
      btn.style.borderBottomColor = 'transparent';
      btn.style.fontWeight = 'normal';
    });
    
    const btn = e.currentTarget;
    btn.style.color = 'var(--primary)';
    btn.style.borderBottomColor = 'var(--primary)';
    btn.style.fontWeight = '600';
    
    const term = document.getElementById('pepTerminalArea');
    if (term && pepTexts[type]) {
      term.textContent = pepTexts[type];
    }
  }

  function copyToClipboard(elementId) {
    const textElement = document.getElementById(elementId);
    if (!textElement) return;
    
    const text = textElement.innerText || textElement.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
      Notifications.show('Copiado', 'Resumo clínico copiado para o prontuário!', 'success');
    }).catch(err => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        Notifications.show('Copiado', 'Resumo clínico copiado para o prontuário!', 'success');
      } catch (e) {
        Notifications.show('Erro', 'Não foi possível copiar automaticamente.', 'danger');
      }
      document.body.removeChild(textArea);
    });
  }

  function toggleNutrologyMonitoring() {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;
    const isMonitoring = !patient.nutrologyMonitoring;
    Store.update('patients', patientId, { nutrologyMonitoring: isMonitoring });
    
    Store.addAuditLog(isMonitoring ? 'Acompanhamento nutrológico ativado' : 'Acompanhamento nutrológico desativado', {
      patient: patient.name
    });
    
    Notifications.show(
      isMonitoring ? 'Acompanhamento Ativado' : 'Acompanhamento Desativado',
      isMonitoring ? `Monitoramento especializado ativado para ${patient.name}` : `Monitoramento desativado para ${patient.name}`,
      isMonitoring ? 'success' : 'warning'
    );
    
    switchTab('nutrology');
  }

  function renderNutrology(patient) {
    const monitoringActive = !!patient.nutrologyMonitoring;
    
    let html = `
      <div class="page-enter animate-fade-in">
        <!-- Monitoring Status Header -->
        <div class="card-flat" style="margin-bottom:var(--space-lg);background:linear-gradient(135deg, rgba(10, 132, 255, 0.05), rgba(94, 92, 230, 0.05));border-color:rgba(10, 132, 255, 0.15);padding:var(--space-md) var(--space-lg)">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-md)">
            <div style="display:flex;align-items:center;gap:var(--space-md)">
              <div style="width:48px;height:48px;background:var(--primary-light);color:var(--primary);border-radius:var(--border-radius-lg);display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(10,132,255,0.15)">
                <i data-lucide="droplet" style="width:24px;height:24px;color:var(--primary)"></i>
              </div>
              <div>
                <h3 style="margin-bottom:2px;font-size:16px;font-weight:600">Acompanhamento Especializado</h3>
                <p style="color:var(--text-secondary);font-size:var(--font-size-sm)">Nutrologia, Antropometria Esportiva e Controle Rigoroso de Balanço Hídrico</p>
              </div>
            </div>
            <div>
              <button class="btn ${monitoringActive ? 'btn-ghost' : 'btn-primary'}" onclick="PatientDetailPage.toggleNutrologyMonitoring()" style="${monitoringActive ? 'color:var(--danger)' : ''}">
                <i data-lucide="${monitoringActive ? 'power-off' : 'zap'}"></i>
                <span>${monitoringActive ? 'Desativar Monitoramento' : 'Ativar Monitoramento'}</span>
              </button>
            </div>
          </div>
        </div>
    `;

    if (!monitoringActive) {
      html += `
        <div class="empty-state animate-fade-in" style="padding:var(--space-2xl) var(--space-xl);background:var(--bg-secondary);border:1px dashed var(--border-color);border-radius:var(--border-radius-lg);text-align:center;max-width:800px;margin:0 auto">
          <i data-lucide="scale" style="width:64px;height:64px;color:var(--text-tertiary);margin-bottom:var(--space-lg);opacity:0.8"></i>
          <h3 style="font-size:20px;font-weight:700;margin-bottom:var(--space-sm)">Avaliação Clínica & Balanço Hídrico Inteligente</h3>
          <p style="color:var(--text-secondary);max-width:600px;margin:0 auto var(--space-xl) auto;line-height:1.6">
            Ative este módulo especializado para automatizar a antropometria clínica, calcular o percentual de gordura (US Navy), superfície corporal (Mosteller), peso ideal (Devine) e monitorar o balanço hídrico rigoroso com alertas automáticos de disfunção renal e risco metabólico.
          </p>
          <div style="display:grid;grid-template-columns:1fr;gap:var(--space-md);max-width:550px;margin:0 auto var(--space-xl) auto;text-align:left">
            <div style="display:flex;align-items:start;gap:var(--space-sm)">
              <i data-lucide="calculator" style="color:var(--primary);width:16px;height:16px;margin-top:3px;flex-shrink:0"></i>
              <div>
                <strong style="color:var(--text-primary);font-size:14px">Antropometria Avançada e Fisiologia</strong>
                <span style="display:block;font-size:12px;color:var(--text-secondary);margin-top:2px">Cálculo de IMC, Superfície Corporal (SC), Peso Ideal e Gordura Corporal (%GC) via circunferências.</span>
              </div>
            </div>
            <div style="display:flex;align-items:start;gap:var(--space-sm)">
              <i data-lucide="activity" style="color:var(--secondary);width:16px;height:16px;margin-top:3px;flex-shrink:0"></i>
              <div>
                <strong style="color:var(--text-primary);font-size:14px">Balanço Rigoroso e Débito Urinário</strong>
                <span style="display:block;font-size:12px;color:var(--text-secondary);margin-top:2px">Lançamento de múltiplas entradas/saídas com determinação em tempo real do DU em mL/kg/h.</span>
              </div>
            </div>
            <div style="display:flex;align-items:start;gap:var(--space-sm)">
              <i data-lucide="file-spreadsheet" style="color:var(--warning);width:16px;height:16px;margin-top:3px;flex-shrink:0"></i>
              <div>
                <strong style="color:var(--text-primary);font-size:14px">Resumos Clínicos Padronizados (Tasy/MV/PEP)</strong>
                <span style="display:block;font-size:12px;color:var(--text-secondary);margin-top:2px">Geração automática de evoluções de enfermagem, evoluções médicas, condutas e prescrição de fluidos.</span>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" onclick="PatientDetailPage.toggleNutrologyMonitoring()">
            <i data-lucide="zap"></i> Ativar Acompanhamento
          </button>
        </div>
      </div>
      `;
      return html;
    }

    const evaluations = patient.nutrologyEvaluations || [];
    if (evaluations.length === 0) {
      html += `
        <div class="empty-state animate-fade-in" style="padding:var(--space-2xl) var(--space-xl);background:var(--bg-secondary);border:1px dashed var(--border-color);border-radius:var(--border-radius-lg);text-align:center">
          <i data-lucide="clipboard-list" style="width:48px;height:48px;color:var(--text-tertiary);margin-bottom:var(--space-md)"></i>
          <h3>Acompanhamento Ativo!</h3>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-lg)">Ainda não há nenhuma avaliação clínica ou controle hídrico lançado para este paciente.</p>
          <button class="btn btn-primary" onclick="PatientDetailPage.showAddNutrologyEvaluation()">
            <i data-lucide="plus"></i> Registrar Primeira Avaliação
          </button>
        </div>
      </div>
      `;
      return html;
    }

    // Get latest evaluation
    const latest = evaluations[evaluations.length - 1];
    const weight = parseFloat(latest.weight);
    const height = parseFloat(latest.height);
    const waist = parseFloat(latest.waist);
    const neck = parseFloat(latest.neck);
    const hip = parseFloat(latest.hip || 0);
    const age = parseInt(latest.age || patient.age || 0);
    const gender = latest.gender || patient.gender || 'M';
    const bed = latest.bed || patient.bed || '-';

    const bmi = latest.bmi;
    const idealWeight = latest.idealWeight;
    const sc = latest.bodySurface;
    const bf = latest.bodyFat;
    const waterReq = latest.waterRequirement;
    const du = latest.urineOutput;
    const fluidBalance = latest.fluidBalance;
    const hours = latest.hours;

    // Calculate intakes & outputs
    const totalIntake = (latest.intakeVo || 0) + (latest.intakeEv || 0) + (latest.intakeEnteral || 0) + (latest.intakeMedications || 0) + (latest.intakeBlood || 0) + (latest.intakeOthers || 0);
    const totalOutput = (latest.outputDiuresis || 0) + (latest.outputVomiting || 0) + (latest.outputDrains || 0) + (latest.outputStool || 0) + (latest.outputAspiration || 0) + (latest.outputHemorrhage || 0) + (latest.outputOthers || 0);

    // Dynamic alert generation
    const activeAlerts = [];
    if (gender === 'M' && waist > 102) {
      activeAlerts.push({
        type: 'critical',
        title: '⚠️ Risco Metabólico Cardiovascular',
        desc: `Circunferência abdominal de ${waist} cm está acima do limiar clínico para homens (102 cm), apontando alto acúmulo visceral.`
      });
    } else if (gender === 'F' && waist > 88) {
      activeAlerts.push({
        type: 'critical',
        title: '⚠️ Risco Metabólico Cardiovascular',
        desc: `Circunferência abdominal de ${waist} cm está acima do limiar clínico para mulheres (88 cm), apontando alto acúmulo visceral.`
      });
    }

    if (du < 0.5) {
      const type = du < 0.3 ? 'critical' : 'warning';
      activeAlerts.push({
        type: type,
        title: du < 0.3 ? '🚨 Insuficiência Renal Aguda / Anúria' : '⚠️ Oligúria Clínico / Alerta Renal',
        desc: `Débito urinário muito baixo: ${du.toFixed(2)} mL/kg/h (esperado: > 0.5 mL/kg/h). Possível hipovolemia ou falência renal.`
      });
    }

    if (fluidBalance < -1000) {
      activeAlerts.push({
        type: 'warning',
        title: '💧 Risco de Desidratação Crítica',
        desc: `Balanço hídrico acumulado em ${fluidBalance} mL. Necessário reposição de perdas ou aumento da taxa de infusão EV.`
      });
    } else if (fluidBalance > 1500) {
      activeAlerts.push({
        type: 'warning',
        title: '🌊 Risco de Retenção Hídrica / Congestão',
        desc: `Balanço hídrico acumulado positivo em ${fluidBalance} mL. Cuidado com risco de edema ou sobrecarga volêmica.`
      });
    }

    // Build PEP textual data
    const timestampStr = formatDateTime(latest.timestamp);
    const bmiClass = classifyBmi(bmi);
    const bfClass = classifyBf(gender, bf);
    const balanceClass = classifyBalance(fluidBalance);
    const duClass = classifyDu(du);
    const metabolicRiskStr = (gender === 'M' ? waist > 102 : waist > 88) ? 'ELEVADO / RISCO VISCERAL' : 'BAIXO';

    const proteinPerKg = 1.2;
    const proteinNeed = (weight * proteinPerKg).toFixed(1);
    const calorieNeed = Math.round(weight * 25);
    const velInfusion = (waterReq / 24).toFixed(1);
    const dropsMin = Math.round(waterReq / (24 * 3));

    // PEP: Tabela Organizada
    const tablePep = `============================================================
AVALIAÇÃO ANTROPOMÉTRICA & CONTROLE HÍDRICO HOSPITALAR
============================================================
Paciente: ${patient.name}
Idade: ${age} anos | Sexo: ${gender === 'M' ? 'Masculino' : 'Feminino'} | Leito: ${bed}
Diagnóstico: ${patient.diagnosis}
CID: ${patient.diagnosisCode || '-'} | Data/Hora: ${timestampStr}
------------------------------------------------------------
1. PARÂMETROS FISIOLÓGICOS E ANTROPOMÉTRICOS:
- Peso Atual: ${weight.toFixed(1)} kg | Peso Ideal: ${idealWeight.toFixed(1)} kg
- Altura: ${height.toFixed(0)} cm | Superfície Corporal: ${sc.toFixed(2)} m²
- IMC calculado: ${bmi.toFixed(2)} kg/m² (${bmiClass})
- Circunferência Abdominal: ${waist.toFixed(1)} cm
- Circunferência Cervical: ${neck.toFixed(1)} cm
- Circunferência Quadril: ${gender === 'F' ? `${hip.toFixed(1)} cm` : '-'}
- Percentual de Gordura Corporal: ${bfText(bf)} (${bfClass})
- Risco Metabólico / Visceral: ${metabolicRiskStr}
------------------------------------------------------------
2. MONITORAMENTO DOS SINAIS VITAIS:
- Pressão Arterial: ${latest.systolic || '-'}/${latest.diastolic || '-'} mmHg
- Frequência Cardíaca: ${latest.heartRate || '-'} bpm
- Temperatura Corporal: ${latest.temperature ? `${latest.temperature} °C` : '-'}
- Saturação O2 (SpO2): ${latest.spo2 || '-'}%
- Glicemia Capilar: ${latest.glucose ? `${latest.glucose} mg/dL` : '-'}
------------------------------------------------------------
3. BALANÇO DE FLUIDOS DETALHADO (${hours} HORAS):
Entradas Consolidadas:
  - Via Oral (VO): ${latest.intakeVo} mL
  - Via Endovenosa (EV): ${latest.intakeEv} mL
  - Dieta enteral/parenteral: ${latest.intakeEnteral} mL
  - Medicações infundidas: ${latest.intakeMedications} mL
  - Hemoderivados: ${latest.intakeBlood} mL
  - Outros fluidos: ${latest.intakeOthers} mL
  TOTAL ENTRADAS: ${totalIntake} mL
Saídas Consolidadas:
  - Diurese (Urina): ${latest.outputDiuresis} mL
  - Vômitos: ${latest.outputVomiting} mL
  - Drenos cirúrgicos: ${latest.outputDrains} mL
  - Fezes líquidas/conteúdo: ${latest.outputStool} mL
  - Aspiração gástrica/traqueal: ${latest.outputAspiration} mL
  - Perdas hemorrágicas: ${latest.outputHemorrhage} mL
  - Outras perdas: ${latest.outputOthers} mL
  TOTAL SAÍDAS: ${totalOutput} mL

BALANÇO HÍDRICO ACUMULADO: ${fluidBalance > 0 ? `+${fluidBalance}` : fluidBalance} mL (${balanceClass})
DÉBITO URINÁRIO MÉDIO: ${du.toFixed(2)} mL/kg/h (${duClass})
------------------------------------------------------------
4. ALERTAS ASSISTENCIAIS ATIVOS:
${activeAlerts.length > 0 ? activeAlerts.map(a => `- [ALERTA] ${a.title}: ${a.desc}`).join('\n') : '- Sem alertas assistenciais no momento.'}
============================================================`;

    // PEP: Evolução Médica
    const evolutionMedical = `Evolução Médica (Nutrologia e Medicina do Esporte) - ${timestampStr}:
Paciente sob acompanhamento metabólico e nutrológico no leito ${bed}. Diagnóstico de base: ${patient.diagnosis}.
Do ponto de vista antropométrico, apresenta IMC de ${bmi.toFixed(2)} kg/m² (${bmiClass}), peso ideal estimado em ${idealWeight.toFixed(1)} kg, superfície corporal de ${sc.toFixed(2)} m² e percentual de gordura corporal aferido em ${bfText(bf)} (${bfClass}). Circunferência abdominal de ${waist.toFixed(1)} cm denota risco metabólico/cardiovascular classificado como ${metabolicRiskStr}.
Aferido controle de balanço hídrico de ${hours} horas, evidenciando aporte hídrico de ${totalIntake} mL e perdas totais de ${totalOutput} mL, consolidando balanço de ${fluidBalance > 0 ? `+${fluidBalance}` : fluidBalance} mL (${balanceClass}). O débito urinário médio no período manteve-se em ${du.toFixed(2)} mL/kg/h (${duClass}). 
Paciente hemodinamicamente estável (PA: ${latest.systolic || '-'}/${latest.diastolic || '-'} mmHg, FC: ${latest.heartRate || '-'} bpm), eupneico (SpO2: ${latest.spo2 || '-'}%), afebril (Temp: ${latest.temperature ? `${latest.temperature} °C` : '-'}) e glicemia capilar de ${latest.glucose ? `${latest.glucose} mg/dL` : '-'}.
Conduta médica esportiva e nutrológica traçadas, priorizando equilíbrio hidroeletrolítico e preservação de massa magra.`;

    // PEP: Evolução Enfermagem
    const evolutionNursing = `Evolução de Enfermagem (Balanço de Fluidos e Monitoramento) - ${timestampStr}:
Realizado acompanhamento de enfermagem e controle hídrico rigoroso no leito ${bed} nas últimas ${hours} horas.
Registrado volume total de entradas de ${totalIntake} mL, sendo composto por via oral (${latest.intakeVo} mL), infusão endovenosa (${latest.intakeEv} mL), dieta enteral/parenteral (${latest.intakeEnteral} mL) e medicações. Nas saídas, contabilizado perda total de ${totalOutput} mL, consistindo em diurese de ${latest.outputDiuresis} mL, drenos, fezes líquidas e demais perdas mensuráveis. 
Balanço hídrico final encerra em ${fluidBalance > 0 ? `+${fluidBalance}` : fluidBalance} mL (${balanceClass}). Débito urinário médio mantido em ${du.toFixed(2)} mL/kg/h. 
Sinais vitais checados e registrados. Acesso venoso pérvio, sem sinais flogísticos ou infiltração de fluidos. Dieta enteral/via oral bem tolerada, sem episódios relatados de refluxo ou vômitos no período. Paciente segue sob vigilância clínica e cuidados gerais de enfermagem contínuos.`;

    // PEP: Conduta Sugerida
    const suggestedConduct = `Conduta Nutrológica e Medicina do Esporte Recomendada - ${timestampStr}:
1. Meta calórica estimada em ${calorieNeed} kcal/dia (regra de bolso de 25 kcal/kg/dia).
2. Ajustar aporte proteico para ${proteinNeed} g/dia (estimado em ${proteinPerKg} g/kg/dia) com o objetivo de preservação da massa livre de gordura e otimização metabólica assistida.
3. Monitorar eletrólitos séricos (Sódio, Potássio e Magnésio) a cada 24/48 horas devido ao quadro atual de ${balanceClass}.
4. Conforme tolerância gastrointestinal, evoluir terapia nutricional ou fracionamento dietético.
5. Em conjunto com a equipe de reabilitação e se as condições hemodinâmicas permitirem, prescrever protocolo de exercícios ativos para ganho ou preservação de massa muscular.`;

    // PEP: Prescrição Hídrica
    const hydrationPrescription = `Prescrição Hídrica e Fluido Recomendações - ${timestampStr}:
1. Necessidade Hídrica Basal Estimada: ${waterReq} mL em 24 horas (baseado em 35 mL/kg/dia).
2. Plano de Infusão de Fluidos de Manutenção Recomendado:
   - Volume Total nas 24h: ${waterReq} mL.
   - Taxa de Infusão Contínua: ${velInfusion} mL/hora (ou aproximadamente ${dropsMin} gotas por minuto).
3. Sugestão de Composição das Soluções de Manutenção:
   - Soro Fisiológico (SF 0,9%): ${(waterReq * 0.5).toFixed(0)} mL EV nas 24h (para manutenção hidroeletrolítica).
   - Soro Glicosado (SG 5%): ${(waterReq * 0.5).toFixed(0)} mL EV nas 24h (para aporte basal de carboidratos).
4. Em caso de alertas renais (débito urinário < 0.5 mL/kg/h), considerar restrição volêmica associada ou intervenção diurética conforme indicação.`;

    // Save texts in closure
    pepTexts = {
      all: `${tablePep}\n\n${evolutionMedical}\n\n${evolutionNursing}\n\n${suggestedConduct}\n\n${hydrationPrescription}`,
      med: evolutionMedical,
      enf: evolutionNursing,
      cond: suggestedConduct,
      pres: hydrationPrescription
    };

    // Card Colors & Classes
    const bmiColor = bmi < 18.5 ? 'warning' : bmi < 25 ? 'success' : bmi < 30 ? 'warning' : 'danger';
    const bfColor = (bf !== null && bf >= 25 && gender === 'M') || (bf !== null && bf >= 32 && gender === 'F') ? 'danger' : 'success';
    const balanceColor = Math.abs(fluidBalance) > 1500 ? 'critical' : Math.abs(fluidBalance) > 1000 ? 'warning' : '';
    const duColor = du < 0.3 ? 'critical' : du < 0.5 ? 'warning' : '';

    html += `
        <!-- Evaluation Dashboard Grid -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-md)">
          <div>
            <h3 style="font-size:16px;font-weight:700">Última Avaliação Clínica</h3>
            <span style="font-size:11px;color:var(--text-tertiary)">Realizada em ${timestampStr} | Leito: ${bed}</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="PatientDetailPage.showAddNutrologyEvaluation()">
            <i data-lucide="plus"></i> Nova Avaliação
          </button>
        </div>

        <div class="grid-3 animate-fade-in-up">
          <!-- IMC Card -->
          <div class="vital-card ${bmiColor === 'danger' ? 'critical' : bmiColor === 'warning' ? 'warning' : ''}">
            <div class="vital-icon" style="color:var(--primary)"><i data-lucide="calculator"></i></div>
            <div class="vital-value">${bmi.toFixed(2)}</div>
            <div class="vital-label">Índice de Massa Corporal (IMC)</div>
            <span class="badge badge-${bmiColor}" style="margin-top:6px;display:inline-block">${bmiClass}</span>
          </div>

          <!-- Peso Ideal Card -->
          <div class="vital-card">
            <div class="vital-icon" style="color:var(--secondary)"><i data-lucide="scale"></i></div>
            <div class="vital-value">${idealWeight.toFixed(1)} <span style="font-size:12px;color:var(--text-secondary)">kg</span></div>
            <div class="vital-label">Peso Ideal (Fórmula Devine)</div>
            <span class="badge badge-neutral" style="margin-top:6px;display:inline-block">Atual: ${weight.toFixed(1)} kg</span>
          </div>

          <!-- Superfície Corporal Card -->
          <div class="vital-card">
            <div class="vital-icon" style="color:var(--info)"><i data-lucide="maximize"></i></div>
            <div class="vital-value">${sc.toFixed(2)} <span style="font-size:12px;color:var(--text-secondary)">m²</span></div>
            <div class="vital-label">Superfície Corporal (Mosteller)</div>
            <span class="badge badge-neutral" style="margin-top:6px;display:inline-block">Parâmetro de dose</span>
          </div>

          <!-- Percentual Gordura Card -->
          <div class="vital-card ${bfColor === 'danger' ? 'warning' : ''}">
            <div class="vital-icon" style="color:var(--accent)"><i data-lucide="dumbbell"></i></div>
            <div class="vital-value">${bfText(bf)}</div>
            <div class="vital-label">% de Gordura (M. Marinha)</div>
            <span class="badge badge-${bfColor === 'danger' ? 'warning' : 'success'}" style="margin-top:6px;display:inline-block">${bfClass}</span>
          </div>

          <!-- Necessidade Hídrica Card -->
          <div class="vital-card">
            <div class="vital-icon" style="color:var(--primary)"><i data-lucide="droplet"></i></div>
            <div class="vital-value">${waterReq} <span style="font-size:12px;color:var(--text-secondary)">mL</span></div>
            <div class="vital-label">Necessidade Hídrica / Dia</div>
            <span class="badge badge-info" style="margin-top:6px;display:inline-block">35 mL/kg</span>
          </div>

          <!-- Balanço Hídrico & DU Card -->
          <div class="vital-card ${balanceColor || duColor ? 'critical' : ''}">
            <div class="vital-icon" style="color:var(--warning)"><i data-lucide="activity"></i></div>
            <div class="vital-value" style="font-size:16px;line-height:1.2;margin-top:4px">
              BH: ${fluidBalance > 0 ? `+${fluidBalance}` : fluidBalance} mL<br>
              <span style="font-size:12px;color:var(--text-secondary)">DU: ${du.toFixed(2)} mL/kg/h</span>
            </div>
            <div class="vital-label" style="margin-top:4px">Balanço & Débito Urinário</div>
            <span class="badge badge-${du < 0.5 ? 'danger' : 'success'}" style="margin-top:4px;display:inline-block">${duClass}</span>
          </div>
        </div>

        <!-- Alertas Section -->
        ${activeAlerts.length > 0 ? `
          <div class="section mt-lg animate-fade-in-up">
            <h3 class="section-title" style="color:var(--danger)">⚠️ Alertas Clínicos Críticos</h3>
            <div style="display:flex;flex-direction:column;gap:var(--space-sm);margin-top:var(--space-sm)">
              ${activeAlerts.map(alert => `
                <div class="alert-card ${alert.type === 'critical' ? 'critical' : 'warning'}" style="display:flex;gap:var(--space-md);padding:var(--space-md);border-radius:var(--border-radius);border:1px solid;background:${alert.type === 'critical' ? 'var(--danger-light)' : 'var(--warning-light)'};border-color:${alert.type === 'critical' ? 'rgba(255, 69, 58, 0.3)' : 'rgba(255, 159, 10, 0.3)'}">
                  <span class="alert-pulse" style="width:12px;height:12px;border-radius:50%;background:${alert.type === 'critical' ? 'var(--danger)' : 'var(--warning)'};margin-top:4px;animation:pulse 1.5s infinite"></span>
                  <div style="flex:1">
                    <h4 style="font-weight:600;font-size:14px;margin-bottom:3px;color:var(--text-primary)">${alert.title}</h4>
                    <p style="font-size:12px;color:var(--text-secondary);line-height:1.4">${alert.desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Balanço Detalhado Column Dashboard -->
        <div class="grid-2 mt-lg animate-fade-in-up">
          <!-- Entradas -->
          <div class="card-flat" style="border-left: 4px solid var(--secondary)">
            <h4 style="font-size:14px;font-weight:600;margin-bottom:var(--space-md);color:var(--secondary);display:flex;align-items:center;gap:6px">
              <i data-lucide="plus-circle" style="width:16px;height:16px"></i> Entradas Hidroeletrolíticas (${hours}h)
            </h4>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${fluidRow('Via Oral (VO / Água)', `${latest.intakeVo || 0} mL`)}
              ${fluidRow('Endovenosa (EV)', `${latest.intakeEv || 0} mL`)}
              ${fluidRow('Dieta enteral/parenteral', `${latest.intakeEnteral || 0} mL`)}
              ${fluidRow('Medicações infundidas', `${latest.intakeMedications || 0} mL`)}
              ${fluidRow('Hemoderivados', `${latest.intakeBlood || 0} mL`)}
              ${fluidRow('Outros aportes', `${latest.intakeOthers || 0} mL`)}
              <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) 0;border-top:1px solid var(--border-color);margin-top:8px;font-weight:600;color:var(--text-primary)">
                <span>Total Entradas (Fluidos)</span>
                <span style="color:var(--secondary)">${totalIntake} mL</span>
              </div>
            </div>
          </div>

          <!-- Saídas -->
          <div class="card-flat" style="border-left: 4px solid var(--danger)">
            <h4 style="font-size:14px;font-weight:600;margin-bottom:var(--space-md);color:var(--danger);display:flex;align-items:center;gap:6px">
              <i data-lucide="minus-circle" style="width:16px;height:16px"></i> Perdas e Saídas Hídricas (${hours}h)
            </h4>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${fluidRow('Diurese (Volume Urinário)', `${latest.outputDiuresis || 0} mL`)}
              ${fluidRow('Vômitos / Êmeses', `${latest.outputVomiting || 0} mL`)}
              ${fluidRow('Drenos / Secreções', `${latest.outputDrains || 0} mL`)}
              ${fluidRow('Fezes líquidas / Diarreia', `${latest.outputStool || 0} mL`)}
              ${fluidRow('Aspiração gástrica/vias', `${latest.outputAspiration || 0} mL`)}
              ${fluidRow('Hemorragias', `${latest.outputHemorrhage || 0} mL`)}
              ${fluidRow('Outras saídas / Perdas', `${latest.outputOthers || 0} mL`)}
              <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) 0;border-top:1px solid var(--border-color);margin-top:8px;font-weight:600;color:var(--text-primary)">
                <span>Total Saídas (Perdas)</span>
                <span style="color:var(--danger)">${totalOutput} mL</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tasy/MV/PEP Terminal Box -->
        <div class="card-flat mt-lg animate-fade-in-up" style="padding:0;overflow:hidden;border:1px solid var(--border-color)">
          <div style="background:var(--bg-tertiary);border-bottom:1px solid var(--border-color);padding:var(--space-md) var(--space-lg);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-md)">
            <div style="display:flex;align-items:center;gap:8px">
              <i data-lucide="file-spreadsheet" style="color:var(--primary);width:18px;height:18px"></i>
              <h4 style="font-size:14px;font-weight:600;color:var(--text-primary)">Integração Prontuário Hospitalar (Tasy / MV / PEP)</h4>
            </div>
            <button class="btn btn-primary btn-sm" onclick="PatientDetailPage.copyToClipboard('pepTerminalArea')">
              <i data-lucide="copy" style="width:14px;height:14px;margin-right:6px"></i> Copiar Texto Ativo
            </button>
          </div>
          
          <div style="display:flex;background:var(--bg-secondary);border-bottom:1px solid var(--border-color);overflow-x:auto;scrollbar-width:none">
            <button class="pep-subtab" onclick="PatientDetailPage.switchPepSubtab(event, 'all')" style="padding:12px 16px;background:transparent;border:none;color:var(--primary);font-weight:600;font-size:12px;cursor:pointer;border-bottom:2px solid var(--primary)">Tudo Consolidado</button>
            <button class="pep-subtab" onclick="PatientDetailPage.switchPepSubtab(event, 'med')" style="padding:12px 16px;background:transparent;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;border-bottom:2px solid transparent">Evolução Médica</button>
            <button class="pep-subtab" onclick="PatientDetailPage.switchPepSubtab(event, 'enf')" style="padding:12px 16px;background:transparent;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;border-bottom:2px solid transparent">Evolução Enfermagem</button>
            <button class="pep-subtab" onclick="PatientDetailPage.switchPepSubtab(event, 'cond')" style="padding:12px 16px;background:transparent;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;border-bottom:2px solid transparent">Conduta Nutrológica</button>
            <button class="pep-subtab" onclick="PatientDetailPage.switchPepSubtab(event, 'pres')" style="padding:12px 16px;background:transparent;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;border-bottom:2px solid transparent">Prescrição Hídrica</button>
          </div>
          
          <pre id="pepTerminalArea" style="background:#090d13;color:#e6edf3;font-family:var(--font-mono);font-size:12px;padding:var(--space-lg);max-height:400px;overflow-y:auto;line-height:1.5;white-space:pre-wrap;word-break:break-all;margin:0">${tablePep}</pre>
        </div>

        <!-- Evaluation History Timeline -->
        <div class="section mt-xl animate-fade-in-up">
          <h3 class="section-title">Histórico de Avaliações Clínicas</h3>
          <div class="card-flat mt-sm" style="padding:0;overflow:hidden">
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">
                <thead>
                  <tr style="background:var(--bg-tertiary);border-bottom:1px solid var(--border-color);color:var(--text-secondary)">
                    <th style="padding:12px var(--space-md)">Data/Hora</th>
                    <th style="padding:12px var(--space-md)">Peso</th>
                    <th style="padding:12px var(--space-md)">IMC (Calculado)</th>
                    <th style="padding:12px var(--space-md)">Gordura %</th>
                    <th style="padding:12px var(--space-md)">Balanço Hídrico</th>
                    <th style="padding:12px var(--space-md)">Débito Urinário</th>
                    <th style="padding:12px var(--space-md);text-align:right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${evaluations.slice().reverse().map(ev => `
                    <tr style="border-bottom:1px solid var(--border-color)">
                      <td style="padding:12px var(--space-md);font-weight:500;white-space:nowrap">${formatDateTime(ev.timestamp)}</td>
                      <td style="padding:12px var(--space-md)">${parseFloat(ev.weight).toFixed(1)} kg</td>
                      <td style="padding:12px var(--space-md)">${parseFloat(ev.bmi).toFixed(2)} <span style="font-size:10px;color:var(--text-tertiary)">(${classifyBmi(ev.bmi)})</span></td>
                      <td style="padding:12px var(--space-md)">${bfText(ev.bodyFat)}</td>
                      <td style="padding:12px var(--space-md);color:${ev.fluidBalance < -1000 ? 'var(--danger)' : ev.fluidBalance > 1500 ? 'var(--warning)' : 'var(--text-primary)'}">
                        ${ev.fluidBalance > 0 ? `+${ev.fluidBalance}` : ev.fluidBalance} mL
                      </td>
                      <td style="padding:12px var(--space-md);color:${ev.urineOutput < 0.5 ? 'var(--danger)' : 'var(--text-primary)'}">
                        ${parseFloat(ev.urineOutput).toFixed(2)} mL/kg/h <span style="font-size:10px;color:var(--text-tertiary)">(${classifyDu(ev.urineOutput)})</span>
                      </td>
                      <td style="padding:12px var(--space-md);text-align:right">
                        <button class="btn btn-ghost btn-sm text-danger" onclick="PatientDetailPage.deleteNutrologyEvaluation('${ev.id}')" style="min-height:28px;min-width:28px;padding:2px;color:var(--danger)" title="Excluir Registro">
                          <i data-lucide="trash-2" style="width:14px;height:14px;color:var(--danger)"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    return html;
  }

  function showAddNutrologyEvaluation() {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    const evals = patient.nutrologyEvaluations || [];
    const latest = evals[evals.length - 1] || {};

    Modal.show({
      title: 'Registrar Avaliação Especializada & Balanço',
      size: 'large',
      content: `
        <form id="addNutrologyForm" onsubmit="PatientDetailPage.handleAddNutrologyEvaluation(event)">
          <div style="font-size:13px;font-weight:600;color:var(--primary);margin-bottom:12px;border-bottom:1px solid var(--border-color);padding-bottom:6px">
            1. DADOS DE INTERNAÇÃO E CADASTRO
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Leito / Quarto</label>
              <input class="form-input" name="bed" value="${patient.bed || latest.bed || ''}" placeholder="Ex: Leito 102-A">
            </div>
            <div class="form-group">
              <label class="form-label">Idade *</label>
              <input class="form-input" name="age" type="number" required value="${patient.age || latest.age || ''}" placeholder="Anos">
            </div>
            <div class="form-group">
              <label class="form-label">Sexo *</label>
              <select class="form-input" name="gender" required>
                <option value="M" ${patient.gender === 'M' ? 'selected' : ''}>Masculino</option>
                <option value="F" ${patient.gender === 'F' ? 'selected' : ''}>Feminino</option>
              </select>
            </div>
          </div>

          <div style="font-size:13px;font-weight:600;color:var(--primary);margin-bottom:12px;border-bottom:1px solid var(--border-color);padding-bottom:6px;margin-top:12px">
            2. ANTROPOMETRIA CLÍNICA E CIRCUFERÊNCIAS (cm)
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Peso Corporal Atual (kg) *</label>
              <input class="form-input" name="weight" type="number" step="0.1" required value="${latest.weight || ''}" placeholder="Ex: 75.5">
            </div>
            <div class="form-group">
              <label class="form-label">Altura do Paciente (cm) *</label>
              <input class="form-input" name="height" type="number" required value="${latest.height || ''}" placeholder="Ex: 175">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Circunferência Abdominal *</label>
              <input class="form-input" name="waist" type="number" step="0.1" required value="${latest.waist || ''}" placeholder="Ex: 92.0">
            </div>
            <div class="form-group">
              <label class="form-label">Circunferência Cervical *</label>
              <input class="form-input" name="neck" type="number" step="0.1" required value="${latest.neck || ''}" placeholder="Ex: 38.0">
            </div>
            <div class="form-group">
              <label class="form-label">Circunferência Quadril (Obrigatória se Feminino)</label>
              <input class="form-input" name="hip" type="number" step="0.1" value="${latest.hip || ''}" placeholder="Ex: 102.0">
            </div>
          </div>

          <div style="font-size:13px;font-weight:600;color:var(--primary);margin-bottom:12px;border-bottom:1px solid var(--border-color);padding-bottom:6px;margin-top:12px">
            3. SINAIS VITAIS & GLICEMIA CAPILAR (Opcional)
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">PA Sistólica (mmHg)</label>
              <input class="form-input" name="systolic" type="number" value="${latest.systolic || ''}" placeholder="120">
            </div>
            <div class="form-group">
              <label class="form-label">PA Diastólica (mmHg)</label>
              <input class="form-input" name="diastolic" type="number" value="${latest.diastolic || ''}" placeholder="80">
            </div>
            <div class="form-group">
              <label class="form-label">FC (bpm)</label>
              <input class="form-input" name="heartRate" type="number" value="${latest.heartRate || ''}" placeholder="75">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Temperatura (°C)</label>
              <input class="form-input" name="temperature" type="number" step="0.1" value="${latest.temperature || ''}" placeholder="36.5">
            </div>
            <div class="form-group">
              <label class="form-label">Saturação SpO2 (%)</label>
              <input class="form-input" name="spo2" type="number" value="${latest.spo2 || ''}" placeholder="98">
            </div>
            <div class="form-group">
              <label class="form-label">Glicemia (mg/dL)</label>
              <input class="form-input" name="glucose" type="number" value="${latest.glucose || ''}" placeholder="99">
            </div>
          </div>

          <div style="font-size:13px;font-weight:600;color:var(--primary);margin-bottom:12px;border-bottom:1px solid var(--border-color);padding-bottom:6px;margin-top:12px">
            4. ENTRADAS HÍDRICAS (mL)
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Via Oral (VO / Água)</label>
              <input class="form-input" name="intakeVo" type="number" value="${latest.intakeVo || '0'}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Aporte Endovenoso (EV)</label>
              <input class="form-input" name="intakeEv" type="number" value="${latest.intakeEv || '0'}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Dieta Enteral/Parenteral</label>
              <input class="form-input" name="intakeEnteral" type="number" value="${latest.intakeEnteral || '0'}" placeholder="0">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Medicações Diluídas</label>
              <input class="form-input" name="intakeMedications" type="number" value="${latest.intakeMedications || '0'}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Hemoderivados</label>
              <input class="form-input" name="intakeBlood" type="number" value="${latest.intakeBlood || '0'}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Outras Entradas</label>
              <input class="form-input" name="intakeOthers" type="number" value="${latest.intakeOthers || '0'}" placeholder="0">
            </div>
          </div>

          <div style="font-size:13px;font-weight:600;color:var(--primary);margin-bottom:12px;border-bottom:1px solid var(--border-color);padding-bottom:6px;margin-top:12px">
            5. SAÍDAS E PERDAS HÍDRICAS (mL)
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Diurese (Volume Urinário)</label>
              <input class="form-input" name="outputDiuresis" type="number" value="${latest.outputDiuresis || '0'}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Vômitos / Êmeses</label>
              <input class="form-input" name="outputVomiting" type="number" value="${latest.outputVomiting || '0'}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Drenos (Cirúrgicos/Vias)</label>
              <input class="form-input" name="outputDrains" type="number" value="${latest.outputDrains || '0'}" placeholder="0">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fezes Líquidas / Diarreia</label>
              <input class="form-input" name="outputStool" type="number" value="${latest.outputStool || '0'}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Aspiração Gástrica</label>
              <input class="form-input" name="outputAspiration" type="number" value="${latest.outputAspiration || '0'}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Hemorragias</label>
              <input class="form-input" name="outputHemorrhage" type="number" value="${latest.outputHemorrhage || '0'}" placeholder="0">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Outras Perdas</label>
              <input class="form-input" name="outputOthers" type="number" value="${latest.outputOthers || '0'}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Período de Acúmulo (Horas) *</label>
              <input class="form-input" name="hours" type="number" required value="${latest.hours || '24'}" placeholder="24" min="1" max="48">
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-full mt-md">
            <i data-lucide="calculator"></i> Calcular Fisiologia & Salvar
          </button>
        </form>
      `
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function handleAddNutrologyEvaluation(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', patientId);
    if (!patient) return;

    const weight = parseFloat(data.get('weight'));
    const height = parseFloat(data.get('height'));
    const waist = parseFloat(data.get('waist'));
    const neck = parseFloat(data.get('neck'));
    const hip = data.get('hip') ? parseFloat(data.get('hip')) : null;
    const gender = data.get('gender');
    const age = parseInt(data.get('age'));
    const bed = data.get('bed') || '';

    // Calculations
    const bmi = weight / ((height / 100) ** 2);
    
    // Ideal weight
    const heightInInches = height / 2.54;
    const baseIdeal = (gender === 'F') ? 45.5 : 50.0;
    let idealWeight = baseIdeal + 2.3 * (heightInInches - 60);
    if (idealWeight < 0 || isNaN(idealWeight)) idealWeight = baseIdeal;

    // Body surface area Mosteller
    const bodySurface = Math.sqrt((height * weight) / 3600);

    // Body fat US Navy
    const bodyFat = calculateBodyFat(gender, height, waist, neck, hip);

    // Intakes
    const intakeVo = parseFloat(data.get('intakeVo') || 0);
    const intakeEv = parseFloat(data.get('intakeEv') || 0);
    const intakeEnteral = parseFloat(data.get('intakeEnteral') || 0);
    const intakeMedications = parseFloat(data.get('intakeMedications') || 0);
    const intakeBlood = parseFloat(data.get('intakeBlood') || 0);
    const intakeOthers = parseFloat(data.get('intakeOthers') || 0);
    const totalIntake = intakeVo + intakeEv + intakeEnteral + intakeMedications + intakeBlood + intakeOthers;

    // Outputs
    const outputDiuresis = parseFloat(data.get('outputDiuresis') || 0);
    const outputVomiting = parseFloat(data.get('outputVomiting') || 0);
    const outputDrains = parseFloat(data.get('outputDrains') || 0);
    const outputStool = parseFloat(data.get('outputStool') || 0);
    const outputAspiration = parseFloat(data.get('outputAspiration') || 0);
    const outputHemorrhage = parseFloat(data.get('outputHemorrhage') || 0);
    const outputOthers = parseFloat(data.get('outputOthers') || 0);
    const totalOutput = outputDiuresis + outputVomiting + outputDrains + outputStool + outputAspiration + outputHemorrhage + outputOthers;

    const fluidBalance = totalIntake - totalOutput;

    const hours = parseFloat(data.get('hours') || 24);
    const urineOutput = outputDiuresis / (weight * hours);

    const evaluation = {
      id: Store.generateId(),
      timestamp: new Date().toISOString(),
      age,
      gender,
      bed,
      weight,
      height,
      waist,
      neck,
      hip,
      
      // Sinais vitais
      systolic: data.get('systolic') ? parseInt(data.get('systolic')) : null,
      diastolic: data.get('diastolic') ? parseInt(data.get('diastolic')) : null,
      heartRate: data.get('heartRate') ? parseInt(data.get('heartRate')) : null,
      temperature: data.get('temperature') ? parseFloat(data.get('temperature')) : null,
      spo2: data.get('spo2') ? parseInt(data.get('spo2')) : null,
      glucose: data.get('glucose') ? parseInt(data.get('glucose')) : null,

      // Entradas
      intakeVo,
      intakeEv,
      intakeEnteral,
      intakeMedications,
      intakeBlood,
      intakeOthers,

      // Saídas
      outputDiuresis,
      outputVomiting,
      outputDrains,
      outputStool,
      outputAspiration,
      outputHemorrhage,
      outputOthers,

      hours,
      
      // Calculations
      bmi,
      idealWeight,
      bodySurface,
      bodyFat,
      waterRequirement: weight * 35,
      urineOutput,
      fluidBalance
    };

    const evals = patient.nutrologyEvaluations || [];
    evals.push(evaluation);

    Store.update('patients', patientId, { 
      nutrologyEvaluations: evals,
      gender,
      age,
      bed
    });

    Store.addAuditLog('Avaliação clínica realizada', {
      patient: patient.name,
      details: `Peso: ${weight}kg, IMC: ${bmi.toFixed(1)}, BH: ${fluidBalance}mL`
    });

    Modal.close();
    switchTab('nutrology');
    Notifications.show('Avaliação Salva', 'Cálculos fisiológicos e balanço hídrico concluídos!', 'success');
  }

  function deleteNutrologyEvaluation(evalId) {
    const patient = Store.getById('patients', patientId);
    if (!patient) return;
    if (!confirm('Deseja realmente excluir esta avaliação nutrológica?')) return;
    
    const evals = patient.nutrologyEvaluations || [];
    const updatedEvals = evals.filter(e => e.id !== evalId);
    
    Store.update('patients', patientId, { nutrologyEvaluations: updatedEvals });
    Store.addAuditLog('Avaliação nutrológica excluída', {
      patient: patient.name
    });
    
    Notifications.show('Avaliação Excluída', 'Registro removido com sucesso.', 'warning');
    switchTab('nutrology');
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
    showAddIntervention, handleAddIntervention, showEditIntervention, handleEditIntervention, deleteIntervention, toggleInterventionStatus,
    // Nutrologia & BH methods
    renderNutrology,
    toggleNutrologyMonitoring,
    showAddNutrologyEvaluation,
    handleAddNutrologyEvaluation,
    deleteNutrologyEvaluation,
    copyToClipboard,
    switchPepSubtab
  };
})();
