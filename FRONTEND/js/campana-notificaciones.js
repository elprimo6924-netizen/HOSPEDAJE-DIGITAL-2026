// ============================================
// CAMPANA DE NOTIFICACIONES — Admin Panel
// ============================================

const CAMPANA_STORAGE_KEY = 'hospedaje_notif_visto';
const CAMPANA_POLL_MS = 30000;

let campanaInterval = null;
let panelAbierto = false;

// ── RUTAS POR TIPO ───────────────────────────
const RUTAS_NOTIFICACIONES = {
    usuario:   'usuarios.html',
    cliente:   'clientes.html',
    reserva:   'reservas.html',
    habitacion:'habitaciones.html',
    paquete:   'paquetes.html',
    servicio:  'servicios.html',
};

function manejarClickNotificacion(tipo, entidadId) {
    if (entidadId) {
        sessionStorage.setItem('notif_entidad_id', String(entidadId));
        sessionStorage.setItem('notif_tipo', tipo);
    }
    cerrarPanelCampana();

    const pagina  = RUTAS_NOTIFICACIONES[tipo] || 'dashboard.html';
    const actual  = window.location.pathname.split('/').pop();
    if (actual === pagina) {
        setTimeout(() => destacarRegistroEnPagina(entidadId, tipo), 50);
        return;
    }
    const href = typeof getModuleHref === 'function'
        ? getModuleHref(pagina)
        : `pages/${pagina}`;
    window.location.href = href;
}

function destacarRegistroEnPagina(entidadId, tipo) {
    if (!entidadId) return;
    const el = document.querySelector(
        `[data-id="${entidadId}"],[data-reserva-id="${entidadId}"],` +
        `[data-cliente-id="${entidadId}"],[data-usuario-id="${entidadId}"]`
    );
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.transition = 'box-shadow 0.3s ease';
    el.style.boxShadow  = '0 0 0 3px rgba(255,106,26,0.7)';
    setTimeout(() => { el.style.boxShadow = ''; }, 3000);
}

// ── UTILIDADES ──────────────────────────────

function getCampanaVisto() {
    try {
        return JSON.parse(localStorage.getItem(CAMPANA_STORAGE_KEY)) || {
            usuarios: 0, clientes: 0, reservas: 0, timestamp: 0
        };
    } catch { return { usuarios: 0, clientes: 0, reservas: 0, timestamp: 0 }; }
}

function setCampanaVisto(datos) {
    localStorage.setItem(CAMPANA_STORAGE_KEY, JSON.stringify({
        ...datos,
        timestamp: Date.now()
    }));
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const d = new Date(fechaStr);
    if (isNaN(d)) return '';
    const diffMs = Date.now() - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH   = Math.floor(diffMin / 60);
    const diffD   = Math.floor(diffH / 24);
    if (diffMin < 1)  return 'hace un momento';
    if (diffMin < 60) return `hace ${diffMin} min`;
    if (diffH < 24)   return `hace ${diffH}h`;
    if (diffD < 7)    return `hace ${diffD} día${diffD > 1 ? 's' : ''}`;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

async function fetchConToken(url) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ── DETECTAR ROL ─────────────────────────────

function getRolActual() {
    try {
        const session = window.getStoredSession ? window.getStoredSession() : null;
        if (session?.usuario?.IDRol) return Number(session.usuario.IDRol);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return Number(user.IDRol || 0);
    } catch { return 0; }
}

// ── DATOS SEGÚN ROL ──────────────────────────

async function obtenerDatosNotificaciones() {
    const base    = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : '/api';
    const esAdmin = getRolActual() === 1;

    if (esAdmin) {
        const [usuarios, clientes, reservas] = await Promise.allSettled([
            fetchConToken(`${base}/usuarios`),
            fetchConToken(`${base}/clientes`),
            fetchConToken(`${base}/reservas`)
        ]);
        return {
            esAdmin: true,
            usuarios: usuarios.status === 'fulfilled'
                ? (Array.isArray(usuarios.value) ? usuarios.value : []) : [],
            clientes: clientes.status === 'fulfilled'
                ? (Array.isArray(clientes.value) ? clientes.value : []) : [],
            reservas: reservas.status === 'fulfilled'
                ? (Array.isArray(reservas.value) ? reservas.value : []) : [],
        };
    } else {
        const [reservas] = await Promise.allSettled([
            fetchConToken(`${base}/reservas/mis-reservas`)
        ]);
        return {
            esAdmin: false,
            usuarios: [],
            clientes: [],
            reservas: reservas.status === 'fulfilled'
                ? (Array.isArray(reservas.value) ? reservas.value : []) : [],
        };
    }
}

// ── RENDERIZAR ITEMS EN EL PANEL ─────────────

function buildItemHTML(tipo, item) {
    const configs = {
        usuario: {
            icono: 'fa-user-plus',
            color: 'text-blue-400',
            bg:    'bg-blue-400/10',
            label: 'Nuevo usuario',
            nombre: item.NombreUsuario || item.Email || 'Sin nombre'
        },
        cliente: {
            icono: 'fa-user-check',
            color: 'text-emerald-400',
            bg:    'bg-emerald-400/10',
            label: 'Nuevo cliente',
            nombre: `${item.Nombre || ''} ${item.Apellido || ''}`.trim() || item.Email || 'Sin nombre'
        },
        reserva: {
            icono: 'fa-calendar-check',
            color: 'text-amber-400',
            bg:    'bg-amber-400/10',
            label: 'Nueva reserva',
            nombre: `Reserva #${item.IdReserva || item.id || '?'}`
        }
    };
    const cfg      = configs[tipo];
    const fecha    = item.createdAt || item.FechaReserva || item.fecha_registro || null;
    const fechaTxt = formatearFecha(fecha);
    const detalle  = fechaTxt ? `${cfg.label} · ${fechaTxt}` : cfg.label;
    const entidadId = item.IDUsuario || item.IDCliente || item.NroDocumento ||
                      item.IDReserva || item.IdReserva || '';

    return `
    <li data-notif-tipo="${tipo}" data-entidad-id="${entidadId}"
        class="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer select-none"
        role="button" tabindex="0">
        <div class="w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5">
            <i class="fa-solid ${cfg.icono} ${cfg.color} text-xs"></i>
        </div>
        <div class="flex-1 min-w-0">
            <p class="text-white/90 text-xs font-semibold m-0 truncate">${cfg.nombre}</p>
            <p class="text-white/40 text-[11px] m-0 mt-0.5">${detalle}</p>
        </div>
    </li>`;
}

// ── HELPER: actualizar badge ──────────────────

function actualizarBadge(badge, cantidad) {
    if (cantidad > 0) {
        badge.textContent = cantidad > 99 ? '99+' : cantidad;
        badge.style.display = 'flex';
        badge.classList.remove('hidden');
        badge.classList.add('animate-bounce');
        setTimeout(() => badge.classList.remove('animate-bounce'), 1500);
    } else {
        badge.style.display = 'none';
        badge.classList.add('hidden');
    }
}

// ── ITEM DE RESERVA PARA CLIENTE ─────────────

function buildItemReservaCliente(r) {
    const estados = {
        'Confirmada': { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icono: 'fa-circle-check' },
        'Pendiente':  { color: 'text-amber-400',   bg: 'bg-amber-400/10',   icono: 'fa-clock' },
        'Cancelada':  { color: 'text-red-400',      bg: 'bg-red-400/10',     icono: 'fa-circle-xmark' },
    };
    const estado  = r.NombreEstadoReserva || r.estado || 'Pendiente';
    const cfg     = estados[estado] || estados['Pendiente'];
    const fecha   = r.FechaInicio || r.FechaReserva || null;
    const fechaTxt = formatearFecha(fecha);
    const detalle  = fechaTxt ? `${estado} · ${fechaTxt}` : estado;
    const paquete = r.Paquetes || r.Servicios || 'Reserva';

    const entidadId = r.IDReserva || r.IdReserva || '';

    return `
    <li data-notif-tipo="reserva" data-entidad-id="${entidadId}"
        class="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer select-none"
        role="button" tabindex="0">
        <div class="w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5">
            <i class="fa-solid ${cfg.icono} ${cfg.color} text-xs"></i>
        </div>
        <div class="flex-1 min-w-0">
            <p class="text-white/90 text-xs font-semibold m-0 truncate">
                Reserva #${entidadId || '?'}
            </p>
            <p class="text-white/50 text-[11px] m-0 mt-0.5 truncate">${paquete}</p>
            <p class="text-white/35 text-[10px] m-0 mt-0.5">
                ${detalle}
            </p>
        </div>
    </li>`;
}

// ── ACTUALIZAR UI DE LA CAMPANA ───────────────

async function actualizarCampana() {
    const badge = document.getElementById('campana-badge');
    const lista = document.getElementById('lista-notificaciones');
    const pie   = document.getElementById('campana-pie');
    if (!badge) return;

    let datos;
    try { datos = await obtenerDatosNotificaciones(); }
    catch (e) { console.warn('[Campana] Error:', e); return; }

    const visto   = getCampanaVisto();
    const esAdmin = datos.esAdmin;

    if (esAdmin) {
        const totalActual = datos.usuarios.length + datos.clientes.length + datos.reservas.length;
        const totalVisto  = visto.usuarios + visto.clientes + visto.reservas;
        const nuevos      = Math.max(0, totalActual - totalVisto);

        actualizarBadge(badge, nuevos);
        if (pie) pie.textContent = `${totalActual} notificaciones en total`;

        if (lista) {
            const items = [
                ...datos.usuarios.slice(-3).reverse().map(u => buildItemHTML('usuario', u)),
                ...datos.clientes.slice(-3).reverse().map(c => buildItemHTML('cliente', c)),
                ...datos.reservas.slice(-4).reverse().map(r => buildItemHTML('reserva', r)),
            ];
            lista.innerHTML = items.length
                ? items.join('')
                : '<li class="px-4 py-8 text-center text-white/40 text-sm">Sin notificaciones</li>';
        }
    } else {
        const totalReservas  = datos.reservas.length;
        const vistasReservas = visto.reservas || 0;
        const nuevas         = Math.max(0, totalReservas - vistasReservas);

        actualizarBadge(badge, nuevas);
        if (pie) pie.textContent = totalReservas > 0
            ? `${totalReservas} reserva${totalReservas !== 1 ? 's' : ''} en tu historial`
            : 'Sin reservas registradas';

        if (lista) {
            if (totalReservas === 0) {
                lista.innerHTML = `
                    <li class="px-4 py-8 text-center">
                        <i class="fa-regular fa-calendar-xmark text-2xl text-white/20 block mb-2"></i>
                        <p class="text-white/40 text-sm m-0">Aún no tienes reservas</p>
                    </li>`;
            } else {
                lista.innerHTML = datos.reservas.slice(-5).reverse()
                    .map(r => buildItemReservaCliente(r)).join('');
            }
        }
    }
}

// ── TOGGLE PANEL ──────────────────────────────

function togglePanelCampana() {
    const panel = document.getElementById('panel-notificaciones');
    const btn   = document.getElementById('btn-campana');
    if (!panel || !btn) return;
    panelAbierto = !panelAbierto;
    panel.classList.toggle('hidden', !panelAbierto);

    if (panelAbierto) {
        const rect   = btn.getBoundingClientRect();
        const panelW = 320;
        const margin = 8;
        let left = rect.left + rect.width / 2 - panelW / 2;
        left = Math.max(margin, Math.min(left, window.innerWidth - panelW - margin));
        panel.style.top  = `${rect.bottom + 8}px`;
        panel.style.left = `${left}px`;

        panel.style.opacity   = '0';
        panel.style.transform = 'translateY(-8px)';
        requestAnimationFrame(() => {
            panel.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            panel.style.opacity    = '1';
            panel.style.transform  = 'translateY(0)';
        });
    }
}

function cerrarPanelCampana() {
    const panel = document.getElementById('panel-notificaciones');
    if (!panel) return;
    panelAbierto = false;
    panel.classList.add('hidden');
}

// ── MARCAR COMO LEÍDO ─────────────────────────

async function marcarComoLeido() {
    let datos;
    try { datos = await obtenerDatosNotificaciones(); }
    catch { datos = { esAdmin: false, usuarios: [], clientes: [], reservas: [] }; }

    setCampanaVisto({
        usuarios: datos.esAdmin ? datos.usuarios.length : 0,
        clientes: datos.esAdmin ? datos.clientes.length : 0,
        reservas: datos.reservas.length
    });

    const badge = document.getElementById('campana-badge');
    if (badge) {
        badge.style.display = 'none';
        badge.classList.add('hidden');
    }
}

// ── INYECTAR CAMPANA EN HEADER ────────────────

function inyectarCampanaEnHeader() {
    if (document.getElementById('btn-campana')) return;
    const nav = document.querySelector('header nav');
    if (!nav) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'campana-header';
    wrapper.style.cssText = 'position:relative;display:flex;align-items:center;margin-left:auto;flex-shrink:0';
        wrapper.innerHTML = `
      <button id="btn-campana"
        style="position:relative;display:flex;align-items:center;justify-content:center;
               width:2.6rem;height:2.6rem;border-radius:0.75rem;border:none;cursor:pointer;
               background:rgba(255,255,255,0.12);transition:background 0.2s,transform 0.2s"
        onmouseenter="this.style.background='rgba(255,255,255,0.22)';this.style.transform='translateY(-1px)'"
        onmouseleave="this.style.background='rgba(255,255,255,0.12)';this.style.transform=''"
        aria-label="Notificaciones">
        <i class="fa-solid fa-bell" style="color:#fff;font-size:1rem"></i>
        <span id="campana-badge"
          style="position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;
                 padding:0 4px;background:#ef4444;color:#fff;font-size:10px;
                 font-weight:700;border-radius:999px;display:none;
                 align-items:center;justify-content:center;
                 box-shadow:0 0 0 2px var(--color-primary,#0f3d3e)">
          0
        </span>
      </button>
            `;

    nav.appendChild(wrapper);

        if (!document.getElementById('panel-notificaciones')) {
                const panel = document.createElement('div');
                panel.id = 'panel-notificaciones';
                panel.className = 'hidden fixed w-80 border border-white/10 rounded-2xl overflow-hidden';
                panel.style.cssText = [
                        'z-index:2010',
                        'background:#1e2a3a',
                        'box-shadow:0 24px 48px rgba(0,0,0,0.45)',
                        'color:#e5e7eb',
                        'width:320px'
                ].join(';');
                panel.innerHTML = `
                    <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <span class="text-white font-semibold text-sm">Notificaciones</span>
                        <button id="btn-marcar-leidas"
                            class="text-white/50 hover:text-white text-xs transition-colors cursor-pointer border-0 bg-transparent">
                            Marcar todo como leído
                        </button>
                    </div>
                    <ul id="lista-notificaciones"
                        class="max-h-72 overflow-y-auto divide-y divide-white/5 p-0 m-0 list-none">
                        <li class="px-4 py-8 text-center text-white/40 text-sm">Sin notificaciones nuevas</li>
                    </ul>
                    <div class="px-4 py-2.5 border-t border-white/10 text-center">
                        <span id="campana-pie" class="text-white/40 text-xs">0 notificaciones</span>
                    </div>`;
                document.body.appendChild(panel);
        }
}

// ── INICIALIZACIÓN ────────────────────────────

function initCampana() {
    const intentar = () => {
        inyectarCampanaEnHeader();
        const btn = document.getElementById('btn-campana');
        if (!btn) {
            setTimeout(intentar, 200);
            return;
        }

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanelCampana();
        });

        const btnLeer = document.getElementById('btn-marcar-leidas');
        if (btnLeer) {
            btnLeer.addEventListener('click', async (e) => {
                e.stopPropagation();
                await marcarComoLeido();
            });
        }

        // Clic en notificación → navegar al módulo
        const lista = document.getElementById('lista-notificaciones');
        if (lista) {
            lista.addEventListener('click', (e) => {
                const li = e.target.closest('[data-notif-tipo]');
                if (!li) return;
                e.stopPropagation();
                manejarClickNotificacion(
                    li.dataset.notifTipo,
                    li.dataset.entidadId || ''
                );
            });
            lista.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const li = e.target.closest('[data-notif-tipo]');
                if (!li) return;
                e.preventDefault();
                manejarClickNotificacion(
                    li.dataset.notifTipo,
                    li.dataset.entidadId || ''
                );
            });
        }

        document.addEventListener('click', (e) => {
            const panel = document.getElementById('panel-notificaciones');
            const boton = document.getElementById('btn-campana');
            if (panelAbierto && panel && boton &&
                !panel.contains(e.target) && !boton.contains(e.target)) {
                cerrarPanelCampana();
            }
        });

        actualizarCampana();

        if (campanaInterval) clearInterval(campanaInterval);
        campanaInterval = setInterval(actualizarCampana, CAMPANA_POLL_MS);
    };

    intentar();
}

window.initCampana       = initCampana;
window.actualizarCampana = actualizarCampana;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCampana);
} else {
    initCampana();
}

// ── HIGHLIGHT AL LLEGAR DESDE NOTIFICACIÓN ────
(function aplicarHighlightNotificacion() {
    const entidadId = sessionStorage.getItem('notif_entidad_id');
    const tipo      = sessionStorage.getItem('notif_tipo');
    if (!entidadId) return;
    sessionStorage.removeItem('notif_entidad_id');
    sessionStorage.removeItem('notif_tipo');
    // Espera a que el módulo renderice su tabla/lista
    setTimeout(() => destacarRegistroEnPagina(entidadId, tipo), 500);
})();
