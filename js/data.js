// ============================================
// HOME CARE APP — Production Default Data (Clean)
// Empty structure ready for real database entries
// ============================================

const MockData = {
  // Current logged-in user (null by default to force login)
  currentUser: null,

  // ============================================
  // PATIENTS (Empty)
  // ============================================
  patients: [],

  // ============================================
  // PROFESSIONALS (Only default admin)
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
    }
  ],

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
  // MESSAGES & CHATS (Initial Welcome Conversation)
  // ============================================
  conversations: [
    {
      id: 'conv_central',
      name: 'Central de Mensagens',
      type: 'admin',
      participants: ['usr001'],
      lastMessage: 'Bem-vindo ao sistema de Home Care!',
      lastMessageTime: new Date().toISOString(),
      unread: 0,
      messages: [
        { 
          id: 'msg_welcome', 
          senderId: 'usr001', 
          text: 'Bem-vindo ao sistema de Home Care! Este é o canal de comunicação corporativa do sistema. Adicione profissionais para criar novas conversas.', 
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
