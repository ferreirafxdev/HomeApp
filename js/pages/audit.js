// ============================================
// HOME CARE APP — Audit Page
// Security, traceability, logs
// ============================================

const AuditPage = (() => {
  let filterProfessional = 'all';
  let filterAction = 'all';
  let searchQuery = '';

  function render() {
    const auditLog = Store.getAll('auditLog');
    const professionals = [...new Set(auditLog.map(e => e.professional))];
    const actions = [...new Set(auditLog.map(e => e.action))];

    return `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <h1 class="page-title">Auditoria</h1>
            <p class="page-subtitle">Segurança e rastreabilidade — ${auditLog.length} registros</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="AuditPage.exportLog()">
              <i data-lucide="download"></i> Exportar PDF
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="audit-filters">
          <div class="search-bar" style="flex:1;min-width:200px;max-width:400px">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Buscar ação, paciente..." 
                   value="${searchQuery}"
                   oninput="AuditPage.handleSearch(this.value)">
          </div>
          <select class="form-input" style="max-width:200px;min-height:44px" onchange="AuditPage.setFilterProfessional(this.value)">
            <option value="all">Todos profissionais</option>
            ${professionals.map(p => `<option value="${p}" ${p === filterProfessional ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
          <select class="form-input" style="max-width:200px;min-height:44px" onchange="AuditPage.setFilterAction(this.value)">
            <option value="all">Todas ações</option>
            ${actions.map(a => `<option value="${a}" ${a === filterAction ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
        </div>

        <!-- Stats -->
        <div class="grid-4 mb-lg">
          <div class="kpi-card kpi-blue">
            <div class="kpi-value">${auditLog.length}</div>
            <div class="kpi-label">Total de Registros</div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-value">${getTodayCount(auditLog)}</div>
            <div class="kpi-label">Ações Hoje</div>
          </div>
          <div class="kpi-card kpi-purple">
            <div class="kpi-value">${professionals.length}</div>
            <div class="kpi-label">Profissionais Ativos</div>
          </div>
          <div class="kpi-card kpi-orange">
            <div class="kpi-value">${auditLog.filter(e => e.location).length}</div>
            <div class="kpi-label">Com Geolocalização</div>
          </div>
        </div>

        <!-- Log Entries -->
        <div class="card">
          <div id="auditEntries">
            ${renderEntries()}
          </div>
        </div>
      </div>
    `;
  }

  function renderEntries() {
    const entries = getFilteredEntries();
    if (!entries.length) {
      return '<div class="empty-state"><i data-lucide="shield-check"></i><h3>Nenhum registro encontrado</h3><p>Ajuste os filtros de busca</p></div>';
    }

    return entries.slice(0, 50).map(entry => {
      const actionIcons = {
        'Registro de sinais vitais': 'activity',
        'Evolução clínica registrada': 'file-text',
        'Medicamento administrado': 'pill',
        'Insulina administrada': 'syringe',
        'Visita médica realizada': 'stethoscope',
        'Atendimento psicológico': 'brain',
        'Check-in no paciente': 'map-pin',
        'Paciente cadastrado': 'user-plus',
        'Atendimento agendado': 'calendar-plus',
        'Atendimento concluído': 'calendar-check',
        'Intercorrência registrada': 'alert-triangle',
        'Prescrição adicionada': 'pill',
        'Item adicionado ao estoque': 'package',
        'Relatório exportado': 'download'
      };
      const icon = actionIcons[entry.action] || 'clipboard';

      return `
        <div class="audit-entry" onclick="AuditPage.showDetail('${entry.id}')">
          <div class="audit-timestamp">
            <div>${formatDate(entry.timestamp)}</div>
            <div style="color:var(--text-tertiary)">${formatTime(entry.timestamp)}</div>
          </div>
          <div style="width:32px;height:32px;background:var(--bg-tertiary);border-radius:var(--border-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i data-lucide="${icon}" style="width:16px;height:16px;color:var(--text-secondary)"></i>
          </div>
          <div class="audit-content">
            <div class="audit-action">
              <strong>${entry.action}</strong>
              ${entry.patient ? ` — <span style="color:var(--primary)">${entry.patient}</span>` : ''}
            </div>
            <div class="audit-details">${entry.details || ''}</div>
            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-top:4px;flex-wrap:wrap">
              <span class="badge badge-neutral">${entry.professional}</span>
              <span class="badge badge-purple">${entry.professionalRole || ''}</span>
              ${entry.location ? `
                <span class="audit-location">
                  <i data-lucide="map-pin" style="width:12px;height:12px"></i>
                  ${entry.location}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function getFilteredEntries() {
    let entries = Store.getAll('auditLog');
    if (filterProfessional !== 'all') {
      entries = entries.filter(e => e.professional === filterProfessional);
    }
    if (filterAction !== 'all') {
      entries = entries.filter(e => e.action === filterAction);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(e =>
        (e.action && e.action.toLowerCase().includes(q)) ||
        (e.patient && e.patient.toLowerCase().includes(q)) ||
        (e.professional && e.professional.toLowerCase().includes(q)) ||
        (e.details && e.details.toLowerCase().includes(q))
      );
    }
    return entries;
  }

  function handleSearch(query) {
    searchQuery = query;
    refreshEntries();
  }

  function setFilterProfessional(value) {
    filterProfessional = value;
    refreshEntries();
  }

  function setFilterAction(value) {
    filterAction = value;
    refreshEntries();
  }

  function refreshEntries() {
    const container = document.getElementById('auditEntries');
    if (container) {
      container.innerHTML = renderEntries();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  function showDetail(entryId) {
    const entry = Store.getById('auditLog', entryId);
    if (!entry) return;

    Modal.show({
      title: 'Detalhe do Registro',
      content: `
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          <div class="list-item">
            <i data-lucide="clock" style="color:var(--text-tertiary)"></i>
            <div class="list-item-content">
              <div class="list-item-title">${new Date(entry.timestamp).toLocaleString('pt-BR')}</div>
              <div class="list-item-subtitle">Data e Hora</div>
            </div>
          </div>
          <div class="list-item">
            <i data-lucide="clipboard" style="color:var(--text-tertiary)"></i>
            <div class="list-item-content">
              <div class="list-item-title">${entry.action}</div>
              <div class="list-item-subtitle">Ação</div>
            </div>
          </div>
          <div class="list-item">
            <i data-lucide="user" style="color:var(--text-tertiary)"></i>
            <div class="list-item-content">
              <div class="list-item-title">${entry.professional}</div>
              <div class="list-item-subtitle">${entry.professionalRole || 'Profissional'}</div>
            </div>
          </div>
          ${entry.patient ? `
            <div class="list-item">
              <i data-lucide="heart-pulse" style="color:var(--text-tertiary)"></i>
              <div class="list-item-content">
                <div class="list-item-title">${entry.patient}</div>
                <div class="list-item-subtitle">Paciente</div>
              </div>
            </div>
          ` : ''}
          ${entry.details ? `
            <div class="card-flat">
              <div class="form-label">Detalhes</div>
              <p style="color:var(--text-secondary)">${entry.details}</p>
            </div>
          ` : ''}
          ${entry.location ? `
            <div class="list-item">
              <i data-lucide="map-pin" style="color:var(--text-tertiary)"></i>
              <div class="list-item-content">
                <div class="list-item-title">${entry.location}</div>
                <div class="list-item-subtitle">Geolocalização</div>
              </div>
            </div>
          ` : ''}
        </div>
      `
    });
  }

  function exportLog() {
    const entries = getFilteredEntries();
    if (!entries.length) {
      Notifications.show('Exportação', 'Nenhum registro para exportar', 'warning');
      return;
    }

    const headers = ['Data/Hora', 'Ação', 'Profissional', 'Função', 'Paciente', 'Detalhes'];
    const rows = entries.map(e => [
      new Date(e.timestamp).toLocaleString('pt-BR'),
      e.action || '',
      e.professional || '',
      e.professionalRole || '',
      e.patient || '-',
      (e.details || '').substring(0, 60)
    ]);

    const filename = PdfExport.generate({
      title: 'Relatório de Auditoria',
      subtitle: `${entries.length} registros — Gerado em ${new Date().toLocaleString('pt-BR')}`,
      filename: `auditoria_homecare_${new Date().toISOString().split('T')[0]}`,
      sections: [
        {
          type: 'table',
          title: 'Registros de Auditoria',
          headers: headers,
          rows: rows
        }
      ]
    });

    Store.addAuditLog('Relatório exportado', { details: `Auditoria PDF — ${entries.length} registros` });
    Notifications.show('Exportação', 'Relatório PDF baixado com sucesso', 'success');
  }

  function getTodayCount(auditLog) {
    const today = new Date().toISOString().split('T')[0];
    return auditLog.filter(e => e.timestamp && e.timestamp.startsWith(today)).length;
  }

  function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function afterRender() {}

  return { render, afterRender, handleSearch, setFilterProfessional, setFilterAction, showDetail, exportLog };
})();
