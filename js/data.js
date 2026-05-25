// ============================================
// HOME CARE APP — Production Default Data (Clean)
// Empty structure ready for real database entries
// ============================================

const MockData = {
  // Current logged-in user (null by default to force login)
  currentUser: null,

  // ============================================
  // PATIENTS
  // ============================================
  patients: [
    {
      id: 'pat001',
      name: 'João Paciente',
      status: 'active',
      username: 'joao',
      password: '123',
      role: 'Paciente',
      avatarColor: 2,
      birthDate: '1990-05-10',
      gender: 'M',
      nutritionistId: 'usr002' // Assigned nutritionist
    }
  ],

  // ============================================
  // PROFESSIONALS
  // ============================================
  professionals: [
    { 
      id: 'usr001', 
      name: 'Dr. Administrador', 
      role: 'Administrador', 
      specialty: 'Geral', 
      coren: '-', 
      phone: '-', 
      username: 'admin',
      password: 'ADMIN@123',
      status: 'available', 
      avatarColor: 1 
    },
    { 
      id: 'usr002', 
      name: 'Ana Nutri', 
      role: 'Nutricionista', 
      specialty: 'Nutrição Esportiva e Clínica', 
      coren: 'CRN-3 12345', 
      phone: '(11) 98888-7777', 
      username: 'ana',
      password: '123',
      status: 'available', 
      avatarColor: 3 
    }
  ],

  // ============================================
  // NUTRITIONAL DATA
  // ============================================
  nutritionalPlans: [],
  foodDiaries: [],
  nutritionalAssessments: [],

  // ============================================
  // SCHEDULES / APPOINTMENTS (Empty)
  // ============================================
  schedules: [],

  // ============================================
  // VITAL SIGNS (Empty)
  // ============================================
  vitalSigns: [],

  // ============================================
  // CLINICAL EVOLUTIONS (Empty)
  // ============================================
  evolutions: [],

  // ============================================
  // MESSAGES & CHATS
  // ============================================
  conversations: [
    {
      id: 'conv_central',
      name: 'Central de Mensagens',
      type: 'admin',
      participants: ['usr001', 'usr002', 'pat001'],
      lastMessage: 'Bem-vindo ao sistema!',
      lastMessageTime: new Date().toISOString(),
      unread: 0,
      messages: [
        { 
          id: 'msg_welcome', 
          senderId: 'usr001', 
          text: 'Bem-vindo ao sistema! Este é o canal principal.', 
          timestamp: new Date().toISOString() 
        }
      ]
    }
  ],

  // ============================================
  // INVENTORY / MATERIALS (Empty)
  // ============================================
  inventory: [],

  // ============================================
  // AUDIT LOG (Empty)
  // ============================================
  auditLog: [],

  // ============================================
  // BILLING / COSTS (Reset)
  // ============================================
  billing: {
    monthlyRevenue: 0,
    monthlyCosts: 0,
    pendingInvoices: 0,
    completedInvoices: 0,
    costBreakdown: []
  },

  // ============================================
  // ALERTS (Empty)
  // ============================================
  alerts: [],

  // ============================================
  // SETTINGS (Default)
  // ============================================
  settings: {
    notifications: true,
    autoAlerts: true,
    theme: 'dark'
  }
};

// Export for modules
if (typeof module !== 'undefined') module.exports = MockData;
