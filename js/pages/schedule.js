// ============================================
// HOME CARE APP — Schedule Page
// ============================================

const SchedulePage = (() => {
  let currentView = 'list';
  let filterType = 'all';

  function render() {
    const schedules = Store.getAll('schedules');
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySchedules = schedules.filter(s => s.date === todayStr);

    return `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <h1 class="page-title">Atendimentos</h1>
            <p class="page-subtitle">${todaySchedules.length} atendimentos hoje</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="SchedulePage.showAddModal()">
              <i data-lucide="plus"></i> <span>Novo Atendimento</span>
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="schedule-filters">
          <button class="chip ${filterType === 'all' ? 'active' : ''}" onclick="SchedulePage.setFilter('all')">Todos</button>
          <button class="chip ${filterType === 'nursing' ? 'active' : ''}" onclick="SchedulePage.setFilter('nursing')">
            🩺 Enfermagem
          </button>
          <button class="chip ${filterType === 'medical' ? 'active' : ''}" onclick="SchedulePage.setFilter('medical')">
            👨‍⚕️ Médico
          </button>
          <button class="chip ${filterType === 'physio' ? 'active' : ''}" onclick="SchedulePage.setFilter('physio')">
            🦴 Fisioterapia
          </button>
          <button class="chip ${filterType === 'nutrition' ? 'active' : ''}" onclick="SchedulePage.setFilter('nutrition')">
            🥗 Nutrição
          </button>
          <button class="chip ${filterType === 'psychology' ? 'active' : ''}" onclick="SchedulePage.setFilter('psychology')">
            🧠 Psicologia
          </button>
        </div>

        <!-- View Toggle -->
        <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-lg)">
          <button class="btn ${currentView === 'list' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="SchedulePage.setView('list')">
            <i data-lucide="list"></i> Lista
          </button>
          <button class="btn ${currentView === 'calendar' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="SchedulePage.setView('calendar')">
            <i data-lucide="calendar"></i> Calendário
          </button>
        </div>

        <div id="scheduleContent">
          ${currentView === 'list' ? renderList() : renderCalendar()}
        </div>
      </div>
    `;
  }

  function renderList() {
    const schedules = getFilteredSchedules();
    const grouped = groupByDate(schedules);

    return Object.entries(grouped).map(([date, items]) => `
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">${formatDateLabel(date)}</h3>
          <span class="badge badge-neutral">${items.length} atendimentos</span>
        </div>
        <div class="schedule-list">
          ${items.sort((a, b) => a.time.localeCompare(b.time)).map(s => {
            const patient = Store.getById('patients', s.patientId);
            const prof = Store.getById('professionals', s.professionalId);
            const statusBadge = s.status === 'completed' ? 'badge-success' :
              s.status === 'in-progress' ? 'badge-warning' : 'badge-primary';
            const statusLabel = s.status === 'completed' ? 'Concluído' :
              s.status === 'in-progress' ? 'Em andamento' : 'Agendado';

            return `
              <div class="schedule-item ${s.type}" onclick="SchedulePage.showDetail('${s.id}')">
                <div style="text-align:center;min-width:50px">
                  <div style="font-size:var(--font-size-lg);font-weight:700;font-family:var(--font-mono)">${s.time}</div>
                  <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${s.duration}min</div>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:500">${s.title}</div>
                  <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">${patient?.name || '-'}</div>
                  <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${prof?.name || '-'}</div>
                </div>
                <span class="badge ${statusBadge}">${statusLabel}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('') || '<div class="empty-state"><i data-lucide="calendar-x"></i><h3>Nenhum atendimento encontrado</h3></div>';
  }

  function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();
    const schedules = Store.getAll('schedules');

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    let cells = '';
    // Header cells
    dayNames.forEach(d => {
      cells += `<div class="calendar-header-cell">${d}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells += '<div class="calendar-cell other-month"></div>';
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const daySchedules = schedules.filter(s => s.date === dateStr);
      const isToday = d === today;

      cells += `
        <div class="calendar-cell ${isToday ? 'today' : ''}" onclick="SchedulePage.showDayDetail('${dateStr}')">
          <div class="calendar-day">${d}</div>
          ${daySchedules.slice(0, 2).map(s => `
            <div class="calendar-event ${s.type}">${s.time} ${Store.getById('patients', s.patientId)?.name?.split(' ')[0] || ''}</div>
          `).join('')}
          ${daySchedules.length > 0 ? `<div class="calendar-event-count">${daySchedules.length} atend.</div>` : ''}
        </div>
      `;
    }

    return `
      <div style="text-align:center;margin-bottom:var(--space-lg)">
        <h3>${monthNames[month]} ${year}</h3>
      </div>
      <div class="calendar-grid">${cells}</div>
    `;
  }

  function getFilteredSchedules() {
    let schedules = Store.getAll('schedules');
    if (filterType !== 'all') {
      schedules = schedules.filter(s => s.type === filterType);
    }
    return schedules.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }

  function groupByDate(schedules) {
    return schedules.reduce((groups, s) => {
      if (!groups[s.date]) groups[s.date] = [];
      groups[s.date].push(s);
      return groups;
    }, {});
  }

  function formatDateLabel(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (dateStr === today) return '📅 Hoje';
    if (dateStr === tomorrow) return '📅 Amanhã';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function setFilter(type) {
    filterType = type;
    refreshContent();
    document.querySelectorAll('.schedule-filters .chip').forEach(c => c.classList.remove('active'));
    event.target.closest('.chip')?.classList.add('active');
  }

  function setView(view) {
    currentView = view;
    refreshContent();
  }

  function refreshContent() {
    const content = document.getElementById('scheduleContent');
    if (content) {
      content.innerHTML = currentView === 'list' ? renderList() : renderCalendar();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  function showDetail(scheduleId) {
    const s = Store.getById('schedules', scheduleId);
    if (!s) return;
    const patient = Store.getById('patients', s.patientId);
    const prof = Store.getById('professionals', s.professionalId);

    Modal.show({
      title: s.title,
      content: `
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          <div class="list-item"><i data-lucide="user" style="color:var(--text-tertiary)"></i>
            <div class="list-item-content"><div class="list-item-title">${patient?.name || '-'}</div><div class="list-item-subtitle">Paciente</div></div>
          </div>
          <div class="list-item"><i data-lucide="stethoscope" style="color:var(--text-tertiary)"></i>
            <div class="list-item-content"><div class="list-item-title">${prof?.name || '-'}</div><div class="list-item-subtitle">${prof?.role || ''}</div></div>
          </div>
          <div class="list-item"><i data-lucide="clock" style="color:var(--text-tertiary)"></i>
            <div class="list-item-content"><div class="list-item-title">${s.date} às ${s.time}</div><div class="list-item-subtitle">Duração: ${s.duration} minutos</div></div>
          </div>
          ${s.notes ? `<div class="card-flat"><p style="font-size:var(--font-size-sm);color:var(--text-secondary)"><strong>Notas:</strong> ${s.notes}</p></div>` : ''}
        </div>
      `,
      footer: s.status !== 'completed' ? `
        <button class="btn btn-secondary" onclick="Modal.close()">Fechar</button>
        <button class="btn btn-success" onclick="SchedulePage.completeSchedule('${s.id}')">
          <i data-lucide="check"></i> Concluir
        </button>
      ` : `<button class="btn btn-secondary" onclick="Modal.close()">Fechar</button>`
    });
  }

  function showDayDetail(dateStr) {
    const schedules = Store.getAll('schedules').filter(s => s.date === dateStr);
    const label = formatDateLabel(dateStr);
    Modal.show({
      title: label,
      content: schedules.length ? schedules.map(s => {
        const patient = Store.getById('patients', s.patientId);
        return `
          <div class="list-item" onclick="Modal.close();SchedulePage.showDetail('${s.id}')" style="border-bottom:1px solid var(--border-color)">
            <span style="font-family:var(--font-mono);color:var(--primary);min-width:50px">${s.time}</span>
            <div class="list-item-content"><div class="list-item-title">${s.title}</div><div class="list-item-subtitle">${patient?.name || '-'}</div></div>
          </div>
        `;
      }).join('') : '<div class="empty-state"><p>Nenhum atendimento neste dia</p></div>'
    });
  }

  function completeSchedule(id) {
    Store.update('schedules', id, { status: 'completed' });
    const s = Store.getById('schedules', id);
    const patient = Store.getById('patients', s?.patientId);
    Store.addAuditLog('Atendimento concluído', { patient: patient?.name, details: s?.title });
    Modal.close();
    refreshContent();
    Notifications.show('Atendimento', 'Marcado como concluído', 'success');
  }

  function showAddModal() {
    const patients = Store.getAll('patients');
    const professionals = Store.getAll('professionals');

    Modal.show({
      title: 'Novo Atendimento',
      size: 'large',
      content: `
        <form id="addScheduleForm" onsubmit="SchedulePage.handleAdd(event)">
          <div class="form-group">
            <label class="form-label">Paciente *</label>
            <select class="form-input" name="patientId" required>
              <option value="">Selecionar paciente</option>
              ${patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Profissional *</label>
            <select class="form-input" name="professionalId" required>
              <option value="">Selecionar profissional</option>
              ${professionals.map(p => `<option value="${p.id}">${p.name} - ${p.role}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo *</label>
            <select class="form-input" name="type" required>
              <option value="nursing">Enfermagem</option>
              <option value="medical">Médico</option>
              <option value="physio">Fisioterapia</option>
              <option value="nutrition">Nutrição</option>
              <option value="psychology">Psicologia</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Título *</label>
            <input class="form-input" name="title" required placeholder="Ex: Visita de Enfermagem">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Data *</label>
              <input class="form-input" name="date" type="date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label class="form-label">Horário *</label>
              <input class="form-input" name="time" type="time" required value="08:00">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Duração (minutos)</label>
            <input class="form-input" name="duration" type="number" value="45" min="15" max="240">
          </div>
          <button type="submit" class="btn btn-primary btn-full">
            <i data-lucide="calendar-plus"></i> Agendar Atendimento
          </button>
        </form>
      `
    });
  }

  function handleAdd(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const schedule = {
      patientId: data.get('patientId'),
      professionalId: data.get('professionalId'),
      type: data.get('type'),
      title: data.get('title'),
      date: data.get('date'),
      time: data.get('time'),
      duration: parseInt(data.get('duration')) || 45,
      status: 'scheduled',
      notes: ''
    };
    Store.add('schedules', schedule);
    const patient = Store.getById('patients', schedule.patientId);
    Store.addAuditLog('Atendimento agendado', { patient: patient?.name, details: `${schedule.title} em ${schedule.date} às ${schedule.time}` });
    Modal.close();
    refreshContent();
    Notifications.show('Agendamento', 'Atendimento agendado com sucesso', 'success');
  }

  function afterRender() {}

  return { render, afterRender, setFilter, setView, showDetail, showDayDetail, completeSchedule, showAddModal, handleAdd };
})();
