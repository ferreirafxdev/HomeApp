// ============================================
// HOME CARE APP — Messages Page
// Chat interface with conversations
// ============================================

const MessagesPage = (() => {
  let activeConversation = null;

  function render() {
    const conversations = Store.getAll('conversations');
    if (!activeConversation && conversations.length) activeConversation = conversations[0].id;

    return `
      <div class="page-enter">
        <div class="page-header" style="margin-bottom:var(--space-md)">
          <div>
            <h1 class="page-title">Mensagens</h1>
            <p class="page-subtitle">Comunicação integrada</p>
          </div>
        </div>

        <div class="chat-layout" id="chatLayout">
          <!-- Conversations Sidebar -->
          <div class="chat-sidebar" id="chatSidebar">
            <div class="chat-sidebar-header">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm);width:100%">
                <span style="font-weight:600;font-size:var(--font-size-md)">Canais</span>
                <button class="btn btn-primary btn-xs" onclick="MessagesPage.showCreateTeamChat()" style="padding: 6px 10px; font-size: 11px; display:flex; align-items:center; gap: 4px; border-radius: 4px">
                  <i data-lucide="user-plus" style="width:12px;height:12px"></i> Criar Equipe
                </button>
              </div>
              <div class="search-bar">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Buscar conversa..." oninput="MessagesPage.searchConversations(this.value)">
              </div>
            </div>
            <div id="conversationList">
              ${renderConversationList(conversations)}
            </div>
          </div>

          <!-- Chat Main -->
          <div class="chat-main" id="chatMain">
            ${activeConversation ? renderChat() : '<div class="empty-state h-full"><i data-lucide="message-circle"></i><h3>Selecione uma conversa</h3></div>'}
          </div>
        </div>
      </div>
    `;
  }

  function renderConversationList(conversations) {
    return conversations.map(conv => {
      const isActive = conv.id === activeConversation;
      const typeIcons = { team: '👥', family: '👨‍👩‍👧', admin: '🏢', urgent: '🚨' };

      return `
        <div class="chat-contact ${isActive ? 'active' : ''}" onclick="MessagesPage.openConversation('${conv.id}')" data-conv="${conv.id}">
          <div class="avatar avatar-sm avatar-${conv.type === 'urgent' ? '2' : conv.type === 'family' ? '4' : conv.type === 'admin' ? '6' : '3'}">
            ${typeIcons[conv.type] || '💬'}
          </div>
          <div class="chat-contact-info">
            <div class="chat-contact-name">${conv.name}</div>
            <div class="chat-contact-preview">${conv.lastMessage || ''}</div>
          </div>
          <div class="chat-contact-meta">
            <div class="chat-contact-time">${formatTime(conv.lastMessageTime)}</div>
            ${conv.unread > 0 ? `<div class="chat-contact-unread">${conv.unread}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderChat() {
    const conv = Store.getAll('conversations').find(c => c.id === activeConversation);
    if (!conv) return '';

    const currentUserId = Store.get('currentUser')?.id || 'usr001';

    return `
      <div class="chat-header">
        <button class="btn btn-ghost btn-icon" onclick="MessagesPage.backToList()" style="display:none" id="chatBackBtn">
          <i data-lucide="arrow-left"></i>
        </button>
        <div style="flex:1">
          <div style="font-weight:600">${conv.name}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-secondary)">${conv.participants?.length || 0} participantes</div>
        </div>
        ${conv.type === 'urgent' ? '<span class="badge badge-danger">Urgente</span>' : ''}
      </div>
      <div class="chat-messages" id="chatMessages">
        ${(conv.messages || []).map(msg => {
          const isSent = msg.senderId === 'prof001' || msg.senderId === currentUserId;
          const sender = Store.getById('professionals', msg.senderId);
          const senderName = sender?.name || (msg.senderId.startsWith('family') ? 'Familiar' : msg.senderId.startsWith('admin') ? 'Central' : 'Usuário');
          return `
            <div class="chat-message ${isSent ? 'sent' : ''} ${msg.urgent ? 'urgent' : ''}">
              ${!isSent ? `<div class="avatar avatar-sm avatar-${sender?.avatarColor || 3}">${senderName[0]}</div>` : ''}
              <div>
                ${!isSent ? `<div style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:2px">${senderName}</div>` : ''}
                <div class="chat-bubble">${msg.text}</div>
                <div class="chat-bubble-time">${formatTime(msg.timestamp)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="chat-input-area">
        <textarea class="chat-input" id="chatInput" placeholder="Digite sua mensagem..." rows="1"
                  onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();MessagesPage.sendMessage()}"></textarea>
        <button class="chat-send-btn" onclick="MessagesPage.sendMessage()" id="sendBtn">
          <i data-lucide="send" style="width:18px;height:18px"></i>
        </button>
      </div>
    `;
  }

  function openConversation(convId) {
    activeConversation = convId;

    // Mark as read
    const conv = Store.getAll('conversations').find(c => c.id === convId);
    if (conv && conv.unread > 0) {
      conv.unread = 0;
      Store.set('conversations', Store.getAll('conversations'));
      updateBadges();
    }

    // Update UI
    document.querySelectorAll('.chat-contact').forEach(c => {
      c.classList.toggle('active', c.dataset.conv === convId);
    });

    const chatMain = document.getElementById('chatMain');
    if (chatMain) {
      chatMain.innerHTML = renderChat();
      if (typeof lucide !== 'undefined') lucide.createIcons();
      scrollToBottom();

      // Show back button on mobile
      if (window.innerWidth < 768) {
        const backBtn = document.getElementById('chatBackBtn');
        if (backBtn) backBtn.style.display = 'flex';
        document.getElementById('chatSidebar').style.display = 'none';
      }
    }
  }

  function backToList() {
    if (window.innerWidth < 768) {
      document.getElementById('chatSidebar').style.display = '';
      const chatMain = document.getElementById('chatMain');
      if (chatMain) {
        chatMain.innerHTML = '<div class="empty-state h-full"><i data-lucide="message-circle"></i><h3>Selecione uma conversa</h3></div>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }

  function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const conversations = Store.getAll('conversations');
    const conv = conversations.find(c => c.id === activeConversation);
    if (!conv) return;

    const message = {
      id: 'msg' + Date.now(),
      senderId: Store.get('currentUser')?.id || 'prof001',
      text,
      timestamp: new Date().toISOString()
    };

    if (!conv.messages) conv.messages = [];
    conv.messages.push(message);
    conv.lastMessage = text;
    conv.lastMessageTime = message.timestamp;
    Store.set('conversations', conversations);

    input.value = '';
    input.style.height = 'auto';

    // Re-render chat
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      const currentUserId = Store.get('currentUser')?.id || 'usr001';
      const isSent = true;
      const msgHtml = `
        <div class="chat-message sent" style="animation:fadeInUp 0.3s ease">
          <div>
            <div class="chat-bubble">${text}</div>
            <div class="chat-bubble-time">agora</div>
          </div>
        </div>
      `;
      chatMessages.insertAdjacentHTML('beforeend', msgHtml);
      scrollToBottom();
    }

    // Simulate response after 2-3 seconds
    if (conv.type !== 'urgent') {
      setTimeout(() => simulateResponse(conv), 2000 + Math.random() * 2000);
    }
  }

  function simulateResponse(conv) {
    const responses = [
      'Entendido, obrigado pela informação!',
      'Vou verificar e retorno em breve.',
      'Ok, anotado. Alguma orientação adicional?',
      'Registro feito. Acompanhando evolução.',
      'Certo, vou providenciar.',
      'Obrigado pelo update!'
    ];
    const text = responses[Math.floor(Math.random() * responses.length)];
    const message = {
      id: 'msg' + Date.now(),
      senderId: conv.participants?.[0] || 'prof003',
      text,
      timestamp: new Date().toISOString()
    };

    const conversations = Store.getAll('conversations');
    const c = conversations.find(cc => cc.id === conv.id);
    if (c) {
      c.messages.push(message);
      c.lastMessage = text;
      c.lastMessageTime = message.timestamp;
      Store.set('conversations', conversations);
    }

    if (activeConversation === conv.id) {
      const chatMessages = document.getElementById('chatMessages');
      if (chatMessages) {
        const sender = Store.getById('professionals', message.senderId);
        const senderName = sender?.name || 'Profissional';
        chatMessages.insertAdjacentHTML('beforeend', `
          <div class="chat-message" style="animation:fadeInUp 0.3s ease">
            <div class="avatar avatar-sm avatar-${sender?.avatarColor || 3}">${senderName[0]}</div>
            <div>
              <div style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:2px">${senderName}</div>
              <div class="chat-bubble">${text}</div>
              <div class="chat-bubble-time">agora</div>
            </div>
          </div>
        `);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        scrollToBottom();
      }
    }
  }

  function scrollToBottom() {
    const messages = document.getElementById('chatMessages');
    if (messages) {
      setTimeout(() => messages.scrollTop = messages.scrollHeight, 50);
    }
  }

  function searchConversations(query) {
    const conversations = Store.getAll('conversations');
    const filtered = query ?
      conversations.filter(c => c.name.toLowerCase().includes(query.toLowerCase())) :
      conversations;
    const list = document.getElementById('conversationList');
    if (list) list.innerHTML = renderConversationList(filtered);
  }

  function updateBadges() {
    const conversations = Store.getAll('conversations');
    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
    Sidebar.updateBadge('messages', totalUnread);
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);
    if (diffHours < 24) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (diffHours < 48) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function showCreateTeamChat() {
    const professionals = Store.getAll('professionals');
    
    const profCheckboxes = professionals.map(p => `
      <label class="form-checkbox-label" style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-xs);cursor:pointer;font-size:var(--font-size-sm);color:var(--text-primary)">
        <input type="checkbox" name="participants" value="${p.id}" style="width:16px;height:16px;accent-color:var(--primary)">
        <span>${p.name} (${p.role} — ${p.specialty})</span>
      </label>
    `).join('');

    Modal.show({
      title: 'Criar Nova Equipe de Mensagens',
      content: `
        <form onsubmit="MessagesPage.handleCreateTeamChat(event)">
          <div class="form-group">
            <label class="form-label">Nome da Equipe / Grupo *</label>
            <input class="form-input" name="name" required placeholder="Ex: Equipe de Apoio Sr. José">
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de Grupo *</label>
            <select class="form-input" name="type" required>
              <option value="team">👥 Equipe Assistencial</option>
              <option value="family">👨‍👩‍👧 Família e Responsáveis</option>
              <option value="admin">🏢 Administrativo</option>
              <option value="urgent">🚨 Urgências e Alertas</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="margin-bottom:var(--space-xs)">Selecionar Membros da Equipe *</label>
            <div style="max-height: 180px; overflow-y: auto; background: var(--bg-tertiary); padding: var(--space-sm); border-radius: 6px; border: 1px solid var(--border)">
              ${profCheckboxes.length ? profCheckboxes : '<p style="font-size:var(--font-size-sm);color:var(--text-tertiary)">Nenhum profissional cadastrado na equipe. Cadastre profissionais na aba Administrativo.</p>'}
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-full" style="margin-top: var(--space-md)">
            <i data-lucide="message-square"></i> Criar Canal de Equipe
          </button>
        </form>
      `
    });
  }

  function handleCreateTeamChat(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const name = data.get('name');
    const type = data.get('type');
    
    const checkboxes = e.target.querySelectorAll('input[name="participants"]:checked');
    const participants = Array.from(checkboxes).map(cb => cb.value);
    
    const currentUserId = Store.get('currentUser')?.id || 'usr001';
    if (!participants.includes(currentUserId)) {
      participants.push(currentUserId);
    }

    if (participants.length < 2 && Store.getAll('professionals').length > 1) {
      alert('Por favor, selecione pelo menos um outro profissional para a equipe!');
      return;
    }

    const newChat = {
      id: 'conv_' + Date.now(),
      name,
      type,
      participants,
      lastMessage: 'Grupo de mensagens criado. Iniciando comunicação...',
      lastMessageTime: new Date().toISOString(),
      unread: 0,
      messages: [
        {
          id: 'msg_init_' + Date.now(),
          senderId: currentUserId,
          text: `Equipe "${name}" criada. Comunicação iniciada.`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const conversations = Store.getAll('conversations') || [];
    conversations.unshift(newChat);
    Store.set('conversations', conversations);

    Store.addAuditLog('Equipe de mensagens criada', { details: `${name} (${type})` });
    Modal.close();
    
    activeConversation = newChat.id;
    
    const appContent = document.getElementById('appContent');
    if (appContent) {
      appContent.innerHTML = render();
      if (typeof lucide !== 'undefined') lucide.createIcons();
      scrollToBottom();
    }
    
    Notifications.show('Mensagens', `Equipe "${name}" criada com sucesso!`, 'success');
  }

  function afterRender() {
    scrollToBottom();
    updateBadges();
    if (window.innerWidth < 768) {
      const chatMain = document.getElementById('chatMain');
      if (chatMain && !activeConversation) {
        chatMain.innerHTML = '<div class="empty-state h-full"><i data-lucide="message-circle"></i><h3>Selecione uma conversa</h3></div>';
      }
    }
  }

  return { render, afterRender, openConversation, backToList, sendMessage, searchConversations, showCreateTeamChat, handleCreateTeamChat };
})();
