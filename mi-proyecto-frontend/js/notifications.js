// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

// Contenedor de notificaciones
let notificationContainer = null;

// Inicializar el contenedor de notificaciones
function initNotifications() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Agregar estilos si no existen
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 340px;
                    width: 100%;
                }

                .notification {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 14px 16px;
                    border-radius: 10px;
                    background: #1e2229;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
                    animation: toastIn 0.3s cubic-bezier(.4,0,.2,1);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #f1f5f9;
                    min-width: 280px;
                }

                .notification-icon {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 15px;
                    font-weight: 700;
                    margin-top: 1px;
                }

                .notification.success .notification-icon { background: #22c55e; color: #fff; }
                .notification.error   .notification-icon { background: #ef4444; color: #fff; }
                .notification.warning .notification-icon { background: #f59e0b; color: #fff; }
                .notification.info    .notification-icon { background: #3b82f6; color: #fff; }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-title {
                    font-weight: 600;
                    font-size: 14px;
                    color: #f8fafc;
                    margin-bottom: 2px;
                    line-height: 1.3;
                }

                .notification-message {
                    font-size: 13px;
                    color: #94a3b8;
                    line-height: 1.4;
                }

                .notification-close {
                    background: none;
                    border: none;
                    color: #64748b;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                    flex-shrink: 0;
                    transition: color 0.15s;
                    margin-top: 1px;
                }

                .notification-close:hover { color: #f1f5f9; }

                @keyframes toastIn {
                    from { transform: translateY(16px) scale(0.97); opacity: 0; }
                    to   { transform: translateY(0)    scale(1);    opacity: 1; }
                }

                @keyframes toastOut {
                    from { transform: translateY(0)    scale(1);    opacity: 1; }
                    to   { transform: translateY(16px) scale(0.97); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }
    }
}

// Mostrar notificación
function showNotification(options) {
    initNotifications();
    
    const {
        type = 'info',
        title = '',
        message = '',
        duration = 5000,
        closable = true
    } = options;
    
    // Iconos según el tipo
    const icons = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'i'
    };
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type]}</span>
        <div class="notification-content">
            ${title ? `<div class="notification-title">${title}</div>` : ''}
            ${message ? `<div class="notification-message">${message}</div>` : ''}
        </div>
        ${closable ? '<button class="notification-close">&times;</button>' : ''}
    `;
    
    // Agregar al contenedor
    notificationContainer.appendChild(notification);
    
    // Configurar cierre
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeNotification(notification));
    }
    
    // Auto-cerrar después del tiempo especificado
    if (duration > 0) {
        setTimeout(() => closeNotification(notification), duration);
    }
    
    return notification;
}

// Cerrar notificación
function closeNotification(notification) {
    notification.style.animation = 'toastOut 0.25s ease-in forwards';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Notificación de éxito
function showSuccess(message, title = 'Éxito') {
    return showNotification({
        type: 'success',
        title: title,
        message: message
    });
}

// Notificación de error
function showError(message, title = 'Error') {
    return showNotification({
        type: 'error',
        title: title,
        message: message,
        duration: 7000
    });
}

// Notificación de advertencia
function showWarning(message, title = 'Advertencia') {
    return showNotification({
        type: 'warning',
        title: title,
        message: message
    });
}

// Notificación informativa
function showInfo(message, title = 'Información') {
    return showNotification({
        type: 'info',
        title: title,
        message: message
    });
}

// Confirmación con callback
function showConfirm(message, onConfirm, onCancel, title = 'Confirmar') {
    initNotifications();
    
    const notification = document.createElement('div');
    notification.className = 'notification warning';
    
    notification.innerHTML = `
        <span class="notification-icon">?</span>
        <div class="notification-content">
            ${title ? `<div class="notification-title">${title}</div>` : ''}
            <div class="notification-message">${message}</div>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button class="confirm-btn" style="padding: 5px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Confirmar</button>
                <button class="cancel-btn" style="padding: 5px 15px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancelar</button>
            </div>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    
    const confirmBtn = notification.querySelector('.confirm-btn');
    const cancelBtn = notification.querySelector('.cancel-btn');
    
    confirmBtn.addEventListener('click', () => {
        closeNotification(notification);
        if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
        closeNotification(notification);
        if (onCancel) onCancel();
    });
    
    return notification;
}

// Confirmación estilizada — devuelve Promise<boolean>
function confirmarAccion(mensaje, titulo = '¿Confirmar acción?') {
    return new Promise((resolve) => {
        // Overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed;inset:0;background:rgba(0,0,0,0.55);
            z-index:20000;display:flex;align-items:center;justify-content:center;
            animation:fadeIn .15s ease;
        `;

        // Card
        const card = document.createElement('div');
        card.style.cssText = `
            background:#1e2229;color:#f1f5f9;border-radius:14px;
            padding:28px 28px 22px;max-width:380px;width:90%;
            box-shadow:0 20px 60px rgba(0,0,0,0.5);
            animation:toastIn .2s cubic-bezier(.4,0,.2,1);
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        `;

        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <span style="width:36px;height:36px;border-radius:50%;background:#f59e0b;
                    display:inline-flex;align-items:center;justify-content:center;
                    font-size:18px;font-weight:700;color:#fff;flex-shrink:0;">!</span>
                <span style="font-weight:700;font-size:15px;color:#f8fafc;">${titulo}</span>
            </div>
            <p style="margin:0 0 22px 48px;font-size:14px;color:#94a3b8;line-height:1.5;">${mensaje}</p>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button id="confirm-cancel-btn" style="
                    padding:9px 20px;border-radius:8px;border:1px solid #334155;
                    background:transparent;color:#94a3b8;font-size:14px;
                    font-weight:600;cursor:pointer;transition:background .15s;">
                    Cancelar
                </button>
                <button id="confirm-ok-btn" style="
                    padding:9px 20px;border-radius:8px;border:none;
                    background:#ef4444;color:#fff;font-size:14px;
                    font-weight:600;cursor:pointer;transition:opacity .15s;">
                    Confirmar
                </button>
            </div>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        const close = (result) => {
            overlay.style.animation = 'fadeOut .15s ease forwards';
            setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 150);
            resolve(result);
        };

        card.querySelector('#confirm-ok-btn').addEventListener('click', () => close(true));
        card.querySelector('#confirm-cancel-btn').addEventListener('click', () => close(false));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', esc); }
        });

        // Animaciones globales (una sola vez)
        if (!document.getElementById('confirm-dialog-styles')) {
            const s = document.createElement('style');
            s.id = 'confirm-dialog-styles';
            s.textContent = `@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes fadeOut{from{opacity:1}to{opacity:0}}`;
            document.head.appendChild(s);
        }
    });
}

// Limpiar todas las notificaciones
function clearAllNotifications() {
    if (notificationContainer) {
        notificationContainer.innerHTML = '';
    }
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNotifications,
        showNotification,
        closeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        clearAllNotifications
    };
}
