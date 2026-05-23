// ============================================
// HOME CARE APP — Modal Component
// Mobile: Bottom Sheet | Desktop: Center Modal
// ============================================

const Modal = (() => {
  let activeModal = null;

  function show(options = {}) {
    const {
      title = '',
      content = '',
      footer = '',
      size = 'default', // 'small', 'default', 'large'
      onClose = null
    } = options;

    // Remove existing modal
    close();

    const sizeClass = size === 'large' ? 'modal-large' : size === 'small' ? 'modal-small' : '';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'activeModal';
    overlay.innerHTML = `
      <div class="modal-content ${sizeClass}" onclick="event.stopPropagation()">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" onclick="Modal.close()" aria-label="Fechar">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body" id="modalBody">
          ${content}
        </div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.body.appendChild(overlay);
    activeModal = { overlay, onClose };

    // Trigger animation
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    // Init icons in modal
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Escape key to close
    document.addEventListener('keydown', handleEscape);

    return overlay;
  }

  function close() {
    const overlay = document.getElementById('activeModal');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
    if (activeModal?.onClose) {
      activeModal.onClose();
    }
    activeModal = null;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscape);
  }

  function handleEscape(e) {
    if (e.key === 'Escape') close();
  }

  function confirm(options = {}) {
    const {
      title = 'Confirmar',
      message = 'Deseja continuar?',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      type = 'primary', // 'primary', 'danger', 'warning'
      onConfirm = () => {},
      onCancel = () => {}
    } = options;

    show({
      title,
      content: `<p style="color: var(--text-secondary)">${message}</p>`,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">
          ${cancelText}
        </button>
        <button class="btn btn-${type}" onclick="Modal._handleConfirm()" id="modalConfirmBtn">
          ${confirmText}
        </button>
      `,
      size: 'small',
      onClose: onCancel
    });

    Modal._confirmCallback = onConfirm;
  }

  function _handleConfirm() {
    if (Modal._confirmCallback) {
      Modal._confirmCallback();
    }
    close();
  }

  // Update modal body content
  function updateBody(html) {
    const body = document.getElementById('modalBody');
    if (body) {
      body.innerHTML = html;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  return { show, close, confirm, _handleConfirm, updateBody };
})();
