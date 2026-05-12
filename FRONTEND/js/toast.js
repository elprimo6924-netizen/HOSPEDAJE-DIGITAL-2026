// ============================================
// toast.js — DEPRECADO
// ✏️ MODIFICADO: Este archivo ahora redirige al sistema
// unificado de notificaciones en notifications.js
// Mantenido por compatibilidad con imports existentes.
// Bug #1 fix: eliminado export { showToast }
// ============================================

// Si showToast ya fue definido por notifications.js, no hacer nada.
// Si no, definir una versión standalone como fallback.
if (typeof window.showToast !== 'function') {
    let toastContainer = null;

    function showToast(message, type = 'info', duration = 3000) {
        // Intentar usar el sistema unificado
        if (typeof showNotification === 'function') {
            return showNotification({ type, message, duration });
        }

        // Fallback mínimo si notifications.js no está cargado
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        const colors = { success: '#16a34a', error: '#dc2626', info: '#2563eb', warning: '#ca8a04' };
        const color = colors[type] || colors.info;

        toast.style.cssText = `background:white;border-left:4px solid ${color};padding:12px 16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:sans-serif;font-size:14px;color:#1f2937;min-width:280px;animation:fadeIn 0.3s ease-out;`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ✏️ MODIFICADO: Exponer globalmente sin export (Bug #1)
    window.showToast = showToast;
}
