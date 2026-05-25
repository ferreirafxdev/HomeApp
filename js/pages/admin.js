// ============================================
// HOME CARE APP — Admin Page
// Materials, billing, reports
// ============================================

const AdminPage = (() => {
  let currentTab = 'inventory';

  function render() {
    return `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <h1 class="page-title">Administrativo</h1>
            <p class="page-subtitle">Materiais, custos e relatórios</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs" id="adminTabs">
          <button class="tab active" onclick="AdminPage.switchTab('inventory')" data-tab="inventory">
            <i data-lucide="package" style="width:16px;height:16px"></i> Estoque
          </button>
          <button class="tab" onclick="AdminPage.switchTab('billing')" data-tab="billing">
            <i data-lucide="receipt" style="width:16px;height:16px"></i> Faturamento
          </button>
          <button class="tab" onclick="AdminPage.switchTab('team')" data-tab="team">
            <i data-lucide="users" style="width:16px;height:16px"></i> Equipe
          </button>
          <button class="tab" onclick="AdminPage.switchTab('reports')" data-tab="reports">
            <i data-lucide="bar-chart-3" style="width:16px;height:16px"></i> Relatórios
          </button>
        </div>

        <div id="adminContent">
          ${renderTab()}
        </div>
      </div>
    `;
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#adminTabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('adminContent');
    if (content) {
      content.innerHTML = renderTab();
      if (typeof lucide !== 'undefined') lucide.createIcons();
      if (tab === 'billing' || tab === 'reports') setTimeout(renderAdminCharts, 100);
    }
  }

  function renderTab() {
    switch (currentTab) {
      case 'inventory': return renderInventory();
      case 'billing': return renderBilling();
      case 'team': return renderTeam();
      case 'reports': return renderReports();
      default: return '';
    }
  }

  function renderInventory() {
    const inventory = Store.getAll('inventory');
    const lowStock = inventory.filter(i => i.status === 'low' || i.status === 'out');

    return `
      ${lowStock.length ? `
        <div class="alert-banner alert-banner-warning mb-lg">
          <i data-lucide="alert-triangle"></i>
          <span><strong>${lowStock.length} itens</strong> com estoque baixo ou em falta</span>
        </div>
      ` : ''}

      <div class="section-header mb-md">
        <h3 class="section-title">Materiais e Insumos</h3>
        <button class="btn btn-primary btn-sm" onclick="AdminPage.showAddItem()">
          <i data-lucide="plus"></i> Adicionar Item
        </button>
      </div>

      <!-- Mobile Cards -->
      <div class="table-cards">
        ${inventory.map(item => {
          const statusClass = item.status === 'out' ? 'out-of-stock' : item.status === 'low' ? 'low-stock' : '';
          const statusLabel = item.status === 'out' ? 'Em falta' : item.status === 'low' ? 'Baixo' : 'OK';
          const statusBadge = item.status === 'out' ? 'badge-danger' : item.status === 'low' ? 'badge-warning' : 'badge-success';
          const pct = Math.min(100, (item.quantity / item.minQuantity) * 100);

          return `
            <div class="inventory-item ${statusClass}">
              <div style="flex:1">
                <div style="font-weight:500">${item.name}</div>
                <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${item.category} — R$ ${item.unitCost.toFixed(2)}/${item.unit}</div>
                <div class="progress-bar mt-sm" style="width:100%">
                  <div class="progress-fill ${item.status === 'out' ? 'danger' : item.status === 'low' ? 'warning' : 'success'}" style="width:${pct}%"></div>
                </div>
              </div>
              <div style="text-align:right">
                <div class="inventory-qty" style="color:${item.status === 'out' ? 'var(--danger)' : item.status === 'low' ? 'var(--warning)' : 'var(--text-primary)'}">${item.quantity}</div>
                <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">min: ${item.minQuantity}</div>
                <span class="badge ${statusBadge}" style="margin-top:4px">${statusLabel}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Desktop Table -->
      <div class="table-container" style="display:none">
        <table class="data-table" style="display:table">
          <thead>
            <tr>
              <th>Item</th><th>Categoria</th><th>Qtd</th><th>Mín</th><th>Custo Unit.</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${inventory.map(item => `
              <tr>
                <td style="font-weight:500">${item.name}</td>
                <td>${item.category}</td>
                <td class="text-mono">${item.quantity} ${item.unit}</td>
                <td class="text-mono">${item.minQuantity}</td>
                <td>R$ ${item.unitCost.toFixed(2)}</td>
                <td><span class="badge ${item.status === 'out' ? 'badge-danger' : item.status === 'low' ? 'badge-warning' : 'badge-success'}">${item.status === 'out' ? 'Em falta' : item.status === 'low' ? 'Baixo' : 'OK'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderBilling() {
    const billing = Store.get('billing') || {};
    const profit = (billing.monthlyRevenue || 0) - (billing.monthlyCosts || 0);

    return `
      <div class="grid-3 mb-lg">
        <div class="kpi-card kpi-green">
          <div class="kpi-icon"><i data-lucide="trending-up"></i></div>
          <div class="kpi-value">R$ ${formatCurrency(billing.monthlyRevenue)}</div>
          <div class="kpi-label">Receita Mensal</div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-icon"><i data-lucide="trending-down"></i></div>
          <div class="kpi-value">R$ ${formatCurrency(billing.monthlyCosts)}</div>
          <div class="kpi-label">Custos Mensais</div>
        </div>
        <div class="kpi-card ${profit >= 0 ? 'kpi-blue' : 'kpi-orange'}">
          <div class="kpi-icon"><i data-lucide="wallet"></i></div>
          <div class="kpi-value">R$ ${formatCurrency(profit)}</div>
          <div class="kpi-label">Resultado</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title mb-md">Composição de Custos</h3>
          <div style="height:220px;display:flex;align-items:center;justify-content:center">
            <canvas id="costChart" style="max-width:220px;max-height:220px"></canvas>
          </div>
          <div style="margin-top:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
            ${(billing.costBreakdown || []).map((item, i) => {
              const colors = ['#0A84FF', '#30D158', '#FF9F0A', '#5E5CE6', '#FF453A'];
              return `
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <div style="display:flex;align-items:center;gap:var(--space-sm)">
                    <div style="width:10px;height:10px;border-radius:2px;background:${colors[i]}"></div>
                    <span style="font-size:var(--font-size-sm)">${item.category}</span>
                  </div>
                  <span style="font-family:var(--font-mono);font-size:var(--font-size-sm)">R$ ${formatCurrency(item.amount)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="card">
          <h3 class="card-title mb-md">Faturas</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-md)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>Faturas pendentes</span>
              <span class="badge badge-warning">${billing.pendingInvoices || 0}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>Faturas concluídas</span>
              <span class="badge badge-success">${billing.completedInvoices || 0}</span>
            </div>
            <div class="divider"></div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-sm)">
                <span style="font-size:var(--font-size-sm)">Taxa de conclusão</span>
                <span style="font-size:var(--font-size-sm);font-weight:600">${Math.round(((billing.completedInvoices || 0) / ((billing.completedInvoices || 0) + (billing.pendingInvoices || 1))) * 100)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill success" style="width:${Math.round(((billing.completedInvoices || 0) / ((billing.completedInvoices || 0) + (billing.pendingInvoices || 1))) * 100)}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTeam() {
    const professionals = Store.getAll('professionals');
    const statusMap = {
      'available': { label: 'Disponível', class: 'badge-success', dot: 'active' },
      'in-visit': { label: 'Em atendimento', class: 'badge-warning', dot: 'warning' },
      'off-duty': { label: 'Folga', class: 'badge-neutral', dot: 'inactive' }
    };

    return `
      <div class="grid-3 mb-lg">
        <div class="kpi-card kpi-green">
          <div class="kpi-value">${professionals.filter(p => p.status === 'available').length}</div>
          <div class="kpi-label">Disponíveis</div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-value">${professionals.filter(p => p.status === 'in-visit').length}</div>
          <div class="kpi-label">Em Atendimento</div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-value">${professionals.length}</div>
          <div class="kpi-label">Total da Equipe</div>
        </div>
      </div>

      <div class="section-header mb-md">
        <h3 class="section-title">Membros da Equipe</h3>
        <button class="btn btn-primary btn-sm" onclick="AdminPage.showAddProfessional()">
          <i data-lucide="user-plus"></i> Adicionar Profissional
        </button>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        ${professionals.map(p => {
          const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2);
          const status = statusMap[p.status] || statusMap['available'];
          return `
            <div class="card-flat" style="display:flex;align-items:center;gap:var(--space-md)">
              <div class="avatar avatar-${p.avatarColor}">${initials}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:500">${p.name}</div>
                <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">${p.role} — ${p.specialty}</div>
                <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${p.coren} · ${p.phone}</div>
                ${p.username ? `
                  <div style="font-size:var(--font-size-xs);color:var(--primary);margin-top:6px;display:flex;align-items:center;flex-wrap:wrap;gap:8px">
                    <span style="display:flex;align-items:center;gap:2px"><i data-lucide="key" style="width:10px;height:10px"></i><strong>Usuário:</strong> ${p.username}</span>
                    <span style="display:flex;align-items:center;gap:2px"><i data-lucide="lock" style="width:10px;height:10px"></i><strong>Senha:</strong> ${p.password}</span>
                  </div>
                ` : ''}
              </div>
              <span class="badge ${status.class}"><span class="badge-dot ${status.dot}"></span> ${status.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderReports() {
    const patients = Store.getAll('patients');
    const schedules = Store.getAll('schedules');
    const completed = schedules.filter(s => s.status === 'completed').length;
    const total = schedules.length;

    return `
      <div class="grid-4 mb-lg">
        <div class="kpi-card kpi-blue">
          <div class="kpi-value">${patients.length}</div>
          <div class="kpi-label">Pacientes</div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-value">${completed}</div>
          <div class="kpi-label">Atend. Concluídos</div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-value">${total - completed}</div>
          <div class="kpi-label">Atend. Pendentes</div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-value">${total > 0 ? Math.round((completed / total) * 100) : 0}%</div>
          <div class="kpi-label">Taxa Conclusão</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title mb-md">Atendimentos por Tipo</h3>
          <div style="height:250px"><canvas id="typeChart"></canvas></div>
        </div>
        <div class="card">
          <h3 class="card-title mb-md">Status dos Pacientes</h3>
          <div style="height:250px;display:flex;align-items:center;justify-content:center">
            <canvas id="statusChart" style="max-width:250px;max-height:250px"></canvas>
          </div>
        </div>
      </div>

      <div class="card mt-lg">
        <div class="card-header">
          <h3 class="card-title">Exportar Relatórios (PDF)</h3>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm)">
          <button class="btn btn-secondary" onclick="AdminPage.exportReport('attendance')">
            <i data-lucide="file-text"></i> PDF — Atendimentos
          </button>
          <button class="btn btn-secondary" onclick="AdminPage.exportReport('financial')">
            <i data-lucide="receipt"></i> PDF — Financeiro
          </button>
          <button class="btn btn-secondary" onclick="AdminPage.exportReport('patients')">
            <i data-lucide="users"></i> PDF — Pacientes
          </button>
        </div>
      </div>

      <div class="card mt-lg" style="border: 1px solid var(--danger); background: rgba(255, 69, 58, 0.03)">
        <div class="card-header">
          <h3 class="card-title" style="color: var(--danger)">Manutenção do Sistema</h3>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
          <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-sm)">
            Use esta opção para limpar todos os dados fictícios simulados e reiniciar o sistema de Home Care com dados limpos para produção. Esta ação redefinirá o armazenamento local e o Firebase conectado.
          </p>
          <div>
            <button class="btn btn-danger" onclick="AdminPage.resetDatabase()">
              <i data-lucide="trash-2"></i> Limpar Banco de Dados (Firebase)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminCharts() {
    if (currentTab === 'billing') {
      const billing = Store.get('billing') || {};
      const colors = ['#0A84FF', '#30D158', '#FF9F0A', '#5E5CE6', '#FF453A'];
      Charts.donutChart('costChart', {
        segments: (billing.costBreakdown || []).map((item, i) => ({
          value: item.amount,
          color: colors[i]
        })),
        centerText: 'R$ 142k',
        centerSubtext: 'Custo Total'
      });
    }

    if (currentTab === 'reports') {
      const schedules = Store.getAll('schedules');
      const types = ['nursing', 'medical', 'physio', 'nutrition', 'psychology'];
      const typeLabels = ['Enferm.', 'Médico', 'Fisio', 'Nutri.', 'Psico.'];
      const typeColors = ['#0A84FF', '#30D158', '#FF9F0A', '#5E5CE6', '#64D2FF'];
      const typeCounts = types.map(t => schedules.filter(s => s.type === t).length);

      Charts.barChart('typeChart', {
        labels: typeLabels,
        values: typeCounts,
        colors: typeColors
      });

      const patients = Store.getAll('patients');
      Charts.donutChart('statusChart', {
        segments: [
          { value: patients.filter(p => p.status === 'active').length, color: '#30D158' },
          { value: patients.filter(p => p.status === 'palliative').length, color: '#FF9F0A' },
          { value: patients.filter(p => p.status === 'discharged').length, color: '#8B949E' }
        ],
        centerText: String(patients.length),
        centerSubtext: 'Pacientes'
      });
    }
  }

  function showAddItem() {
    Modal.show({
      title: 'Adicionar Item ao Estoque',
      content: `
        <form onsubmit="AdminPage.handleAddItem(event)">
          <div class="form-group">
            <label class="form-label">Nome do Item *</label>
            <input class="form-input" name="name" required placeholder="Ex: Luvas de Procedimento">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Categoria</label>
              <select class="form-input" name="category">
                <option>Material</option><option>EPI</option><option>Curativo</option>
                <option>Medicamento</option><option>Antisséptico</option><option>Higiene</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Unidade</label>
              <input class="form-input" name="unit" value="unid" placeholder="unid, pares, frascos...">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Quantidade *</label>
              <input class="form-input" name="quantity" type="number" required min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Qtd Mínima</label>
              <input class="form-input" name="minQuantity" type="number" value="10" min="0">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Custo Unitário (R$)</label>
            <input class="form-input" name="unitCost" type="number" step="0.01" value="0" min="0">
          </div>
          <button type="submit" class="btn btn-primary btn-full"><i data-lucide="plus"></i> Adicionar</button>
        </form>
      `
    });
  }

  function handleAddItem(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const qty = parseInt(data.get('quantity'));
    const minQty = parseInt(data.get('minQuantity'));
    const item = {
      name: data.get('name'),
      category: data.get('category'),
      quantity: qty,
      minQuantity: minQty,
      unit: data.get('unit'),
      unitCost: parseFloat(data.get('unitCost')),
      status: qty === 0 ? 'out' : qty < minQty ? 'low' : 'ok'
    };
    Store.add('inventory', item);
    Store.addAuditLog('Item adicionado ao estoque', { details: `${item.name} — ${item.quantity} ${item.unit}` });
    Modal.close();
    switchTab('inventory');
    Notifications.show('Estoque', `${item.name} adicionado com sucesso`, 'success');
  }

  function exportReport(type) {
    const today = new Date().toISOString().split('T')[0];

    if (type === 'attendance') {
      const schedules = Store.getAll('schedules');
      if (!schedules.length) {
        Notifications.show('Exportação', 'Nenhum atendimento registrado para exportar', 'warning');
        return;
      }
      const statusLabels = { 'completed': 'Concluído', 'in-progress': 'Em Andamento', 'scheduled': 'Agendado', 'cancelled': 'Cancelado' };
      const typeLabels = { 'nursing': 'Enfermagem', 'medical': 'Médico', 'physio': 'Fisioterapia', 'nutrition': 'Nutrição', 'psychology': 'Psicologia' };
      const rows = schedules.map(s => {
        const patient = Store.getById('patients', s.patientId);
        const prof = Store.getById('professionals', s.professionalId);
        return [
          s.date || '-',
          s.time || '-',
          patient?.name || '-',
          prof?.name || '-',
          typeLabels[s.type] || s.type || '-',
          s.title || '-',
          statusLabels[s.status] || s.status || '-'
        ];
      });

      PdfExport.generate({
        title: 'Relatório de Atendimentos',
        subtitle: `${schedules.length} atendimentos registrados — Gerado em ${new Date().toLocaleString('pt-BR')}`,
        filename: `relatorio_atendimentos_${today}`,
        sections: [{
          type: 'table',
          title: 'Lista de Atendimentos',
          headers: ['Data', 'Hora', 'Paciente', 'Profissional', 'Tipo', 'Título', 'Status'],
          rows: rows
        }]
      });

    } else if (type === 'financial') {
      const billing = Store.get('billing') || {};
      const profit = (billing.monthlyRevenue || 0) - (billing.monthlyCosts || 0);
      const breakdown = billing.costBreakdown || [];

      const sections = [
        {
          type: 'info',
          title: 'Resumo Financeiro',
          pairs: [
            { label: 'Receita Mensal', value: `R$ ${formatCurrency(billing.monthlyRevenue)}` },
            { label: 'Custos Mensais', value: `R$ ${formatCurrency(billing.monthlyCosts)}` },
            { label: 'Resultado', value: `R$ ${formatCurrency(profit)}` },
            { label: 'Faturas Pendentes', value: String(billing.pendingInvoices || 0) },
            { label: 'Faturas Concluídas', value: String(billing.completedInvoices || 0) }
          ]
        }
      ];

      if (breakdown.length > 0) {
        sections.push({
          type: 'table',
          title: 'Composição de Custos',
          headers: ['Categoria', 'Valor (R$)'],
          rows: breakdown.map(item => [item.category, `R$ ${formatCurrency(item.amount)}`])
        });
      }

      PdfExport.generate({
        title: 'Relatório Financeiro',
        subtitle: `Gerado em ${new Date().toLocaleString('pt-BR')}`,
        filename: `relatorio_financeiro_${today}`,
        sections: sections
      });

    } else if (type === 'patients') {
      const patients = Store.getAll('patients');
      if (!patients.length) {
        Notifications.show('Exportação', 'Nenhum paciente cadastrado para exportar', 'warning');
        return;
      }
      const statusLabels = { 'active': 'Ativo', 'palliative': 'Paliativo', 'discharged': 'Alta' };
      const rows = patients.map(p => [
        p.name || '-',
        String(p.age || '-'),
        p.gender === 'M' ? 'Masc' : 'Fem',
        p.diagnosis || '-',
        statusLabels[p.status] || p.status || '-',
        p.healthPlan || 'Particular',
        p.admissionDate || '-'
      ]);

      PdfExport.generate({
        title: 'Relatório de Pacientes',
        subtitle: `${patients.length} pacientes cadastrados — Gerado em ${new Date().toLocaleString('pt-BR')}`,
        filename: `relatorio_pacientes_${today}`,
        sections: [{
          type: 'table',
          title: 'Lista de Pacientes',
          headers: ['Nome', 'Idade', 'Sexo', 'Diagnóstico', 'Status', 'Convênio', 'Admissão'],
          rows: rows
        }]
      });
    }

    const typeLabels = { 'attendance': 'atendimentos', 'financial': 'financeiro', 'patients': 'pacientes' };
    Store.addAuditLog('Relatório exportado', { details: `PDF — ${typeLabels[type] || type}` });
    Notifications.show('Exportação', `Relatório PDF de ${typeLabels[type] || type} baixado com sucesso`, 'success');
  }

  function showAddProfessional() {
    Modal.show({
      title: 'Cadastrar Novo Profissional',
      content: `
        <form onsubmit="AdminPage.handleAddProfessional(event)">
          <div class="form-group">
            <label class="form-label">Nome Completo *</label>
            <input class="form-input" name="name" required placeholder="Ex: João Vítor Santos">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Função / Cargo *</label>
              <select class="form-input" name="role" required>
                <option value="Médico">Médico(a)</option>
                <option value="Enfermeira">Enfermeiro(a)</option>
                <option value="Técnico de Enfermagem">Técnico(a) de Enfermagem</option>
                <option value="Fisioterapeuta">Fisioterapeuta</option>
                <option value="Psicóloga">Psicólogo(a)</option>
                <option value="Nutricionista">Nutricionista</option>
                <option value="Fonoaudióloga">Fonoaudiólogo(a)</option>
                <option value="Terapeuta Ocupacional">Terapeuta Ocupacional</option>
                <option value="Cuidador">Cuidador(a)</option>
                <option value="Administrador">Administrador(a)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Especialidade</label>
              <input class="form-input" name="specialty" placeholder="Ex: Cardiologia, UTI Domiciliar">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Registro (CRM/COREN) *</label>
              <input class="form-input" name="coren" required placeholder="Ex: CRM-SP 123456">
            </div>
            <div class="form-group">
              <label class="form-label">Telefone *</label>
              <input class="form-input" name="phone" required placeholder="Ex: (11) 99876-5432">
            </div>
            <div class="form-group">
              <label class="form-label">Data de Nascimento *</label>
              <input class="form-input" name="birthDate" type="date" required>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full" style="margin-top: var(--space-md)">
            <i data-lucide="user-plus"></i> Cadastrar Profissional
          </button>
        </form>
      `
    });
  }

  function handleAddProfessional(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const fullName = data.get('name');
    const birthDate = data.get('birthDate');

    // 1. Gerar username formato: primeiro.segundo em minúsculo (sem acentos)
    const normalized = fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    const words = normalized.split(/\s+/).filter(w => !['de', 'da', 'do', 'dos', 'das', 'e'].includes(w));
    
    let username = 'usuario';
    if (words.length > 0) {
      username = words.length === 1 ? words[0] : `${words[0]}.${words[1]}`;
    }

    // 2. Gerar senha formato: data de nascimento dd/mm/aaaa
    let password = '';
    if (birthDate) {
      const parts = birthDate.split('-'); // aaaa-mm-dd
      if (parts.length === 3) {
        password = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    const professional = {
      name: fullName,
      role: data.get('role'),
      specialty: data.get('specialty') || 'Geral',
      coren: data.get('coren'),
      phone: data.get('phone'),
      birthDate: birthDate,
      username: username,
      password: password,
      status: 'available',
      avatarColor: Math.floor(Math.random() * 8) + 1
    };

    Store.add('professionals', professional);
    Store.addAuditLog('Profissional cadastrado com credenciais', { details: `${professional.name} (User: ${username})` });
    Modal.close();
    switchTab('team');
    Notifications.show('Equipe', `${professional.name} cadastrado com sucesso!`, 'success');
  }

  async function resetDatabase() {
    if (confirm("🚨 ATENÇÃO: Tem certeza que deseja apagar TODOS OS DADOS do Firebase e reiniciar o sistema do zero para produção?\n\nEsta ação apagará todos os pacientes, visitas, insumos e logs atuais, restabelecendo a base limpa de produção. Esta ação é irreversível!")) {
      try {
        await Store.reset(MockData);
        Notifications.show('Manutenção', 'O banco de dados do Firebase e o cache local foram limpos com sucesso!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (e) {
        Notifications.show('Erro', 'Não foi possível limpar os dados: ' + e.message, 'danger');
      }
    }
  }

  function formatCurrency(value) {
    if (!value) return '0';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function afterRender() {
    if (currentTab === 'billing' || currentTab === 'reports') {
      setTimeout(renderAdminCharts, 100);
    }
  }

  return { render, afterRender, switchTab, showAddItem, handleAddItem, exportReport, resetDatabase, showAddProfessional, handleAddProfessional };
})();
