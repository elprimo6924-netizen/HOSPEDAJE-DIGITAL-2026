// ── rolFormModal.js — vanilla JS, sin ES modules ────────────────────────────

let currentModeRol = 'create';
let currentRolId   = null;
let _rfRolesCache  = []; // nombres de roles existentes para validar duplicados

const PERMISOS_DISPONIBLES = [
    { id: 1, label: 'Dashboard',    icon: 'fa-chart-line'     },
    { id: 2, label: 'Usuarios',     icon: 'fa-users'          },
    { id: 3, label: 'Roles',        icon: 'fa-shield-halved'  },
    { id: 4, label: 'Habitaciones', icon: 'fa-bed'            },
    { id: 5, label: 'Servicios',    icon: 'fa-bell-concierge' },
    { id: 6, label: 'Reservas',     icon: 'fa-calendar-check' },
    { id: 7, label: 'Paquetes',     icon: 'fa-box-open'       },
];

async function openRolForm(mode = 'create', rolData = null, token, isProtected = false, onSave) {
    currentModeRol = mode;
    currentRolId   = (rolData && typeof rolData === 'object')
        ? (rolData.IDRol || rolData.id || null)
        : (rolData != null ? rolData : null);

    // Si es edición y solo recibimos el ID, cargamos los datos del rol
    if (mode === 'edit' && currentRolId && (!rolData || typeof rolData !== 'object')) {
        try {
            const apiUrl = window.CONFIG?.API_URL || 'http://localhost:3000/api';
            const res    = await fetch(`${apiUrl}/roles/${currentRolId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('No se pudo cargar el rol');
            rolData = await res.json();
            rolData = rolData.data || rolData;
        } catch {
            if (typeof showAlert === 'function') showAlert('Error al cargar datos del rol', 'error');
            return;
        }
    }

    // Cargar lista de roles para validación de duplicados
    try {
        const apiUrl = window.CONFIG?.API_URL || 'http://localhost:3000/api';
        const res    = await fetch(`${apiUrl}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const raw  = Array.isArray(data) ? data : (data.data || []);
            _rfRolesCache = raw
                .filter(r => mode === 'edit' ? Number(r.IDRol) !== Number(currentRolId) : true)
                .map(r => (r.Nombre || r.NombreRol || '').trim().toLowerCase())
                .filter(Boolean);
        }
    } catch { _rfRolesCache = []; }

    // ── Inyectar estilos una sola vez ───────────────────────────────────
    if (!document.getElementById('_rf_styles')) {
        const s = document.createElement('style');
        s.id = '_rf_styles';
        s.textContent = `
            #_rf_overlay {
                position:fixed; inset:0; background:rgba(15,23,42,.6);
                display:flex; align-items:center; justify-content:center;
                z-index:9999; padding:16px; box-sizing:border-box;
                animation:_rf_bg .2s ease;
            }
            @keyframes _rf_bg { from{opacity:0} to{opacity:1} }
            @keyframes _rf_up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

            #_rf_box {
                background:#fff; border-radius:20px; width:100%; max-width:580px;
                max-height:calc(100vh - 32px); display:flex; flex-direction:column;
                box-shadow:0 32px 80px rgba(15,23,42,.28); overflow:hidden;
                animation:_rf_up .28s cubic-bezier(.22,.68,0,1.2);
            }

            /* Header */
            #_rf_header {
                flex-shrink:0;
                background:linear-gradient(135deg,#1a2e1a 0%,#2d4a2d 100%);
                position:relative; overflow:hidden;
            }
            #_rf_header::before {
                content:''; position:absolute; inset:0;
                background:radial-gradient(ellipse at 85% 50%, rgba(232,116,59,.18) 0%, transparent 65%);
                pointer-events:none;
            }
            #_rf_header-inner {
                display:flex; align-items:center; gap:14px;
                padding:20px 24px 18px; position:relative; z-index:1;
            }
            .rf-hdr-icon {
                width:46px; height:46px; border-radius:13px; flex-shrink:0;
                background:linear-gradient(135deg,#e8743b,#d45a22);
                display:flex; align-items:center; justify-content:center;
                color:#fff; font-size:1.1rem;
                box-shadow:0 4px 14px rgba(232,116,59,.4);
            }
            .rf-hdr-text h2 {
                font-size:1.1rem; font-weight:800; color:#fff; margin:0 0 3px;
                letter-spacing:-.01em;
            }
            .rf-hdr-text p { font-size:.74rem; color:rgba(255,255,255,.5); margin:0; }
            #_rf_close {
                margin-left:auto; background:rgba(255,255,255,.1); border:none;
                cursor:pointer; color:rgba(255,255,255,.7); font-size:1.1rem;
                width:34px; height:34px; border-radius:8px; display:flex;
                align-items:center; justify-content:center;
                transition:background .15s,color .15s; flex-shrink:0;
            }
            #_rf_close:hover { background:rgba(255,255,255,.2); color:#fff; }

            /* Body */
            #_rf_body { overflow-y:auto; flex:1; padding:22px 24px 6px; }

            /* Sections */
            .rf-section { margin-bottom:22px; }
            .rf-section-title {
                display:flex; align-items:center; gap:8px;
                font-size:.68rem; font-weight:800; color:#64748b;
                text-transform:uppercase; letter-spacing:.09em;
                margin-bottom:14px; padding-bottom:8px;
                border-bottom:1.5px solid #f1f5f9;
            }
            .rf-stitle-icon {
                width:22px; height:22px; border-radius:6px;
                background:linear-gradient(135deg,#e8743b,#d45a22);
                display:inline-flex; align-items:center; justify-content:center;
                color:#fff; font-size:.62rem; flex-shrink:0;
            }

            /* Campos */
            .rf-field { display:flex; flex-direction:column; gap:4px; }
            .rf-label {
                font-size:.74rem; font-weight:700; color:#374151;
                letter-spacing:.015em;
            }
            .rf-req { color:#ef4444; margin-left:2px; }

            .rf-input-wrap { position:relative; }
            .rf-input-wrap .rf-pre {
                position:absolute; left:12px; top:50%; transform:translateY(-50%);
                color:#94a3b8; font-size:.78rem; pointer-events:none; z-index:1;
            }
            .rf-input {
                width:100%; box-sizing:border-box; padding:10px 13px 10px 36px;
                border:1.5px solid #e2e8f0; border-radius:10px; font-size:.86rem;
                color:#0f172a; background:#fafafa; font-family:inherit; outline:none;
                transition:border-color .18s,box-shadow .18s,background .18s;
            }
            .rf-input:focus {
                border-color:#e8743b; background:#fff;
                box-shadow:0 0 0 3px rgba(232,116,59,.12);
            }
            .rf-input:hover:not(:focus) { border-color:#cbd5e1; background:#fff; }
            .rf-input.rf-error { border-color:#ef4444 !important; box-shadow:0 0 0 3px rgba(239,68,68,.1) !important; }
            .rf-input.rf-warn  { border-color:#f59e0b !important; box-shadow:0 0 0 3px rgba(245,158,11,.1) !important; }
            .rf-input:disabled { opacity:.55; cursor:not-allowed; }

            /* Mensajes de campo */
            .rf-field-msg {
                font-size:.69rem; font-weight:600; display:flex; align-items:center; gap:4px;
            }
            .rf-field-msg.error { color:#ef4444; }
            .rf-field-msg.warn  { color:#b45309; }
            .rf-field-msg.ok    { color:#16a34a; }
            .rf-field-msg i { font-size:.65rem; }

            /* Toggle estado */
            .rf-toggle-row {
                display:flex; align-items:center; gap:12px; padding:10px 13px;
                border:1.5px solid #e2e8f0; border-radius:10px; background:#fafafa;
                cursor:pointer; transition:border-color .18s,background .18s;
            }
            .rf-toggle-row:hover { border-color:#cbd5e1; background:#fff; }
            .rf-toggle-wrap { position:relative; width:42px; height:23px; flex-shrink:0; }
            .rf-toggle-wrap input { opacity:0; width:0; height:0; position:absolute; }
            .rf-toggle-track {
                position:absolute; inset:0; border-radius:999px;
                background:#cbd5e1; cursor:pointer; transition:background .25s;
            }
            .rf-toggle-track::before {
                content:''; position:absolute; width:17px; height:17px;
                border-radius:50%; background:#fff; top:3px; left:3px;
                box-shadow:0 1px 4px rgba(0,0,0,.22); transition:transform .25s;
            }
            .rf-toggle-wrap input:checked + .rf-toggle-track { background:#22c55e; }
            .rf-toggle-wrap input:checked + .rf-toggle-track::before { transform:translateX(19px); }
            .rf-toggle-lbl { font-size:.83rem; font-weight:700; }
            .rf-toggle-lbl.on  { color:#16a34a; }
            .rf-toggle-lbl.off { color:#94a3b8; }
            .rf-toggle-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; transition:background .25s; }
            .rf-toggle-dot.on  { background:#22c55e; }
            .rf-toggle-dot.off { background:#94a3b8; }

            /* Grid de permisos */
            .rf-perms-header {
                display:flex; align-items:center; justify-content:space-between;
                margin-bottom:12px;
            }
            .rf-select-all-btn {
                display:inline-flex; align-items:center; gap:6px;
                font-size:.74rem; font-weight:700; color:#e8743b; cursor:pointer;
                background:none; border:none; padding:4px 8px; border-radius:6px;
                transition:background .15s;
            }
            .rf-select-all-btn:hover { background:#fff3e0; }
            .rf-select-all-btn .rf-sa-box {
                width:16px; height:16px; border-radius:4px; border:1.5px solid #cbd5e1;
                display:flex; align-items:center; justify-content:center;
                background:#fff; transition:background .18s,border-color .18s;
                flex-shrink:0;
            }
            .rf-select-all-btn .rf-sa-box.all {
                background:#e8743b; border-color:#e8743b;
            }
            .rf-select-all-btn .rf-sa-box i { color:#fff; font-size:.55rem; display:none; }
            .rf-select-all-btn .rf-sa-box.all i { display:block; }
            .rf-counter { font-size:.72rem; color:#64748b; font-weight:600; }

            .rf-perms-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
            .rf-perm-card {
                display:flex; align-items:center; gap:10px;
                padding:11px 13px; border:1.5px solid #e2e8f0; border-radius:11px;
                background:#fafafa; cursor:pointer;
                transition:border-color .18s,background .18s,box-shadow .18s;
            }
            .rf-perm-card:hover { border-color:#fdba74; background:#fffaf5; }
            .rf-perm-card.selected {
                border-color:#e8743b; background:#fff8f0;
                box-shadow:0 0 0 3px rgba(232,116,59,.08);
            }
            .rf-perm-card input[type="checkbox"] { display:none; }
            .rf-perm-check {
                width:18px; height:18px; border-radius:5px; border:1.5px solid #cbd5e1;
                display:flex; align-items:center; justify-content:center; flex-shrink:0;
                transition:background .18s,border-color .18s; background:#fff;
            }
            .rf-perm-card.selected .rf-perm-check { background:#e8743b; border-color:#e8743b; }
            .rf-perm-check i { color:#fff; font-size:.58rem; display:none; }
            .rf-perm-card.selected .rf-perm-check i { display:block; }
            .rf-perm-icon {
                width:30px; height:30px; border-radius:8px; background:#fff3e0;
                display:flex; align-items:center; justify-content:center; flex-shrink:0;
            }
            .rf-perm-icon i { color:#e8743b; font-size:.82rem; }
            .rf-perm-card.selected .rf-perm-icon { background:#ffe0c2; }
            .rf-perm-name { font-size:.82rem; font-weight:600; color:#374151; }

            /* Aviso sin permisos */
            .rf-perms-warn {
                display:none; align-items:center; gap:6px; padding:8px 12px;
                background:#fff7ed; border:1px solid #fed7aa; border-radius:8px;
                font-size:.74rem; color:#92400e; font-weight:600; margin-top:10px;
            }
            .rf-perms-warn.visible { display:flex; }

            /* Footer */
            #_rf_footer {
                padding:16px 24px; border-top:1.5px solid #f1f5f9;
                display:flex; gap:10px; justify-content:flex-end;
                flex-shrink:0; background:#fff;
            }
            .rf-btn-cancel {
                padding:10px 22px; border-radius:10px; background:#f8fafc;
                color:#475569; font-weight:600; font-size:.85rem;
                border:1.5px solid #e2e8f0; cursor:pointer; transition:all .15s;
            }
            .rf-btn-cancel:hover { background:#f1f5f9; border-color:#cbd5e1; }
            .rf-btn-submit {
                padding:10px 26px; border-radius:10px;
                background:linear-gradient(135deg,#e8743b,#d45a22);
                color:#fff; font-weight:700; font-size:.85rem; border:none;
                cursor:pointer; box-shadow:0 4px 14px rgba(232,116,59,.35);
                transition:opacity .15s,transform .15s,box-shadow .15s;
                display:flex; align-items:center; gap:8px;
            }
            .rf-btn-submit:hover:not(:disabled) {
                opacity:.92; transform:translateY(-1px);
                box-shadow:0 6px 20px rgba(232,116,59,.42);
            }
            .rf-btn-submit:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }

            @media(max-width:480px) { .rf-perms-grid { grid-template-columns:1fr; } }
        `;
        document.head.appendChild(s);
    }

    const isCreate = mode === 'create';

    const overlay = document.createElement('div');
    overlay.id = '_rf_overlay';
    overlay.innerHTML = `
        <div id="_rf_box">
            <!-- Header -->
            <div id="_rf_header">
                <div id="_rf_header-inner">
                    <span class="rf-hdr-icon">
                        <i class="fa-solid fa-${isCreate ? 'shield-plus' : 'shield-halved'}"></i>
                    </span>
                    <div class="rf-hdr-text">
                        <h2>${isCreate ? 'Crear nuevo rol' : 'Editar rol'}</h2>
                        <p>${isCreate ? 'Define un nuevo nivel de acceso para el sistema.' : 'Modifica el nombre, estado y permisos del rol.'}</p>
                    </div>
                    <button id="_rf_close" title="Cerrar" aria-label="Cerrar">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <!-- Body -->
            <div id="_rf_body">
                <form id="_rf_form" novalidate autocomplete="off">

                    <!-- Información del rol -->
                    <div class="rf-section">
                        <div class="rf-section-title">
                            <span class="rf-stitle-icon"><i class="fa-solid fa-tag"></i></span>
                            Información del rol
                        </div>
                        <div style="display:flex;flex-direction:column;gap:14px;">

                            <!-- Nombre -->
                            <div class="rf-field" id="_rf_fld_nombre">
                                <label class="rf-label">
                                    Nombre del rol <span class="rf-req">*</span>
                                </label>
                                <div class="rf-input-wrap">
                                    <i class="fa-solid fa-tag rf-pre"></i>
                                    <input type="text" name="Nombre" id="_rf_nombre" required
                                        placeholder="Ej: Gestor de Reservas"
                                        autocomplete="off"
                                        class="rf-input"
                                        ${isProtected && !isCreate ? 'disabled' : ''}>
                                </div>
                                <span class="rf-field-msg" id="_rf_nombre_msg" style="display:none"></span>
                            </div>

                            <!-- Estado -->
                            <div class="rf-field">
                                <label class="rf-label">Estado de la cuenta</label>
                                <label class="rf-toggle-row" for="_rf_active">
                                    <span class="rf-toggle-wrap">
                                        <input type="checkbox" id="_rf_active" ${isCreate ? 'checked' : ''}>
                                        <span class="rf-toggle-track"></span>
                                    </span>
                                    <span class="rf-toggle-dot ${isCreate ? 'on' : 'off'}" id="_rf_active_dot"></span>
                                    <span id="_rf_active_lbl" class="rf-toggle-lbl ${isCreate ? 'on' : 'off'}">
                                        ${isCreate ? 'Activo' : 'Inactivo'}
                                    </span>
                                </label>
                            </div>

                        </div>
                    </div>

                    <!-- Permisos -->
                    <div class="rf-section">
                        <div class="rf-section-title">
                            <span class="rf-stitle-icon"><i class="fa-solid fa-lock"></i></span>
                            Permisos de acceso
                        </div>

                        <div class="rf-perms-header">
                            <span class="rf-counter" id="_rf_perm_counter">0 de ${PERMISOS_DISPONIBLES.length} seleccionados</span>
                            <button type="button" class="rf-select-all-btn" id="_rf_select_all">
                                <span class="rf-sa-box" id="_rf_sa_box">
                                    <i class="fa-solid fa-check"></i>
                                </span>
                                Seleccionar todos
                            </button>
                        </div>

                        <div class="rf-perms-grid">
                            ${PERMISOS_DISPONIBLES.map(p => `
                                <label class="rf-perm-card" data-perm="${p.id}">
                                    <input type="checkbox" name="permisos" value="${p.id}" class="rf-perm-cb">
                                    <span class="rf-perm-check"><i class="fa-solid fa-check"></i></span>
                                    <span class="rf-perm-icon"><i class="fa-solid ${p.icon}"></i></span>
                                    <span class="rf-perm-name">${p.label}</span>
                                </label>
                            `).join('')}
                        </div>

                        <div class="rf-perms-warn" id="_rf_perms_warn">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            Debes seleccionar al menos un permiso para guardar el rol.
                        </div>
                    </div>

                </form>
            </div>

            <!-- Footer -->
            <div id="_rf_footer">
                <button type="button" class="rf-btn-cancel" id="_rf_cancel">Cancelar</button>
                <button type="submit" form="_rf_form" class="rf-btn-submit" id="_rf_submit">
                    <i class="fa-solid fa-${isCreate ? 'plus' : 'floppy-disk'}"></i>
                    ${isCreate ? 'Crear rol' : 'Guardar cambios'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // ── Toggle estado ────────────────────────────────────────────────────
    const activeCheck = overlay.querySelector('#_rf_active');
    const activeLbl   = overlay.querySelector('#_rf_active_lbl');
    const activeDot   = overlay.querySelector('#_rf_active_dot');
    activeCheck.addEventListener('change', () => {
        const on = activeCheck.checked;
        activeLbl.textContent = on ? 'Activo' : 'Inactivo';
        activeLbl.className   = `rf-toggle-lbl ${on ? 'on' : 'off'}`;
        activeDot.className   = `rf-toggle-dot ${on ? 'on' : 'off'}`;
    });

    // ── Validación nombre en tiempo real ─────────────────────────────────
    const nombreInput = overlay.querySelector('#_rf_nombre');
    const nombreMsg   = overlay.querySelector('#_rf_nombre_msg');

    const _rfSetNombreMsg = (tipo, texto) => {
        if (!nombreMsg) return;
        if (!tipo) { nombreMsg.style.display = 'none'; return; }
        nombreMsg.style.display = 'flex';
        nombreMsg.className = `rf-field-msg ${tipo}`;
        const iconos = { error: 'fa-circle-exclamation', warn: 'fa-triangle-exclamation', ok: 'fa-circle-check' };
        nombreMsg.innerHTML = `<i class="fa-solid ${iconos[tipo] || 'fa-circle-exclamation'}"></i> ${texto}`;
    };

    let _rfNombreTimer;
    nombreInput?.addEventListener('input', () => {
        const val = nombreInput.value.trim().toLowerCase();
        nombreInput.classList.remove('rf-error', 'rf-warn');
        _rfSetNombreMsg(null, '');

        clearTimeout(_rfNombreTimer);
        if (!val) return;

        _rfNombreTimer = setTimeout(() => {
            if (_rfRolesCache.includes(val)) {
                nombreInput.classList.add('rf-error');
                _rfSetNombreMsg('error', `Ya existe un rol con ese nombre. Elige un nombre diferente.`);
            } else {
                _rfSetNombreMsg('ok', 'Nombre disponible.');
            }
        }, 400);
    });

    // ── Lógica de tarjetas de permisos ───────────────────────────────────
    const permCards    = overlay.querySelectorAll('.rf-perm-card');
    const selectAllBtn = overlay.querySelector('#_rf_select_all');
    const saBox        = overlay.querySelector('#_rf_sa_box');
    const counter      = overlay.querySelector('#_rf_perm_counter');
    const permsWarn    = overlay.querySelector('#_rf_perms_warn');

    const _rfSyncPerms = () => {
        const selected  = Array.from(permCards).filter(c => c.classList.contains('selected')).length;
        const allSelected = selected === permCards.length;
        if (counter) counter.textContent = `${selected} de ${PERMISOS_DISPONIBLES.length} seleccionados`;
        if (saBox)   saBox.classList.toggle('all', allSelected);
        if (permsWarn) permsWarn.classList.toggle('visible', selected === 0);
    };

    permCards.forEach(card => {
        card.addEventListener('click', () => {
            const cb = card.querySelector('.rf-perm-cb');
            cb.checked = !cb.checked;
            card.classList.toggle('selected', cb.checked);
            _rfSyncPerms();
        });
    });

    selectAllBtn?.addEventListener('click', () => {
        const allSelected = Array.from(permCards).every(c => c.classList.contains('selected'));
        permCards.forEach(card => {
            const cb = card.querySelector('.rf-perm-cb');
            cb.checked = !allSelected;
            card.classList.toggle('selected', !allSelected);
        });
        _rfSyncPerms();
    });

    // ── Pre-rellenar en modo edición ─────────────────────────────────────
    if (mode === 'edit' && rolData) {
        const nombre = rolData.NombreRol || rolData.Nombre || rolData.nombre || '';
        if (nombreInput) nombreInput.value = nombre;

        const activo = Number(rolData.IsActive) === 1 || rolData.Estado === 'Activo';
        activeCheck.checked    = activo;
        activeLbl.textContent  = activo ? 'Activo' : 'Inactivo';
        activeLbl.className    = `rf-toggle-lbl ${activo ? 'on' : 'off'}`;
        activeDot.className    = `rf-toggle-dot ${activo ? 'on' : 'off'}`;

        let permisosActivos = rolData.permisos || rolData.Permisos || [];
        if (typeof permisosActivos === 'string') {
            try { permisosActivos = JSON.parse(permisosActivos); } catch { permisosActivos = []; }
        }
        const permIds = permisosActivos.map(p => Number(p?.id ?? p?.IDPermiso ?? p));
        permCards.forEach(card => {
            const id = Number(card.dataset.perm);
            if (permIds.includes(id)) {
                card.querySelector('.rf-perm-cb').checked = true;
                card.classList.add('selected');
            }
        });
        _rfSyncPerms();
    }

    // ── Cierre ───────────────────────────────────────────────────────────
    const close = () => closeRolForm();
    overlay.querySelector('#_rf_cancel').addEventListener('click', close);
    overlay.querySelector('#_rf_close').addEventListener('click', close);
    const onEsc = e => {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
    };
    document.addEventListener('keydown', onEsc);

    // ── Submit ───────────────────────────────────────────────────────────
    overlay.querySelector('#_rf_form').addEventListener('submit', async e => {
        e.preventDefault();
        await saveRol(token, onSave);
    });
}

// ── Guardar rol ──────────────────────────────────────────────────────────────

async function saveRol(token, onSave) {
    const btn      = document.getElementById('_rf_submit');
    const isCreate = currentModeRol === 'create';

    const form   = document.getElementById('_rf_form');
    const nombre = form?.querySelector('[name="Nombre"]')?.value?.trim() || '';
    const permisos = Array.from(form?.querySelectorAll('.rf-perm-cb:checked') || [])
        .map(cb => Number(cb.value));

    // ── Validación frontend ──────────────────────────────────────────────
    let hayError = false;

    const nombreInput = document.getElementById('_rf_nombre');
    const nombreMsg   = document.getElementById('_rf_nombre_msg');

    const _setMsg = (el, tipo, texto) => {
        if (!el) return;
        el.style.display = 'flex';
        el.className = `rf-field-msg ${tipo}`;
        const iconos = { error: 'fa-circle-exclamation', warn: 'fa-triangle-exclamation' };
        el.innerHTML = `<i class="fa-solid ${iconos[tipo] || 'fa-circle-exclamation'}"></i> ${texto}`;
    };

    if (!nombre) {
        nombreInput?.classList.add('rf-error');
        _setMsg(nombreMsg, 'error', 'El nombre del rol es obligatorio.');
        nombreInput?.focus();
        hayError = true;
    } else if (_rfRolesCache.includes(nombre.toLowerCase())) {
        nombreInput?.classList.add('rf-error');
        _setMsg(nombreMsg, 'error', 'Ya existe un rol con ese nombre. Elige uno diferente.');
        nombreInput?.focus();
        hayError = true;
    }

    const permsWarn = document.getElementById('_rf_perms_warn');
    if (permisos.length === 0) {
        if (permsWarn) permsWarn.classList.add('visible');
        hayError = true;
    }

    if (hayError) {
        if (typeof showAlert === 'function') {
            const msg = !nombre
                ? 'El nombre del rol es obligatorio.'
                : _rfRolesCache.includes(nombre.toLowerCase())
                    ? 'Ya existe un rol con ese nombre. Elige uno diferente.'
                    : 'Debes seleccionar al menos un permiso.';
            showAlert(msg, 'error');
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…';
    }

    try {
        const activeCheck = document.getElementById('_rf_active');
        const isActive    = activeCheck?.checked ? 1 : 0;

        const data = {
            Nombre:   nombre,
            IsActive: isActive,
            Estado:   isActive ? 'Activo' : 'Inactivo',
            Permisos: permisos,
        };

        const apiUrl = window.CONFIG?.API_URL || 'http://localhost:3000/api';
        const url    = isCreate ? `${apiUrl}/roles` : `${apiUrl}/roles/${currentRolId}`;
        const method = isCreate ? 'POST' : 'PUT';

        const res     = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        const resData = await res.json();

        if (!res.ok) {
            // 409 = nombre duplicado detectado en backend
            if (res.status === 409) {
                const nombreInputEl = document.getElementById('_rf_nombre');
                nombreInputEl?.classList.remove('rf-warn');
                nombreInputEl?.classList.add('rf-error');
                nombreInputEl?.focus();
                const msg = document.getElementById('_rf_nombre_msg');
                if (msg) {
                    msg.style.display = 'flex';
                    msg.className = 'rf-field-msg error';
                    msg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${resData.error}`;
                }
                if (typeof showAlert === 'function') showAlert(resData.error, 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fa-solid fa-${isCreate ? 'plus' : 'floppy-disk'}"></i> ${isCreate ? 'Crear rol' : 'Guardar cambios'}`;
                }
                return;
            }
            throw new Error(resData.message || resData.error || resData.detalle || 'Error en la operación');
        }

        if (typeof showAlert === 'function') {
            showAlert(`Rol ${isCreate ? 'creado' : 'actualizado'} exitosamente`, 'success');
        }
        closeRolForm();
        if (onSave) onSave();

    } catch (error) {
        if (typeof showAlert === 'function') showAlert(error.message, 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-${isCreate ? 'plus' : 'floppy-disk'}"></i> ${isCreate ? 'Crear rol' : 'Guardar cambios'}`;
        }
    }
}

function closeRolForm() {
    const modal = document.getElementById('_rf_overlay');
    if (modal) {
        modal.style.transition = 'opacity .18s';
        modal.style.opacity    = '0';
        setTimeout(() => modal.remove(), 200);
    }
}
