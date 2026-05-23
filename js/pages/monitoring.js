// ============================================
// HOME CARE APP — Monitoring Page
// Real-time vital signs monitoring
// ============================================

const MonitoringPage = (() => {
  let selectedPatientId = null;
  let refreshInterval = null;

  function render() {
    const patients = Store.getAll('patients').filter(p => p.status === 'active' || p.status === 'palliative');
    if (!selectedPatientId && patients.length) selectedPatientId = patients[0].id;

    return `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <h1 class="page-title">Monitoramento</h1>
            <p class="page-subtitle">Sinais vitais em tempo real</p>
          </div>
          <div class="page-actions">
            <div class="status-indicator">
              <span class="badge-dot active"></span>
              <span style="font-size:var(--font-size-sm)">Atualização automática</span>
            </div>
          </div>
        </div>

        <!-- Patient Selector -->
        <div class="monitor-patient-selector">
          ${patients.map(p => {
            const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2);
            return `
              <div class="monitor-patient-chip ${p.id === selectedPatientId ? 'active' : ''}"
                   onclick="MonitoringPage.selectPatient('${p.id}')">
                <div class="avatar avatar-sm avatar-${p.avatarColor}">${initials}</div>
                <span>${p.name.split(' ')[0]}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Monitoring Content -->
        <div id="monitorContent">
          ${renderMonitorContent()}
        </div>
      </div>
    `;
  }

  function renderMonitorContent() {
    const patient = Store.getById('patients', selectedPatientId);
    if (!patient) return '<div class="empty-state"><i data-lucide="activity"></i><h3>Selecione um paciente</h3></div>';

    const vitals = Store.getAll('vitalSigns')
      .filter(v => v.patientId === selectedPatientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const latest = vitals[0];
    const alerts = Store.getAll('alerts').filter(a => a.patient === patient.name && !a.read);

    return `
      <!-- Active Alerts for Patient -->
      ${alerts.length ? `
        <div style="display:flex;flex-direction:column;gap:var(--space-sm);margin-bottom:var(--space-lg)">
          ${alerts.map(a => `
            <div class="alert-card ${a.type}">
              <div class="alert-pulse"></div>
              <div style="flex:1">
                <div style="font-weight:600">${a.message}</div>
                <div style="font-size:var(--font-size-xs);color:var(--text-tertiary);margin-top:4px">${formatTimeAgo(a.timestamp)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Vital Signs Dashboard -->
      ${latest ? `
        <div class="vitals-grid" style="margin-bottom:var(--space-xl)">
          ${vitalCard('heart', 'Pressão Arterial', `${latest.systolic}/${latest.diastolic}`, 'mmHg', 
            latest.systolic > 140 ? 'critical' : latest.systolic > 130 ? 'warning' : '', 'var(--danger)')}
          ${vitalCard('activity', 'Freq. Cardíaca', latest.heartRate, 'bpm',
            latest.heartRate > 100 ? 'warning' : latest.heartRate < 50 ? 'critical' : '', 'var(--primary)')}
          ${vitalCard('wind', 'SpO2', `${latest.spo2}%`, 'saturação',
            latest.spo2 < 90 ? 'critical' : latest.spo2 < 94 ? 'warning' : '', 'var(--info)')}
          ${vitalCard('thermometer', 'Temperatura', `${latest.temperature}°`, 'Celsius',
            latest.temperature > 38 ? 'critical' : latest.temperature > 37.5 ? 'warning' : '', 'var(--warning)')}
          ${latest.glucose ? vitalCard('droplets', 'Glicemia', latest.glucose, 'mg/dL',
            latest.glucose > 180 ? 'critical' : latest.glucose > 160 ? 'warning' : '', 'var(--secondary)') : ''}
        </div>
      ` : '<div class="alert-banner alert-banner-info mb-lg"><i data-lucide="info"></i> Nenhum registro de sinais vitais para este paciente.</div>'}

      <!-- Charts -->
      <div class="grid-2" style="margin-bottom:var(--space-xl)">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Pressão Arterial</h3>
          </div>
          <div class="monitor-chart"><canvas id="monitorBP"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">FC / SpO2</h3>
          </div>
          <div class="monitor-chart"><canvas id="monitorHR"></canvas></div>
        </div>
      </div>

      <!-- Medications Today -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">💊 Medicamentos</h3>
          <button class="btn btn-primary btn-sm" onclick="MonitoringPage.showAdministerMed()">
            <i data-lucide="plus"></i> Administrar
          </button>
        </div>
        <div class="medication-list">
          ${(() => {
            const activeRx = (patient.prescriptions || []).filter(rx => rx.status !== 'suspended');
            activeRx.forEach(rx => {
              if (!rx.id) rx.id = Store.generateId();
            });
            return activeRx.map((rx) => `
              <div class="medication-item">
                <div style="width:32px;height:32px;background:var(--primary-light);border-radius:var(--border-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i data-lucide="pill" style="width:16px;height:16px;color:var(--primary)"></i>
                </div>
                <div style="flex:1">
                  <div style="font-weight:500">${rx.medication}</div>
                  <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">${rx.dosage} — ${rx.route}</div>
                </div>
                <button class="btn btn-success btn-sm" onclick="MonitoringPage.markMedGiven('${rx.id}')" title="Marcar como administrado">
                  <i data-lucide="check" style="width:14px;height:14px"></i>
                </button>
              </div>
            `).join('') || '<p class="text-secondary">Nenhuma prescrição ativa</p>';
          })()}
        </div>
      </div>

      <!-- Register Occurrence -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">⚠️ Intercorrências</h3>
          <button class="btn btn-danger btn-sm" onclick="MonitoringPage.showOccurrence()">
            <i data-lucide="alert-triangle"></i> Registrar
          </button>
        </div>
      </div>
    `;
  }

  function vitalCard(icon, label, value, unit, status, color) {
    return `
      <div class="vital-card ${status}">
        <div class="vital-icon" style="color:${color}"><i data-lucide="${icon}" style="width:20px;height:20px"></i></div>
        <div class="vital-value">${value}</div>
        <div class="vital-label">${label}</div>
        <div class="vital-unit">${unit}</div>
      </div>
    `;
  }

  function selectPatient(id) {
    selectedPatientId = id;
    refreshContent();
    document.querySelectorAll('.monitor-patient-chip').forEach(c => {
      c.classList.toggle('active', c.querySelector('.avatar')?.parentElement === c && c.onclick?.toString().includes(id));
    });
    // Re-render all chips
    const selector = document.querySelector('.monitor-patient-selector');
    if (selector) {
      const patients = Store.getAll('patients').filter(p => p.status === 'active' || p.status === 'palliative');
      selector.innerHTML = patients.map(p => {
        const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        return `
          <div class="monitor-patient-chip ${p.id === selectedPatientId ? 'active' : ''}"
               onclick="MonitoringPage.selectPatient('${p.id}')">
            <div class="avatar avatar-sm avatar-${p.avatarColor}">${initials}</div>
            <span>${p.name.split(' ')[0]}</span>
          </div>
        `;
      }).join('');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    refreshContent();
  }

  function refreshContent() {
    const content = document.getElementById('monitorContent');
    if (content) {
      content.innerHTML = renderMonitorContent();
      if (typeof lucide !== 'undefined') lucide.createIcons();
      renderCharts();
    }
  }

  function renderCharts() {
    const vitals = Store.getAll('vitalSigns')
      .filter(v => v.patientId === selectedPatientId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    if (vitals.length < 2) return;

    setTimeout(() => {
      const labels = vitals.map(v => {
        const d = new Date(v.timestamp);
        return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}h`;
      });
      Charts.lineChart('monitorBP', {
        labels,
        datasets: [
          { values: vitals.map(v => v.systolic), color: '#FF453A', fillColor: 'rgba(255,69,58,0.1)', label: 'Sistólica' },
          { values: vitals.map(v => v.diastolic), color: '#FF9F0A', label: 'Diastólica' }
        ]
      });
      Charts.lineChart('monitorHR', {
        labels,
        datasets: [
          { values: vitals.map(v => v.heartRate), color: '#0A84FF', fillColor: 'rgba(10,132,255,0.1)', label: 'FC' },
          { values: vitals.map(v => v.spo2), color: '#30D158', label: 'SpO2' }
        ]
      });
    }, 100);
  }

  function markMedGiven(idOrIndex) {
    const patient = Store.getById('patients', selectedPatientId);
    if (!patient) return;
    
    let rx = (patient.prescriptions || []).find(r => r.id === idOrIndex);
    if (!rx && (typeof idOrIndex === 'number' || !isNaN(idOrIndex))) {
      rx = (patient.prescriptions || [])[parseInt(idOrIndex)];
    }
    if (!rx) {
      rx = (patient.prescriptions || []).find(r => r.medication === idOrIndex);
    }
    
    if (!rx) return;
    Store.addAuditLog('Medicamento administrado', {
      patient: patient.name,
      details: `${rx.medication} - ${rx.dosage} (${rx.route})`
    });
    Notifications.show('Medicamento', `${rx.medication} registrado como administrado`, 'success');
  }

  function showAdministerMed() {
    const patient = Store.getById('patients', selectedPatientId);
    if (!patient) return;
    const activeRx = (patient.prescriptions || []).filter(rx => rx.status !== 'suspended');
    Modal.show({
      title: 'Administrar Medicamento',
      content: `
        <form onsubmit="MonitoringPage.handleAdministerMed(event)">
          <div class="form-group">
            <label class="form-label">Medicamento</label>
            <select class="form-input" name="medication" required>
              ${activeRx.map(rx => `<option value="${rx.medication}">${rx.medication} - ${rx.dosage}</option>`).join('')}
              <option value="other">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Observações</label>
            <textarea class="form-input" name="notes" placeholder="Observações sobre a administração..."></textarea>
          </div>
          <button type="submit" class="btn btn-success btn-full"><i data-lucide="check"></i> Confirmar Administração</button>
        </form>
      `
    });
  }

  function handleAdministerMed(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', selectedPatientId);
    Store.addAuditLog('Medicamento administrado', {
      patient: patient?.name,
      details: `${data.get('medication')} — ${data.get('notes') || 'Sem observações'}`
    });
    Modal.close();
    Notifications.show('Medicamento', 'Administração registrada com sucesso', 'success');
  }

  function showOccurrence() {
    Modal.show({
      title: '⚠️ Registrar Intercorrência',
      content: `
        <form onsubmit="MonitoringPage.handleOccurrence(event)">
          <div class="form-group">
            <label class="form-label">Gravidade *</label>
            <select class="form-input" name="severity" required>
              <option value="warning">Atenção</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Descrição *</label>
            <textarea class="form-input" name="description" required placeholder="Descreva a intercorrência..." style="min-height:120px"></textarea>
          </div>
          <button type="submit" class="btn btn-danger btn-full"><i data-lucide="alert-triangle"></i> Registrar Intercorrência</button>
        </form>
      `
    });
  }

  function handleOccurrence(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const patient = Store.getById('patients', selectedPatientId);
    Store.add('alerts', {
      type: data.get('severity'),
      patient: patient?.name,
      message: data.get('description'),
      timestamp: new Date().toISOString(),
      read: false
    });
    Store.addAuditLog('Intercorrência registrada', {
      patient: patient?.name,
      details: data.get('description')
    });
    Modal.close();
    refreshContent();
    Notifications.show('Intercorrência', 'Registrada com sucesso. Equipe notificada.', 'warning');
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

  function afterRender() {
    renderCharts();
  }

  function destroy() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  return { render, afterRender, destroy, selectPatient, markMedGiven, showAdministerMed, handleAdministerMed, showOccurrence, handleOccurrence };
})();
