/**
 * Sistema de modales de confirmación
 * Uso: await confirmAction('Eliminar', '¿Estás seguro?', onConfirm)
 */

/**
 * Muestra un modal de confirmación
 * @param {String} title - Título del modal
 * @param {String} message - Mensaje confirmación
 * @param {Function} onConfirm - Callback si se confirma
 * @param {Function} onCancel - Callback si se cancela
 * @returns {Promise} Resolves cuando se cierra
 */
function confirmAction(title, message, onConfirm = null, onCancel = null) {
  return new Promise((resolve) => {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl p-6 w-96 animate-in';
    modal.innerHTML = `
      <h2 class="text-xl font-bold text-slate-800 mb-3">${title}</h2>
      <p class="text-slate-600 mb-6">${message}</p>
      <div class="flex gap-3 justify-end">
        <button id="cancelBtn" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition">
          Cancelar
        </button>
        <button id="confirmBtn" class="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition">
          Confirmar
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Manejadores
    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');

    const close = () => {
      overlay.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => overlay.remove(), 300);
    };

    confirmBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      close();
      resolve(true);
    });

    cancelBtn.addEventListener('click', () => {
      if (onCancel) onCancel();
      close();
      resolve(false);
    });

    // Cerrar con tecla ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleEscape);
        if (onCancel) onCancel();
        close();
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

export { confirmAction };
