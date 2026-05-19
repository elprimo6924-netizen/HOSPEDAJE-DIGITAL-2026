let currentModeRol = 'create';
let currentRolId   = null;

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
    currentRolId   = rolData?.IDRol || rolData?.id || (typeof rolData === 'string' || typeof rolData === 'number' ? rolData : null);

    if (mode === 'edit' && currentRolId && (!rolData || typeof rolData !== 'object')) {
        try {
            const apiUrl = window.API_URL || 'http://localhost:3000/api';
            const res    = await fetch(`${apiUrl}/roles/${currentRolId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            rolData = await res.json();
            rolData = rolData.data || rolData;
        } catch {
            if (typeof showAlert === 'function') showAlert('Error al cargar datos del rol', 'error');
            return;
        }
    }

    // Inyectar estilos una sola vez
    if (!document.getElementById('_rf_styles')) {
        const s = document.createElement('style');
        s.id = '_rf_styles';
        s.textContent = `
            #_rf_overlay { position:fixed; inset:0; background:rgba(15,23,42,.55);
                display:flex; align-items:center; justify-content:center;
                z-index:9999; padding:16px; box-sizing:border-box;
                animation:_rf_bg .2s ease; }
            @keyframes _rf_bg { from{opacity:0} to{opacity:1} }
            @keyframes _rf_up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

            #_rf_box { background:#fff; border-radius:16px; width:100%; max-width:560px;
                max-height:calc(100vh - 32px); display:flex; flex-direction:column;
                box-shadow:0 24px 64px rgba(15,23,42,.22); overflow:hidden;
                animation:_rf_up .25s ease; }

            #_rf_header { padding:22px 26px 18px; border-bottom:1px solid #f1f5f9;
                display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
            #_rf_header h2 { font-size:1.15rem; font-weight:800; color:#0f172a; margin:0;
                display:flex; align-items:center; gap:10px; }
            #_rf_header h2 .rf-icon { width:34px; height:34px; border-radius:9px;
                background:linear-gradient(135deg,#7c3aed,#6d28d9);
                display:inline-flex; align-items:center; justify-content:center;
                color:#fff; font-size:.9rem; flex-shrink:0; }
            #_rf_close { background:none; border:none; cursor:pointer; color:#94a3b8;
                font-size:1.4rem; line-height:1; padding:4px; border-radius:6px;
                transition:color .15s,background .15s; }
            #_rf_close:hover { color:#0f172a; background:#f1f5f9; }

            #_rf_body { overflow-y:auto; flex:1; padding:20px 26px; }

            .rf-section { margin-bottom:20px; }
            .rf-section-title { display:flex; align-items:center; gap:7px;
                font-size:.7rem; font-weight:800; color:#64748b; text-transform:uppercase;
                letter-spacing:.08em; margin-bottom:14px; }
            .rf-section-title::after { content:''; flex:1; height:1px; background:#f1f5f9; }
            .rf-section-title i { color:#7c3aed; font-size:.8rem; }

            .rf-label { font-size:.75rem; font-weight:700; color:#374151;
                letter-spacing:.02em; display:block; margin-bottom:5px; }
            .rf-label .rf-req { color:#ef4444; margin-left:2px; }

            .rf-input-wrap { position:relative; }
            .rf-input-wrap i.rf-pre { position:absolute; left:11px; top:50%;
                transform:translateY(-50%); color:#94a3b8; font-size:.8rem; pointer-events:none; }
            .rf-input { width:100%; box-sizing:border-box; padding:9px 12px 9px 34px;
                border:1.5px solid #e2e8f0; border-radius:9px; font-size:.875rem;
                color:#0f172a; background:#fafafa; font-family:inherit; outline:none;
                transition:border-color .18s,box-shadow .18s,background .18s; }
            .rf-input:focus { border-color:#7c3aed; background:#fff;
                box-shadow:0 0 0 3px rgba(124,58,237,.1); }
            .rf-input:hover:not(:focus) { border-color:#cbd5e1; }

            /* Toggle */
            .rf-toggle-row { display:flex; align-items:center; gap:10px; padding:9px 12px;
                border:1.5px solid #e2e8f0; border-radius:9px; background:#fafafa; cursor:pointer;
                transition:border-color .18s; }
            .rf-toggle-row:hover { border-color:#cbd5e1; }
            .rf-toggle { position:relative; width:40px; height:22px; flex-shrink:0; }
            .rf-toggle input { opacity:0; width:0; height:0; position:absolute; }
            .rf-toggle-track { position:absolute; inset:0; border-radius:999px;
                background:#cbd5e1; cursor:pointer; transition:background .25s; }
            .rf-toggle-track::before { content:''; position:absolute; width:16px; height:16px;
                border-radius:50%; background:#fff; top:3px; left:3px;
                box-shadow:0 1px 3px rgba(0,0,0,.2); transition:transform .25s; }
            .rf-toggle input:checked + .rf-toggle-track { background:#22c55e; }
            .rf-toggle input:checked + .rf-toggle-track::before { transform:translateX(18px); }
            .rf-toggle-lbl { font-size:.83rem; font-weight:700; }
            .rf-toggle-lbl.on  { color:#16a34a; }
            .rf-toggle-lbl.off { color:#94a3b8; }

            /* Permisos grid */
            .rf-perms-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
            .rf-perm-card { display:flex; align-items:center; gap:10px;
                padding:11px 13px; border:1.5px solid #e2e8f0; border-radius:10px;
                background:#fafafa; cursor:pointer;
                transition:border-color .18s, background .18s; }
            .rf-perm-card:hover { border-color:#c4b5fd; background:#faf5ff; }
            .rf-perm-card.selected { border-color:#7c3aed; background:#f5f3ff; }
            .rf-perm-card input[type="checkbox"] { display:none; }
            .rf-perm-check { width:18px; height:18px; border-radius:5px; border:1.5px solid #cbd5e1;
                display:flex; align-items:center; justify-content:center; flex-shrink:0;
                transition:background .18s, border-color .18s; background:#fff; }
            .rf-perm-card.selected .rf-perm-check { background:#7c3aed; border-color:#7c3aed; }
            .rf-perm-check i { color:#fff; font-size:.6rem; display:none; }
            .rf-perm-card.selected .rf-perm-check i { display:block; }
            .rf-perm-icon { width:28px; height:28px; border-radius:7px; background:#ede9fe;
                display:flex; align-items:center; justify-content:center; flex-shrink:0; }
            .rf-perm-icon i { color:#7c3aed; font-size:.8rem; }
            .rf-perm-card.selected .rf-perm-icon { background:#ddd6fe; }
            .rf-perm-name { font-size:.82rem; font-weight:600; color:#374151; }

            /* "Seleccionar todos" row */
            .rf-select-all { display:flex; align-items:center; gap:8px; margin-bottom:10px;
                cursor:pointer; width:fit-content; }
            .rf-select-all-box { width:18px; height:18px; border-radius:5px;
                border:1.5px solid #cbd5e1; display:flex; align-items:center;
                justify-content:center; background:#fff; transition:background .18s,border-color .18s; }
            .rf-select-all-box.all { background:#7c3aed; border-color:#7c3aed; }
            .rf-select-all-box i { color:#fff; font-size:.6rem; display:none; }
            .rf-select-all-box.all i { display:block; }
            .rf-select-all-lbl { font-size:.78rem; font-weight:600; color:#64748b; }

            #_rf_footer { padding:16px 26px; border-top:1px solid #f1f5f9;
                display:flex; gap:10px; justify-content:flex-end; flex-shrink:0; background:#fff; }
            .rf-btn-cancel { padding:10px 20px; border-radius:9px; background:#f8fafc;
                color:#475569; font-weight:600; font-size:.85rem;
                border:1.5px solid #e2e8f0; cursor:pointer; transition:all .15s; }
            .rf-btn-cancel:hover { background:#f1f5f9; border-color:#cbd5e1; }
            .rf-btn-submit { padding:10px 26px; border-radius:9px;
                background:linear-gradient(135deg,#7c3aed,#6d28d9);
                color:#fff; font-weight:700; font-size:.85rem; border:none;
                cursor:pointer; box-shadow:0 4px 14px rgba(124,58,237,.3);
                transition:opacity .15s,transform .15s;
                display:flex; align-items:center; gap:7px; }
            .rf-btn-submit:hover { opacity:.9; transform:translateY(-1px); }
            .rf-btn-submit:disabled { opacity:.6; cursor:not-allowed; transform:none; }

            @media(max-width:480px){ .rf-perms-grid{ grid-template-columns:1fr; } }
        `;
        document.head.appendChild(s);
    }

    const isCreate = mode === 'create';

    const overlay = document.createElement('div');
    overlay.id = '_rf_overlay';
    overlay.innerHTML = `
        <div id="_rf_box">
            <div id="_rf_header">
                <h2>
                    <span class="rf-icon"><i class="fa-solid fa-${isCreate ? 'plus' : 'pen-to-square'}"></i></span>
                    ${isCreate ? 'Crear nuevo rol' : 'Editar rol'}
                </h2>
                <button id="_rf_close" title="Cerrar">&times;</button>
            </div>

            <div id="_rf_body">
                <form id="_rf_form" novalidate autocomplete="off">

                    <div class="rf-section">
                        <div class="rf-section-title">
                            <i class="fa-solid fa-tag"></i> Información del rol
                        </div>
                        <div style="display:flex;flex-direction:column;gap:12px;">
                            <div>
                                <label class="rf-label">Nombre del rol <span class="rf-req">*</span></label>
                                <div class="rf-input-wrap">
                                    <i class="fa-solid fa-tag rf-pre"></i>
                                    <input type="text" name="Nombre" required
                                        placeholder="Ej: Gestor de Reservas"
                                        class="rf-input"
                                        ${isProtected && !isCreate ? 'disabled' : ''}>
                                </div>
                            </div>
                            <div>
                                <label class="rf-label">Estado de la cuenta</label>
                                <label class="rf-toggle-row" for="_rf_active">
                                    <span class="rf-toggle">
                                        <input type="checkbox" id="_rf_active" ${isCreate ? 'checked' : ''} ${isProtected && !isCreate ? 'disabled' : ''}>
                                        <span class="rf-toggle-track"></span>
                                    </span>
                                    <span id="_rf_active_lbl" class="rf-toggle-lbl ${isCreate ? 'on' : 'off'}">
                                        ${isCreate ? 'Activo' : 'Inactivo'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="rf-section">
                        <div class="rf-section-title">
                            <i class="fa-solid fa-lock"></i> Permisos de acceso
                        </div>
                        <div class="rf-select-all" id="_rf_select_all">
                            <div class="rf-select-all-box" id="_rf_select_all_box">
                                <i class="fa-solid fa-check"></i>
                            </div>
                            <span class="rf-select-all-lbl">Seleccionar todos los módulos</span>
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
                    </div>

                </form>
            </div>

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

    // Toggle activo/inactivo
    const activeCheck = overlay.querySelector('#_rf_active');
    const activeLbl   = overlay.querySelector('#_rf_active_lbl');
    if (activeCheck && activeCheck.type !== 'hidden') {
        activeCheck.addEventListener('change', () => {
            activeLbl.textContent = activeCheck.checked ? 'Activo' : 'Inactivo';
            activeLbl.className   = `rf-toggle-lbl ${activeCheck.checked ? 'on' : 'off'}`;
        });
    }

    // Lógica de tarjetas de permisos
    const permCards = overlay.querySelectorAll('.rf-perm-card');
    const selectAllBtn = overlay.querySelector('#_rf_select_all');
    const selectAllBox = overlay.querySelector('#_rf_select_all_box');

    const syncSelectAll = () => {
        const allChecked = Array.from(permCards).every(c => c.classList.contains('selected'));
        selectAllBox.classList.toggle('all', allChecked);
    };

    permCards.forEach(card => {
        card.addEventListener('click', () => {
            const cb = card.querySelector('.rf-perm-cb');
            cb.checked = !cb.checked;
            card.classList.toggle('selected', cb.checked);
            syncSelectAll();
        });
    });

    selectAllBtn.addEventListener('click', () => {
        const allSelected = Array.from(permCards).every(c => c.classList.contains('selected'));
        permCards.forEach(card => {
            const cb = card.querySelector('.rf-perm-cb');
            cb.checked = !allSelected;
            card.classList.toggle('selected', !allSelected);
        });
        selectAllBox.classList.toggle('all', !allSelected);
    });

    // Pre-rellenar en modo edición
    if (mode === 'edit' && rolData) {
        const nombreInput = overlay.querySelector('input[name="Nombre"]');
        const nombre = rolData.NombreRol || rolData.Nombre || rolData.nombre || '';
        if (nombreInput) nombreInput.value = nombre;

        const activo = rolData.IsActive === 1 || rolData.IsActive === true || rolData.Estado === 'Activo';
        if (activeCheck) {
            activeCheck.checked = activo;
            activeLbl.textContent = activo ? 'Activo' : 'Inactivo';
            activeLbl.className   = `rf-toggle-lbl ${activo ? 'on' : 'off'}`;
        }

        // Cargar permisos existentes
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
        syncSelectAll();
    }

    // Cierre
    const close = () => closeRolForm();
    overlay.querySelector('#_rf_cancel').addEventListener('click', close);
    overlay.querySelector('#_rf_close').addEventListener('click', close);
    const onEsc = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
    document.addEventListener('keydown', onEsc);

    // Submit
    overlay.querySelector('#_rf_form').addEventListener('submit', async e => {
        e.preventDefault();
        await saveRol(token, onSave);
    });
}

async function saveRol(token, onSave) {
    const btn = document.getElementById('_rf_submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…'; }

    try {
        const form   = document.getElementById('_rf_form');
        const nombre = form.elements['Nombre']?.value?.trim();

        if (!nombre) {
            if (typeof showAlert === 'function') showAlert('El nombre del rol es obligatorio', 'warning');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-${currentModeRol === 'create' ? 'plus' : 'floppy-disk'}"></i> ${currentModeRol === 'create' ? 'Crear rol' : 'Guardar cambios'}`;
            }
            return;
        }

        const activeCheck = document.getElementById('_rf_active');
        const isActive    = activeCheck ? (activeCheck.checked ? 1 : 0) : 1;

        const permisos = Array.from(form.querySelectorAll('.rf-perm-cb:checked'))
            .map(cb => Number(cb.value));

        if (currentModeRol === 'create' && permisos.length === 0) {
            if (typeof showAlert === 'function') showAlert('Debes asignar al menos un permiso al rol antes de guardarlo.', 'warning');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-plus"></i> Crear rol';
            }
            return;
        }

        const data = {
            Nombre:   nombre,
            IsActive: isActive,
            Estado:   isActive ? 'Activo' : 'Inactivo',
            Permisos: permisos,
        };

        const apiUrl = window.API_URL || 'http://localhost:3000/api';
        const url    = currentModeRol === 'create' ? `${apiUrl}/roles` : `${apiUrl}/roles/${currentRolId}`;
        const method = currentModeRol === 'create' ? 'POST' : 'PUT';

        const res     = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || resData.error || resData.detalle || 'Error en la operación');

        const msg = `Rol ${currentModeRol === 'create' ? 'creado' : 'actualizado'} exitosamente`;
        if (typeof showAlert === 'function') showAlert(msg, 'success');
        closeRolForm();
        if (onSave) onSave();

    } catch (error) {
        if (typeof showAlert === 'function') showAlert(error.message, 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-${currentModeRol === 'create' ? 'plus' : 'floppy-disk'}"></i> ${currentModeRol === 'create' ? 'Crear rol' : 'Guardar cambios'}`;
        }
    }
}

function closeRolForm() {
    const modal = document.getElementById('_rf_overlay');
    if (modal) {
        modal.style.transition = 'opacity .2s';
        modal.style.opacity    = '0';
        setTimeout(() => modal.remove(), 200);
    }
}
