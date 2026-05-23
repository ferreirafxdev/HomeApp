// ============================================
// HOME CARE APP — Toast Notifications
// ============================================

const Notifications = (() => {
  let container = null;

  function init() {
    if (!document.getElementById('toastContainer')) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.id = 'toastContainer';
      document.body.appendChild(container);
    } else {
      container = document.getElementById('toastContainer');
    }
  }

  function show(title, message, type = 'info', duration = 4000) {
    if (!container) init();

    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i data-lucide="${icons[type] || 'info'}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-dismiss" onclick="this.parentElement.remove()">
        <i data-lucide="x" style="width:16px;height:16px"></i>
      </button>
      <div class="toast-progress" style="width:100%"></div>
    `;

    container.appendChild(toast);

    // Initialize icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Progress animation
    const progress = toast.querySelector('.toast-progress');
    if (progress) {
      progress.style.transition = `width ${duration}ms linear`;
      requestAnimationFrame(() => {
        progress.style.width = '0%';
      });
    }

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'fadeOut 300ms ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  }

  return { init, show };
})();
