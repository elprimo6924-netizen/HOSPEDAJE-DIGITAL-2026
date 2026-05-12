/**
 * Script principal de Hospedaje Digital
 * Lógica compartida entre páginas
 */

window.API_URL = window.API_URL || ((typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'http://localhost:3000/api');

// Cargar Oswald (fuente gótica condensada para el sidebar)
if (!document.getElementById('_oswald_font')) {
    const link = document.createElement('link');
    link.id   = '_oswald_font';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
}

function getAppBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
}

function getModuleHref(modulePageName) {
    const isInsidePagesFolder = window.location.pathname.includes('/pages/');
    return isInsidePagesFolder ? modulePageName : `pages/${modulePageName}`;
}

function getStoredSession() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        return null;
    }

    try {
        return {
            token,
            usuario: JSON.parse(user),
        };
    } catch (error) {
        return null;
    }
}

function getRoleName(rolId) {
    const rolesById = {
        1: 'Administrador',
        2: 'Cliente',
        3: 'Gerente',
        4: 'Recepcionista',
    };

    if (rolId === null || rolId === undefined) return 'Desconocido';

    if (typeof rolId === 'object') {
        rolId = rolId.IDRol ?? rolId.idRol ?? rolId.rolId ?? rolId.roleId ?? rolId.rol ?? rolId.id ?? rolId.Nombre ?? rolId.NombreRol ?? rolId.nombre ?? rolId.nombreRol ?? rolId.rolNombre;
    }

    const asNumber = Number(rolId);
    if (Number.isFinite(asNumber) && rolesById[asNumber]) {
        return rolesById[asNumber];
    }

    if (typeof rolId === 'string') {
        const trimmed = rolId.trim();
        const normalized = trimmed.toLowerCase();
        const rolesByName = {
            administrador: 'Administrador',
            admin: 'Administrador',
            cliente: 'Cliente',
            usuario: 'Usuario',
            gerente: 'Gerente',
            recepcionista: 'Recepcionista',
        };

        if (rolesByName[normalized]) return rolesByName[normalized];

        if (trimmed && !Number.isFinite(Number(trimmed))) return trimmed;
    }

    return 'Desconocido';
}

async function loadSidebarComponent(containerId = 'sidebar-placeholder') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('Contenedor para sidebar no encontrado:', containerId);
        return null;
    }

    try {
        const basePath = getAppBasePath();
        const sidebarUrl = `${basePath}components/sidebar.html`;
        console.log('Cargando sidebar desde:', sidebarUrl);
        
        const response = await fetch(sidebarUrl, { cache: 'no-store' });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        console.log('HTML del sidebar obtenido, insertando...');
        
        // Insertar el HTML ANTES del placeholder
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Insertar todos los elementos del sidebar antes del placeholder
        while (tempDiv.firstChild) {
            container.parentNode.insertBefore(tempDiv.firstChild, container);
        }
        
        // Remover el placeholder vacío
        container.remove();
        console.log('Placeholder removido');
        
        // Asegurar que el sidebar existe
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            throw new Error('Sidebar element not found after insertion');
        }
        
        console.log('Sidebar encontrado, inicializando controles...');
        
        // Inicializar controles del sidebar
        initSidebarControls();
        
        return sidebar;
    } catch (error) {
        console.error('Error al cargar el sidebar:', error);
        return null;
    }
}

/**
 * Filtra los elementos del sidebar basado en los permisos del usuario
 */
async function filterSidebarByPermissions() {
    try {
        const session = getStoredSession();
        if (!session) return;

        // Obtener el rol del usuario actual
        const user = session.usuario;
        if (!user || !user.IDRol) return;

        // Obtener los permisos del rol
        const apiUrl = window.API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/roles/${user.IDRol}`, {
            headers: { 'Authorization': `Bearer ${session.token}` }
        });

        if (!response.ok) return;

        const rol = await response.json();
        let permisos = [];
        
        // Procesar permisos
        if (rol.Permisos) {
            permisos = typeof rol.Permisos === 'string' ? JSON.parse(rol.Permisos) : rol.Permisos;
        }

        // Administrador (IDRol=1) ve todos los módulos siempre
        if (user.IDRol === 1) return;

        // Si hay permisos definidos, filtrar elementos del sidebar
        if (permisos && Array.isArray(permisos) && permisos.length > 0) {
            const sidebarItems = document.querySelectorAll('.sidebar-item[data-module]');
            sidebarItems.forEach(item => {
                const module = item.getAttribute('data-module');
                if (module && !permisos.includes(module)) {
                    item.style.display = 'none';
                }
            });
        }
        // Si no hay permisos, mostrar todos (compatibilidad hacia atrás)
    } catch (error) {
        console.warn('No se pudo filtrar el sidebar:', error);
        // En caso de error, mostrar todos los elementos
    }
}

function cargarSeccion(seccion, event) {
    if (event) {
        event.preventDefault();
    }

    if (seccion === 'dashboard') {
        window.location.href = getModuleHref('dashboard.html');
        return;
    }

    if (seccion === 'habitaciones' || seccion === 'administrar-habitaciones') {
        window.location.href = getModuleHref('habitaciones.html');
        return;
    }

    if (seccion === 'servicios' || seccion === 'administrar-servicios') {
        window.location.href = getModuleHref('servicios.html');
        return;
    }

    if (seccion === 'paquetes') {
        window.location.href = getModuleHref('paquetes.html');
        return;
    }

    if (seccion === 'usuarios') {
        window.location.href = getModuleHref('usuarios.html');
        return;
    }

    if (seccion === 'clientes') {
        window.location.href = getModuleHref('clientes.html');
        return;
    }

    if (seccion === 'roles') {
        window.location.href = getModuleHref('roles.html');
        return;
    }

    if (seccion === 'perfil') {
        window.location.href = getModuleHref('perfil.html');
        return;
    }

    if (seccion === 'reservas') {
        window.location.href = getModuleHref('reservas.html');
        return;
    }
}

async function apiRequest(endpoint, options = {}) {
    const session = getStoredSession();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
    }

    const response = await fetch(`${window.API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    let payload = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        payload = await response.json();
    } else {
        payload = await response.text();
    }

    if (!response.ok) {
        const message = payload?.message || payload?.error || payload?.mensaje || 'Error en la solicitud';
        throw new Error(message);
    }

    return payload;
}

// Verificar sesión activa
function verificarSesion() {
    return getStoredSession();
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const isInsidePagesFolder = window.location.pathname.includes('/pages/');
        window.location.href = isInsidePagesFolder ? '../login.html' : 'login.html';
    }
}

// Hacer llamada a la API
async function apiCall(endpoint, method = 'GET', data = null) {
    const sesion = verificarSesion();
    const token = sesion ? sesion.token : null;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${window.API_URL}${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw {
                status: response.status,
                message: error.error || error.message || 'Error en la solicitud',
            };
        }

        return await response.json();
    } catch (error) {
        console.error('Error en API:', error);
        throw error;
    }
}

/**
 * Llena la información del usuario en el sidebar
 */
async function fillUserInfoInSidebar() {
    try {
        const session = getStoredSession();
        if (!session || !session.usuario) return;

        const user = session.usuario;
        const nameElement = document.getElementById('sidebar-user-name');
        const roleElement = document.getElementById('sidebar-user-role');

        const roleWords = new Set([
            'admin',
            'administrador',
            'usuario',
            'user',
            'cliente',
            'gerente',
            'recepcionista'
        ]);

        const cleanNamePart = (value) => {
            const text = String(value ?? '').trim();
            if (!text) return '';

            const tokens = text.split(/\s+/).filter(Boolean);
            while (tokens.length && roleWords.has(tokens[tokens.length - 1].toLowerCase())) {
                tokens.pop();
            }

            return tokens.join(' ').trim();
        };

        const firstName = cleanNamePart(user.NombreUsuario ?? user.nombreUsuario ?? user.nombre ?? user.Nombre ?? user.firstName ?? user.nombres ?? user.Nombres);
        const lastName = cleanNamePart(user.Apellido ?? user.apellido ?? user.lastName ?? user.apellidos ?? user.Apellidos);
        const email = user.Email ?? user.email ?? user.correo ?? user.Correo;
        let displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || email || 'Usuario';

        const isGenericName = ['usuario', 'user', 'desconocido'].includes(String(displayName).trim().toLowerCase());

        if (isGenericName && user.id && typeof window.apiRequest === 'function') {
            try {
                const userDetail = await window.apiRequest(`/usuarios/${user.id}`);
                const detailName = [
                    cleanNamePart(userDetail?.NombreUsuario),
                    cleanNamePart(userDetail?.nombre),
                    cleanNamePart(userDetail?.Nombre),
                    cleanNamePart(userDetail?.Apellido)
                ].filter(Boolean).join(' ').trim();

                if (detailName) {
                    displayName = detailName;
                }
            } catch (error) {
                console.warn('No se pudo obtener el nombre completo del usuario:', error);
            }
        }

        if (nameElement) {
            nameElement.textContent = displayName;
        }

        if (roleElement) {
            // Obtener nombre del rol
            let roleName = 'Rol: ';
            const nombreRol = user.rolNombre ?? user.NombreRol ?? user.nombreRol ?? user.nombre ?? user.rol ?? user.Rol;

            // Usar un nombre de rol explícito si existe y no es numérico
            if (nombreRol && typeof nombreRol === 'string' && nombreRol.trim() !== '' && !/^\d+$/.test(nombreRol)) {
                roleName += nombreRol;
            } else {
                const rolCandidato = user.IDRol ?? user.idRol ?? user.rolId ?? user.roleId ?? user.id_rol;
                const mappedRole = getRoleName(rolCandidato ?? nombreRol);
                if (mappedRole !== 'Desconocido') {
                    roleName += mappedRole;
                } else {
                    // Consultar la API para obtener el nombre real del rol
                    try {
                        const apiUrl = window.API_URL || 'http://localhost:3000/api';
                        const response = await fetch(`${apiUrl}/roles/${rolCandidato}`, {
                            headers: { 'Authorization': `Bearer ${session.token}` }
                        });
                        if (response.ok) {
                            const rolData = await response.json();
                            roleName += rolData.Nombre || rolData.NombreRol || rolData.nombre || `Rol #${rolCandidato}`;
                        } else {
                            roleName += `Rol #${rolCandidato}`;
                        }
                    } catch (apiError) {
                        console.warn('Error al consultar rol:', apiError);
                        roleName += `Rol #${rolCandidato}`;
                    }
                }
            }
            roleElement.textContent = roleName;
        }
    } catch (error) {
        console.warn('No se pudo llenar la información del usuario:', error);
    }
}

function markActiveSidebarItem() {
    const page = window.location.pathname.split('/').pop().replace('.html', '');
    const pageToModule = {
        dashboard: 'dashboard',
        habitaciones: 'habitaciones',
        paquetes: 'paquetes',
        servicios: 'servicios',
        usuarios: 'usuarios',
        clientes: 'clientes',
        roles: 'roles',
        reservas: 'reservas',
        perfil: 'perfil',
    };
    const module = pageToModule[page];
    if (!module) return;
    const item = document.querySelector(`.sidebar-item[data-module="${module}"]`);
    if (item) item.classList.add('sidebar-item-active');
}

async function initSidebarControls() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    const mainWrapper = document.getElementById('main-wrapper');

    if (!sidebar || !toggle) return;

    if (sidebar.dataset.initialized === 'true') {
        return;
    }

    sidebar.dataset.initialized = 'true';

    // Llenar información del usuario
    await fillUserInfoInSidebar();

    // Filtrar sidebar según permisos del rol
    await filterSidebarByPermissions();

    // Marcar ítem activo según la página actual
    markActiveSidebarItem();

    const labels = () => sidebar.querySelectorAll('.sidebar-label');

    function showLabels() {
        labels().forEach(el => {
            el.style.opacity  = '1';
            el.style.transition = 'opacity 0.15s ease';
        });
    }

    function hideLabels() {
        labels().forEach(el => {
            el.style.opacity  = '0';
            el.style.transition = 'none';
        });
    }

    let _openTimer = null;

    function openSidebar(manual = true) {
        if (manual) {
            sidebar.dataset.manualOpen = 'true';
        }
        sidebar.classList.add('sidebar-open');
        mainWrapper?.classList.add('sidebar-open');
        overlay.classList.remove('active');
        clearTimeout(_openTimer);
        _openTimer = setTimeout(showLabels, 0);
    }

    function closeSidebar() {
        clearTimeout(_openTimer);
        hideLabels();
        delete sidebar.dataset.manualOpen;
        sidebar.classList.remove('sidebar-open');
        mainWrapper?.classList.remove('sidebar-open');
    }

    toggle.addEventListener('click', () => {
        if (sidebar.classList.contains('sidebar-open')) {
            closeSidebar();
        } else {
            openSidebar(true);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('sidebar-open')) closeSidebar();
    });

    openSidebar(false);
}

/* ── Soft Alert ── */
(function () {
    const STYLES = `
        #_sa_wrap{position:fixed;top:18px;right:18px;z-index:99999;display:flex;flex-direction:column;
                  gap:10px;max-width:340px;pointer-events:none;}
        ._sa{display:flex;align-items:flex-start;gap:11px;padding:13px 15px;border-radius:12px;
             box-shadow:0 6px 24px rgba(0,0,0,.13);pointer-events:all;border-left:4px solid;
             animation:_sa_in .28s cubic-bezier(.2,.8,.4,1) both;}
        ._sa._sa_success{background:#f0fdf4;border-color:#22c55e;color:#166534;}
        ._sa._sa_error  {background:#fef2f2;border-color:#ef4444;color:#991b1b;}
        ._sa._sa_warning{background:#fffbeb;border-color:#f59e0b;color:#92400e;}
        ._sa._sa_info   {background:#eff6ff;border-color:#3b82f6;color:#1e40af;}
        ._sa_icon{font-size:1rem;flex-shrink:0;margin-top:2px;}
        ._sa_body{flex:1;min-width:0;}
        ._sa_title{font-weight:700;font-size:.82rem;line-height:1.3;}
        ._sa_msg{font-size:.79rem;margin-top:2px;opacity:.88;line-height:1.45;}
        ._sa_bar{height:3px;border-radius:3px;margin-top:9px;background:currentColor;
                 opacity:.22;animation:_sa_bar linear both;}
        ._sa_x{background:none;border:none;cursor:pointer;opacity:.4;font-size:1.05rem;
               padding:0 2px;line-height:1;flex-shrink:0;color:inherit;}
        ._sa_x:hover{opacity:.85;}
        @keyframes _sa_in {from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:translateX(0)}}
        @keyframes _sa_out{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(50px)}}
        @keyframes _sa_bar{from{width:100%}to{width:0%}}
    `;
    const CFG = {
        success:{ icon:'✓', title:'Éxito' },
        error:  { icon:'✕', title:'Error' },
        warning:{ icon:'⚠', title:'Advertencia' },
        info:   { icon:'ℹ', title:'Información' },
    };
    function ensureContainer() {
        let c = document.getElementById('_sa_wrap');
        if (!c) { c = document.createElement('div'); c.id = '_sa_wrap'; document.body.appendChild(c); }
        if (!document.getElementById('_sa_style')) {
            const s = document.createElement('style'); s.id = '_sa_style'; s.textContent = STYLES;
            document.head.appendChild(s);
        }
        return c;
    }
    window.showAlert = function (message, type, title, duration) {
        type     = type     || 'info';
        duration = duration || 4000;
        const c   = ensureContainer();
        const cfg = CFG[type] || CFG.info;
        const t   = title != null ? title : cfg.title;
        const el  = document.createElement('div');
        el.className = `_sa _sa_${type}`;
        el.innerHTML =
            `<span class="_sa_icon">${cfg.icon}</span>` +
            `<div class="_sa_body">` +
                `<div class="_sa_title">${t}</div>` +
                `<div class="_sa_msg">${message}</div>` +
                `<div class="_sa_bar" style="animation-duration:${duration}ms"></div>` +
            `</div>` +
            `<button class="_sa_x" title="Cerrar">&times;</button>`;
        c.appendChild(el);
        const close = function () {
            el.style.animation = '_sa_out .28s ease forwards';
            setTimeout(function () { el.remove(); }, 280);
        };
        const timer = setTimeout(close, duration);
        el.querySelector('._sa_x').addEventListener('click', function () {
            clearTimeout(timer); close();
        });
    };
})();

window.getAppBasePath = getAppBasePath;
window.markActiveSidebarItem = markActiveSidebarItem;
window.getStoredSession = getStoredSession;
window.getRoleName = getRoleName;
window.loadSidebarComponent = loadSidebarComponent;
window.filterSidebarByPermissions = filterSidebarByPermissions;
window.fillUserInfoInSidebar = fillUserInfoInSidebar;
window.apiRequest = apiRequest;
window.verificarSesion = verificarSesion;
window.cerrarSesion = cerrarSesion;
window.cargarSeccion = cargarSeccion;
window.initSidebarControls = initSidebarControls;
