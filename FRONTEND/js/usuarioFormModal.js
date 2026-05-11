let currentMode = 'create';
let currentUsuarioId = null;

async function openUsuarioForm(mode = 'create', usuarioData = null, token, onSave) {
    if (mode === 'edit' && (usuarioData?.IDUsuario === 1 || usuarioData?.id === 1)) {
        if (typeof showAlert === 'function') showAlert('El Super Administrador no puede ser editado.', 'warning');
        return;
    }

    currentMode = mode;
    currentUsuarioId = usuarioData?.IDUsuario || usuarioData?.id || null;

    // Inyectar estilos del formulario una sola vez
    if (!document.getElementById('_uf_styles')) {
        const s = document.createElement('style');
        s.id = '_uf_styles';
        s.textContent = `
            #_uf_overlay { position:fixed; inset:0; background:rgba(15,23,42,.55);
                display:flex; align-items:center; justify-content:center;
                z-index:9999; padding:16px; box-sizing:border-box;
                animation:_uf_bg .2s ease; }
            @keyframes _uf_bg  { from{opacity:0} to{opacity:1} }
            @keyframes _uf_up  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

            #_uf_box { background:#fff; border-radius:16px; width:100%; max-width:600px;
                max-height:calc(100vh - 32px); display:flex; flex-direction:column;
                box-shadow:0 24px 64px rgba(15,23,42,.22); overflow:hidden;
                animation:_uf_up .25s ease; }

            #_uf_header { padding:22px 26px 18px; border-bottom:1px solid #f1f5f9;
                display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
            #_uf_header h2 { font-size:1.15rem; font-weight:800; color:#0f172a; margin:0;
                display:flex; align-items:center; gap:10px; }
            #_uf_header h2 span.uf-icon { width:34px; height:34px; border-radius:9px;
                background:linear-gradient(135deg,#c2410c,#ea580c);
                display:inline-flex; align-items:center; justify-content:center;
                color:#fff; font-size:.9rem; flex-shrink:0; }
            #_uf_close { background:none; border:none; cursor:pointer; color:#94a3b8;
                font-size:1.4rem; line-height:1; padding:4px; border-radius:6px;
                transition:color .15s,background .15s; }
            #_uf_close:hover { color:#0f172a; background:#f1f5f9; }

            #_uf_body { overflow-y:auto; flex:1; padding:20px 26px; }

            .uf-section { margin-bottom:18px; }
            .uf-section-title { display:flex; align-items:center; gap:7px;
                font-size:.7rem; font-weight:800; color:#64748b; text-transform:uppercase;
                letter-spacing:.08em; margin-bottom:14px; }
            .uf-section-title::after { content:''; flex:1; height:1px; background:#f1f5f9; }
            .uf-section-title i { color:#c2410c; font-size:.8rem; }

            .uf-grid  { display:grid; gap:12px; }
            .uf-col2  { grid-template-columns:1fr 1fr; }
            .uf-span2 { grid-column:span 2; }

            .uf-field { display:flex; flex-direction:column; gap:5px; }
            .uf-label { font-size:.75rem; font-weight:700; color:#374151; letter-spacing:.02em; }
            .uf-label .uf-req { color:#ef4444; margin-left:2px; }

            .uf-input-wrap { position:relative; }
            .uf-input-wrap i.uf-pre { position:absolute; left:11px; top:50%; transform:translateY(-50%);
                color:#94a3b8; font-size:.8rem; pointer-events:none; }
            .uf-input { width:100%; box-sizing:border-box; padding:9px 12px;
                border:1.5px solid #e2e8f0; border-radius:9px; font-size:.875rem;
                color:#0f172a; background:#fafafa; font-family:inherit; outline:none;
                transition:border-color .18s, box-shadow .18s, background .18s; }
            .uf-input.has-pre { padding-left:34px; }
            .uf-input.has-suf { padding-right:38px; }
            .uf-input:focus { border-color:#c2410c; background:#fff;
                box-shadow:0 0 0 3px rgba(194,65,12,.1); }
            .uf-input:hover:not(:focus) { border-color:#cbd5e1; }
            select.uf-input { cursor:pointer; }

            .uf-eye { position:absolute; right:10px; top:50%; transform:translateY(-50%);
                background:none; border:none; cursor:pointer; color:#94a3b8;
                padding:4px; font-size:.85rem; line-height:1;
                transition:color .15s; }
            .uf-eye:hover { color:#475569; }

            .uf-hint { font-size:.7rem; color:#94a3b8; margin-top:2px; }

            /* Toggle de estado */
            .uf-toggle-row { display:flex; align-items:center; gap:10px; padding:9px 12px;
                border:1.5px solid #e2e8f0; border-radius:9px; background:#fafafa;
                cursor:pointer; transition:border-color .18s; }
            .uf-toggle-row:hover { border-color:#cbd5e1; }
            .uf-toggle { position:relative; width:40px; height:22px; flex-shrink:0; }
            .uf-toggle input { opacity:0; width:0; height:0; position:absolute; }
            .uf-toggle-track { position:absolute; inset:0; border-radius:999px;
                background:#cbd5e1; cursor:pointer; transition:background .25s; }
            .uf-toggle-track::before { content:''; position:absolute; width:16px; height:16px;
                border-radius:50%; background:#fff; top:3px; left:3px;
                box-shadow:0 1px 3px rgba(0,0,0,.2); transition:transform .25s; }
            .uf-toggle input:checked + .uf-toggle-track { background:#22c55e; }
            .uf-toggle input:checked + .uf-toggle-track::before { transform:translateX(18px); }
            .uf-toggle-label { font-size:.83rem; font-weight:700; }
            .uf-toggle-label.on  { color:#16a34a; }
            .uf-toggle-label.off { color:#94a3b8; }

            #_uf_footer { padding:16px 26px; border-top:1px solid #f1f5f9;
                display:flex; gap:10px; justify-content:flex-end;
                flex-shrink:0; background:#fff; }
            .uf-btn-cancel { padding:10px 20px; border-radius:9px; background:#f8fafc;
                color:#475569; font-weight:600; font-size:.85rem;
                border:1.5px solid #e2e8f0; cursor:pointer; transition:all .15s; }
            .uf-btn-cancel:hover { background:#f1f5f9; border-color:#cbd5e1; }
            .uf-btn-submit { padding:10px 26px; border-radius:9px;
                background:linear-gradient(135deg,#c2410c,#ea580c);
                color:#fff; font-weight:700; font-size:.85rem; border:none;
                cursor:pointer; box-shadow:0 4px 14px rgba(194,65,12,.3);
                transition:opacity .15s, transform .15s; display:flex; align-items:center; gap:7px; }
            .uf-btn-submit:hover { opacity:.9; transform:translateY(-1px); }
            .uf-btn-submit:disabled { opacity:.6; cursor:not-allowed; transform:none; }

            @media (max-width:520px) {
                .uf-col2  { grid-template-columns:1fr; }
                .uf-span2 { grid-column:span 1; }
            }
        `;
        document.head.appendChild(s);
    }

    const isCreate = mode === 'create';

    const overlay = document.createElement('div');
    overlay.id = '_uf_overlay';
    overlay.innerHTML = `
        <div id="_uf_box">
            <!-- Header -->
            <div id="_uf_header">
                <h2>
                    <span class="uf-icon"><i class="fa-solid fa-${isCreate ? 'user-plus' : 'user-pen'}"></i></span>
                    ${isCreate ? 'Crear nuevo usuario' : 'Editar usuario'}
                </h2>
                <button id="_uf_close" title="Cerrar">&times;</button>
            </div>

            <!-- Body -->
            <div id="_uf_body">
                <form id="_uf_form" novalidate autocomplete="off">

                    <!-- Identificación -->
                    <div class="uf-section">
                        <div class="uf-section-title">
                            <i class="fa-solid fa-id-card"></i> Identificación
                        </div>
                        <div class="uf-grid uf-col2">
                            <div class="uf-field">
                                <label class="uf-label">Tipo de documento <span class="uf-req">*</span></label>
                                <div class="uf-input-wrap">
                                    <select name="TipoDocumento" required class="uf-input">
                                        <option value="">— Selecciona —</option>
                                        <option value="CC">Cédula de Ciudadanía</option>
                                        <option value="CE">Cédula de Extranjería</option>
                                        <option value="PA">Pasaporte</option>
                                        <option value="NIT">NIT</option>
                                        <option value="TI">Tarjeta de Identidad</option>
                                    </select>
                                </div>
                            </div>
                            <div class="uf-field">
                                <label class="uf-label">Número de documento <span class="uf-req">*</span></label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-hashtag uf-pre"></i>
                                    <input type="text" name="NumeroDocumento" required
                                        placeholder="1234567890"
                                        class="uf-input has-pre">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Información personal -->
                    <div class="uf-section">
                        <div class="uf-section-title">
                            <i class="fa-solid fa-user"></i> Información personal
                        </div>
                        <div class="uf-grid uf-col2">
                            <div class="uf-field">
                                <label class="uf-label">Nombre <span class="uf-req">*</span></label>
                                <div class="uf-input-wrap">
                                    <input type="text" name="NombreUsuario" required
                                        placeholder="Ej: Juan"
                                        class="uf-input">
                                </div>
                            </div>
                            <div class="uf-field">
                                <label class="uf-label">Apellido <span class="uf-req">*</span></label>
                                <div class="uf-input-wrap">
                                    <input type="text" name="Apellido" required
                                        placeholder="Ej: Pérez"
                                        class="uf-input">
                                </div>
                            </div>
                            <div class="uf-field">
                                <label class="uf-label">Teléfono</label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-phone uf-pre"></i>
                                    <input type="tel" name="Telefono"
                                        placeholder="3001234567"
                                        class="uf-input has-pre">
                                </div>
                            </div>
                            <div class="uf-field">
                                <label class="uf-label">País</label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-globe uf-pre"></i>
                                    <input type="text" name="Pais"
                                        placeholder="Colombia"
                                        class="uf-input has-pre">
                                </div>
                            </div>
                            <div class="uf-field uf-span2">
                                <label class="uf-label">Dirección</label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-location-dot uf-pre"></i>
                                    <input type="text" name="Direccion"
                                        placeholder="Calle 123 #45-67"
                                        class="uf-input has-pre">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Acceso -->
                    <div class="uf-section">
                        <div class="uf-section-title">
                            <i class="fa-solid fa-lock"></i> Acceso y permisos
                        </div>
                        <div class="uf-grid uf-col2">
                            <div class="uf-field ${isCreate ? '' : 'uf-span2'}">
                                <label class="uf-label">Correo electrónico <span class="uf-req">*</span></label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-envelope uf-pre"></i>
                                    <input type="email" name="Email" required
                                        placeholder="correo@ejemplo.com"
                                        class="uf-input has-pre">
                                </div>
                            </div>
                            ${isCreate ? `
                            <div class="uf-field">
                                <label class="uf-label">Contraseña <span class="uf-req">*</span></label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-key uf-pre"></i>
                                    <input type="password" name="Contrasena" id="_uf_pwd" required
                                        placeholder="Mínimo 6 caracteres"
                                        class="uf-input has-pre has-suf">
                                    <button type="button" class="uf-eye" id="_uf_eye" title="Mostrar/ocultar">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                </div>
                                <span class="uf-hint">Usa letras, números y símbolos</span>
                            </div>
                            ` : ''}
                            <div class="uf-field">
                                <label class="uf-label">Rol asignado <span class="uf-req">*</span></label>
                                <div class="uf-input-wrap">
                                    <select name="IDRol" id="_uf_roles" required class="uf-input">
                                        <option value="">Cargando roles…</option>
                                    </select>
                                </div>
                            </div>
                            <div class="uf-field">
                                <label class="uf-label">Estado de la cuenta</label>
                                <label class="uf-toggle-row" for="_uf_active">
                                    <span class="uf-toggle">
                                        <input type="checkbox" name="IsActive" id="_uf_active" ${isCreate ? 'checked' : ''}>
                                        <span class="uf-toggle-track"></span>
                                    </span>
                                    <span id="_uf_active_lbl" class="uf-toggle-label ${isCreate ? 'on' : 'off'}">
                                        ${isCreate ? 'Activo' : 'Inactivo'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                </form>
            </div>

            <!-- Footer -->
            <div id="_uf_footer">
                <button type="button" class="uf-btn-cancel" id="_uf_cancel">Cancelar</button>
                <button type="submit" form="_uf_form" class="uf-btn-submit" id="_uf_submit">
                    <i class="fa-solid fa-${isCreate ? 'plus' : 'floppy-disk'}"></i>
                    ${isCreate ? 'Crear usuario' : 'Guardar cambios'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Toggle mostrar/ocultar contraseña
    const eyeBtn = overlay.querySelector('#_uf_eye');
    const pwdInput = overlay.querySelector('#_uf_pwd');
    if (eyeBtn && pwdInput) {
        eyeBtn.addEventListener('click', () => {
            const visible = pwdInput.type === 'text';
            pwdInput.type = visible ? 'password' : 'text';
            eyeBtn.querySelector('i').className = `fa-solid fa-eye${visible ? '' : '-slash'}`;
        });
    }

    // Toggle estado activo/inactivo
    const activeCheck = overlay.querySelector('#_uf_active');
    const activeLbl   = overlay.querySelector('#_uf_active_lbl');
    activeCheck.addEventListener('change', () => {
        activeLbl.textContent = activeCheck.checked ? 'Activo' : 'Inactivo';
        activeLbl.className   = `uf-toggle-label ${activeCheck.checked ? 'on' : 'off'}`;
    });

    // Cargar roles (solo activos, sin duplicados)
    const rolesSelect = overlay.querySelector('#_uf_roles');
    try {
        const apiUrl = window.API_URL || 'http://localhost:3000/api';
        const res    = await fetch(`${apiUrl}/roles?page=1&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        const raw    = Array.isArray(result) ? result : (result.data || []);

        // Filtrar: solo activos, deduplicar por nombre
        const seen = new Set();
        const list = raw.filter(r => {
            const nombre = (r.Nombre || r.NombreRol || '').trim();
            if (!nombre) return false;
            if (Number(r.IsActive) === 0) return false;   // excluir inactivos
            if (seen.has(nombre.toLowerCase())) return false; // excluir duplicados
            seen.add(nombre.toLowerCase());
            return true;
        });

        rolesSelect.innerHTML = '<option value="">— Selecciona un rol —</option>' +
            list.map(r => `<option value="${r.IDRol}">${r.Nombre || r.NombreRol}</option>`).join('');
    } catch {
        rolesSelect.innerHTML = '<option value="">Error al cargar roles</option>';
    }

    // Pre-rellenar en modo edición
    if (mode === 'edit' && usuarioData) {
        const form = overlay.querySelector('#_uf_form');
        Object.keys(usuarioData).forEach(key => {
            const el = form.elements[key];
            if (!el) return;
            if (el.type === 'checkbox') {
                el.checked = Number(usuarioData[key]) === 1;
                if (key === 'IsActive') {
                    activeLbl.textContent = el.checked ? 'Activo' : 'Inactivo';
                    activeLbl.className   = `uf-toggle-label ${el.checked ? 'on' : 'off'}`;
                }
            } else {
                el.value = usuarioData[key] ?? '';
            }
        });
    }

    // Eventos de cierre
    const close = () => closeUsuarioForm();
    overlay.querySelector('#_uf_cancel').addEventListener('click', close);
    overlay.querySelector('#_uf_close').addEventListener('click', close);

    const onEsc = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
    document.addEventListener('keydown', onEsc);

    // Submit
    overlay.querySelector('#_uf_form').addEventListener('submit', async e => {
        e.preventDefault();
        await saveUsuario(token, onSave);
    });
}

async function saveUsuario(token, onSave) {
    const btn = document.getElementById('_uf_submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…'; }

    try {
        const form     = document.getElementById('_uf_form');
        const formData = new FormData(form);
        const data     = Object.fromEntries(formData.entries());

        data.IsActive = document.getElementById('_uf_active')?.checked ? 1 : 0;
        if (data.IDRol) data.IDRol = Number(data.IDRol);

        const apiUrl = window.API_URL || 'http://localhost:3000/api';
        const method = currentMode === 'create' ? 'POST' : 'PUT';
        const url    = currentMode === 'create'
            ? `${apiUrl}/usuarios`
            : `${apiUrl}/usuarios/${currentUsuarioId}`;

        const res     = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || resData.error || resData.detalle || 'Error en la operación');

        const msgOk = `Usuario ${currentMode === 'create' ? 'creado' : 'actualizado'} exitosamente`;
        if (typeof showAlert === 'function') showAlert(msgOk, 'success');
        closeUsuarioForm();
        if (onSave) onSave();

    } catch (error) {
        if (typeof showAlert === 'function') showAlert(error.message, 'error');
        if (btn) {
            const isCreate = currentMode === 'create';
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-${isCreate ? 'plus' : 'floppy-disk'}"></i> ${isCreate ? 'Crear usuario' : 'Guardar cambios'}`;
        }
    }
}

function closeUsuarioForm() {
    const modal = document.getElementById('_uf_overlay');
    if (modal) {
        modal.style.animation = 'none';
        modal.style.opacity   = '0';
        modal.style.transition = 'opacity .2s';
        setTimeout(() => modal.remove(), 200);
    }
}
