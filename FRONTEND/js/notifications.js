// ============================================
// SISTEMA DE NOTIFICACIONES UNIFICADO — v2.0
// ✏️ MODIFICADO: Reescritura completa con Tailwind CSS
// Reemplaza notifications.js + toast.js
// ============================================

let notificationContainer = null;
const MAX_NOTIFICATIONS = 4;

// ✏️ MODIFICADO: Inyectar estilos de animación una sola vez
function injectNotificationStyles() {
    if (document.getElementById('notification-anim-styles')) return;
    const style = document.createElement('style');
    style.id = 'notification-anim-styles';
    style.textContent = `
        @keyframes toast-in  { from { opacity:0; transform:translateX(110%); } to { opacity:1; transform:translateX(0); } }
        @keyframes toast-out { from { opacity:1; transform:translateX(0); }   to { opacity:0; transform:translateX(110%); } }
        .toast-enter { animation: toast-in  0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
        .toast-leave { animation: toast-out 0.28s ease-in both; }
    `;
    document.head.appendChild(style);
}

// ✏️ MODIFICADO: Inicializar contenedor con clases Tailwind
function initNotifications() {
    if (!notificationContainer) {
        injectNotificationStyles();
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = 'position:fixed; top:20px; right:20px; z-index:10000; display:flex; flex-direction:column; gap:12px; pointer-events:none;';
        document.body.appendChild(notificationContainer);
    }
}

// ✏️ MODIFICADO: Configuración de variantes con Tailwind
const notificationConfigs = {
    success: {
        wrapper: 'bg-white border-l-4 border-green-500 shadow-lg shadow-green-100',
        icon: 'fa-circle-check text-green-500',
        title_color: 'text-green-700',
        bar: 'bg-green-500'
    },
    error: {
        wrapper: 'bg-white border-l-4 border-red-500 shadow-lg shadow-red-100',
        icon: 'fa-circle-xmark text-red-500',
        title_color: 'text-red-700',
        bar: 'bg-red-500'
    },
    warning: {
        wrapper: 'bg-white border-l-4 border-amber-500 shadow-lg shadow-amber-100',
        icon: 'fa-triangle-exclamation text-amber-500',
        title_color: 'text-amber-700',
        bar: 'bg-amber-500'
    },
    info: {
        wrapper: 'bg-white border-l-4 border-blue-500 shadow-lg shadow-blue-100',
        icon: 'fa-circle-info text-blue-500',
        title_color: 'text-blue-700',
        bar: 'bg-blue-500'
    }
};

// ✏️ MODIFICADO: Función principal de notificación con barra de progreso
function showNotification(options) {
    initNotifications();

    const {
        type = 'info',
        title = '',
        message = '',
        duration = 5000,
        closable = true
    } = options;

    const cfg = notificationConfigs[type] || notificationConfigs.info;

    // Limitar a MAX_NOTIFICATIONS
    while (notificationContainer.children.length >= MAX_NOTIFICATIONS) {
        const oldest = notificationContainer.firstChild;
        if (oldest) {
            oldest.remove();
        }
    }

    const notification = document.createElement('div');
    notification.className = 'toast-enter';
    notification.style.pointerEvents = 'auto';

    notification.innerHTML = `
        <div class="relative overflow-hidden rounded-xl ${cfg.wrapper} p-4 pr-10 min-w-[320px] max-w-[420px]">
            <div class="flex items-start gap-3">
                <i class="fa-solid ${cfg.icon} text-xl mt-0.5 shrink-0"></i>
                <div class="flex-1 min-w-0">
                    ${title ? `<p class="font-bold text-sm ${cfg.title_color}">${title}</p>` : ''}
                    <p class="text-slate-600 text-sm leading-snug mt-0.5">${message}</p>
                </div>
            </div>
            ${closable ? `
                <button class="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none cursor-pointer" style="background:none;border:none;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            ` : ''}
            ${duration > 0 ? `
                <div class="absolute bottom-0 left-0 h-1 ${cfg.bar} progress-bar rounded-b-xl"
                     style="width:100%; transition: width ${duration}ms linear;"></div>
            ` : ''}
        </div>
    `;

    notificationContainer.appendChild(notification);

    // Cerrar al hacer clic en X
    const closeBtn = notification.querySelector('button');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeNotification(notification));
    }

    // Iniciar barra de progreso al siguiente frame
    if (duration > 0) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const bar = notification.querySelector('.progress-bar');
                if (bar) bar.style.width = '0%';
            });
        });

        // Auto-cerrar
        setTimeout(() => closeNotification(notification), duration);
    }

    return notification;
}

// ✏️ MODIFICADO: Animación de cierre suave
function closeNotification(notification) {
    if (!notification || !notification.parentNode) return;
    notification.classList.remove('toast-enter');
    notification.classList.add('toast-leave');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 280);
}

// ✏️ MODIFICADO: Funciones de conveniencia con las mismas firmas
function showSuccess(message, title = 'Éxito') {
    return showNotification({
        type: 'success',
        title: title,
        message: message
    });
}

function showError(message, title = 'Error') {
    return showNotification({
        type: 'error',
        title: title,
        message: message,
        duration: 7000
    });
}

function showWarning(message, title = 'Advertencia') {
    return showNotification({
        type: 'warning',
        title: title,
        message: message
    });
}

function showInfo(message, title = 'Información') {
    return showNotification({
        type: 'info',
        title: title,
        message: message
    });
}

// ✏️ MODIFICADO: showToast redirige al sistema unificado (Bug #1 y #2)
function showToast(message, type = 'info', duration = 3000) {
    return showNotification({ type, message, duration });
}

// ✏️ MODIFICADO: Exponer globalmente para compatibilidad
window.showToast = showToast;
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;

// Confirmación con callback (mantiene compatibilidad)
function showConfirm(message, onConfirm, onCancel, title = 'Confirmar') {
    // Usa el nuevo sistema de confirmarAccion si está disponible
    if (typeof confirmarAccion === 'function') {
        confirmarAccion({
            titulo: title,
            mensaje: message,
            textoConfirmar: 'Confirmar',
            onConfirmar: () => { if (onConfirm) onConfirm(); },
            tipo: 'warning'
        });
        return;
    }

    // Fallback: notificación inline con botones
    initNotifications();

    const notification = document.createElement('div');
    notification.className = 'toast-enter';
    notification.style.pointerEvents = 'auto';

    notification.innerHTML = `
        <div class="relative overflow-hidden rounded-xl bg-white border-l-4 border-amber-500 shadow-lg shadow-amber-100 p-4 min-w-[320px] max-w-[420px]">
            <div class="flex items-start gap-3">
                <i class="fa-solid fa-circle-question text-amber-500 text-xl mt-0.5 shrink-0"></i>
                <div class="flex-1 min-w-0">
                    ${title ? `<p class="font-bold text-sm text-amber-700">${title}</p>` : ''}
                    <p class="text-slate-600 text-sm leading-snug mt-0.5">${message}</p>
                    <div class="flex gap-2 mt-3">
                        <button class="confirm-yes px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors cursor-pointer">Confirmar</button>
                        <button class="confirm-no px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    notificationContainer.appendChild(notification);

    notification.querySelector('.confirm-yes').addEventListener('click', () => {
        closeNotification(notification);
        if (onConfirm) onConfirm();
    });

    notification.querySelector('.confirm-no').addEventListener('click', () => {
        closeNotification(notification);
        if (onCancel) onCancel();
    });

    return notification;
}

// Limpiar todas las notificaciones
function clearAllNotifications() {
    if (notificationContainer) {
        notificationContainer.innerHTML = '';
    }
}

// Exportar funciones (para Node.js si se usa en tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNotifications,
        showNotification,
        closeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showToast,
        showConfirm,
        clearAllNotifications
    };
}
