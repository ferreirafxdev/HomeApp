// ============================================
// HOME CARE APP — Patients Page
// ============================================

const PatientsPage = (() => {
  let searchQuery = '';
  let filterStatus = 'all';

  function render() {
    const patients = getFilteredPatients();

    return `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <h1 class="page-title">Pacientes</h1>
            <p class="page-subtitle">${Store.getAll('patients').length} pacientes cadastrados</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="PatientsPage.showAddModal()" id="addPatientBtn">
              <i data-lucide="user-plus"></i>
              <span>Novo Paciente</span>
            </button>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="card-flat" style="margin-bottom:var(--space-lg)">
          <div style="display:flex;flex-direction:column;gap:var(--space-md)">
            <div class="search-bar">
              <i data-lucide="search"></i>
              <input type="text" placeholder="Buscar por nome, diagnóstico..." 
                     value="${searchQuery}"
                     oninput="PatientsPage.handleSearch(this.value)"
                     id="patientSearch">
            </div>
            <div style="display:flex;gap:var(--space-sm);overflow-x:auto;scrollbar-width:none">
              <button class="chip ${filterStatus === 'all' ? 'active' : ''}" onclick="PatientsPage.setFilter('all')">Todos</button>
              <button class="chip ${filterStatus === 'active' ? 'active' : ''}" onclick="PatientsPage.setFilter('active')">
                <span class="badge-dot active"></span> Ativos
              </button>
              <button class="chip ${filterStatus === 'palliative' ? 'active' : ''}" onclick="PatientsPage.setFilter('palliative')">
                <span class="badge-dot warning"></span> Paliativos
              </button>
            </div>
          </div>
        </div>

        <!-- Patient Cards -->
        <div class="grid-3" id="patientsList">
          ${patients.length ? patients.map((p, i) => renderPatientCard(p, i)).join('') :
            '<div class="empty-state" style="grid-column:1/-1"><i data-lucide="users"></i><h3>Nenhum paciente encontrado</h3><p>Tente ajustar os filtros de busca</p></div>'}
        </div>
      </div>
    `;
  }

  function renderPatientCard(patient, index) {
    const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    const statusMap = {
      'active': { label: 'Ativo', class: 'badge-success' },
      'palliative': { label: 'Paliativo', class: 'badge-warning' },
      'discharged': { label: 'Alta', class: 'badge-neutral' }
    };
    const status = statusMap[patient.status] || statusMap['active'];
    const lastVitals = Store.getAll('vitalSigns')
      .filter(v => v.patientId === patient.id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

    return `
      <div class="patient-card animate-fade-in-up delay-${Math.min(index + 1, 8)}" 
           onclick="App.navigate('patient-detail', {id:'${patient.id}'})"
           id="patient-card-${patient.id}">
        <div class="avatar avatar-lg avatar-${patient.avatarColor}">${initials}</div>
        <div class="patient-card-info">
          <div class="patient-card-name">${patient.name}</div>
          <div class="patient-card-diagnosis">${patient.diagnosis}</div>
          <div class="patient-card-meta">
            <span class="badge ${status.class}">${status.label}</span>
            <span>${patient.age} anos</span>
            ${lastVitals ? `<span>PA: ${lastVitals.systolic}/${lastVitals.diastolic}</span>` : ''}
          </div>
        </div>
        <i data-lucide="chevron-right" style="color:var(--text-tertiary);flex-shrink:0"></i>
      </div>
    `;
  }

  function getFilteredPatients() {
    let patients = Store.getAll('patients');
    if (filterStatus !== 'all') {
      patients = patients.filter(p => p.status === filterStatus);
    }
    if (searchQuery) {
      patients = Store.search('patients', searchQuery, ['name', 'diagnosis', 'diagnosisCode']);
    }
    return patients;
  }

  function handleSearch(query) {
    searchQuery = query;
    refreshList();
  }

  function setFilter(status) {
    filterStatus = status;
    searchQuery = '';
    const input = document.getElementById('patientSearch');
    if (input) input.value = '';
    refreshList();
    // Update chip states
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    event.target.closest('.chip')?.classList.add('active');
  }

  function refreshList() {
    const container = document.getElementById('patientsList');
    if (container) {
      const patients = getFilteredPatients();
      container.innerHTML = patients.length ?
        patients.map((p, i) => renderPatientCard(p, i)).join('') :
        '<div class="empty-state" style="grid-column:1/-1"><i data-lucide="users"></i><h3>Nenhum paciente encontrado</h3><p>Tente ajustar os filtros</p></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  function showAddModal() {
    Modal.show({
      title: 'Novo Paciente',
      size: 'large',
      content: `
        <form id="addPatientForm" onsubmit="PatientsPage.handleAdd(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nome Completo *</label>
              <input class="form-input" name="name" required placeholder="Nome do paciente">
            </div>
            <div class="form-group">
              <label class="form-label">Idade *</label>
              <input class="form-input" name="age" type="number" required placeholder="Idade" min="0" max="150">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Sexo *</label>
              <select class="form-input" name="gender" required>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Leito / Quarto</label>
              <input class="form-input" name="bed" placeholder="Ex: Leito 102-A">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">CPF</label>
              <input class="form-input" name="cpf" placeholder="000.000.000-00">
            </div>
            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input class="form-input" name="phone" placeholder="(00) 00000-0000">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Endereço</label>
            <input class="form-input" name="address" placeholder="Endereço completo">
          </div>
          <div class="form-group">
            <label class="form-label">Diagnóstico Principal *</label>
            <input class="form-input" name="diagnosis" required placeholder="Ex: Insuficiência Cardíaca Congestiva">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">CID</label>
              <input class="form-input" name="diagnosisCode" placeholder="Ex: I50.0">
            </div>
            <div class="form-group">
              <label class="form-label">Tipo Sanguíneo</label>
              <select class="form-input" name="bloodType">
                <option value="">Selecionar</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
                <option>O+</option><option>O-</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Convênio / Plano de Saúde</label>
            <input class="form-input" name="healthPlan" placeholder="Ex: Unimed Gold">
          </div>
          <div class="form-group">
            <label class="form-label">Contato de Emergência</label>
            <input class="form-input" name="emergencyContact" placeholder="Nome - Telefone">
          </div>
          <div class="form-group">
            <label class="form-label">Alergias</label>
            <input class="form-input" name="allergies" placeholder="Separar por vírgula">
          </div>
          <div class="form-group">
            <label class="form-label">Plano Terapêutico</label>
            <textarea class="form-input" name="therapeuticPlan" placeholder="Descreva o plano terapêutico..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full">
            <i data-lucide="user-plus"></i> Cadastrar Paciente
          </button>
        </form>
      `
    });
  }

  function handleAdd(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    const patient = {
      name: data.get('name'),
      age: parseInt(data.get('age')),
      gender: data.get('gender') || 'M',
      bed: data.get('bed') || '',
      cpf: data.get('cpf') || '',
      phone: data.get('phone') || '',
      address: data.get('address') || '',
      emergencyContact: data.get('emergencyContact') || '',
      diagnosis: data.get('diagnosis'),
      diagnosisCode: data.get('diagnosisCode') || '',
      bloodType: data.get('bloodType') || '',
      healthPlan: data.get('healthPlan') || '',
      allergies: data.get('allergies') ? data.get('allergies').split(',').map(a => a.trim()) : [],
      therapeuticPlan: data.get('therapeuticPlan') || '',
      therapeuticGoals: [],
      therapeuticInterventions: [],
      comorbidities: [],
      prescriptions: [],
      status: 'active',
      admissionDate: new Date().toISOString().split('T')[0],
      avatarColor: Math.floor(Math.random() * 8) + 1
    };

    Store.add('patients', patient);
    Store.addAuditLog('Paciente cadastrado', { patient: patient.name, details: `Diagnóstico: ${patient.diagnosis}` });
    Modal.close();
    refreshList();
    Notifications.show('Paciente Cadastrado', `${patient.name} foi adicionado com sucesso`, 'success');
  }

  function afterRender() {
    // Focus search on desktop
    if (window.innerWidth >= 768) {
      document.getElementById('patientSearch')?.focus();
    }
  }

  return { render, afterRender, handleSearch, setFilter, showAddModal, handleAdd };
})();
