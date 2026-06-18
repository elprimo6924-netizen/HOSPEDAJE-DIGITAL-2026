let currentMode = 'create';
let currentUsuarioId = null;
let _ufExistingUsers = [];

async function openUsuarioForm(mode = 'create', usuarioData = null, token, onSave, existingUsers = []) {
    _ufExistingUsers = Array.isArray(existingUsers) ? existingUsers : [];
    if (mode === 'edit' && (usuarioData?.IDUsuario === 1 || usuarioData?.id === 1)) {
        if (typeof showAlert === 'function') showAlert('El Super Administrador no puede ser editado.', 'warning');
        return;
    }

    currentMode = mode;
    currentUsuarioId = usuarioData?.IDUsuario || usuarioData?.id || null;

    if (!document.getElementById('_uf_styles')) {
        const s = document.createElement('style');
        s.id = '_uf_styles';
        s.textContent = `
            #_uf_overlay {
                position:fixed; inset:0; background:rgba(15,23,42,.6);
                display:flex; align-items:center; justify-content:center;
                z-index:9999; padding:16px; box-sizing:border-box;
                animation:_uf_bg .2s ease;
            }
            @keyframes _uf_bg { from{opacity:0} to{opacity:1} }
            @keyframes _uf_up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

            #_uf_box {
                background:#fff; border-radius:20px; width:100%; max-width:620px;
                max-height:calc(100vh - 32px); display:flex; flex-direction:column;
                box-shadow:0 32px 80px rgba(15,23,42,.28); overflow:hidden;
                animation:_uf_up .28s cubic-bezier(.22,.68,0,1.2);
            }

            /* Header */
            #_uf_header {
                padding:0; flex-shrink:0;
                background:linear-gradient(135deg,#1a2e1a 0%,#2d4a2d 100%);
                position:relative; overflow:hidden;
            }
            #_uf_header::before {
                content:''; position:absolute; inset:0;
                background:radial-gradient(ellipse at 80% 50%, rgba(232,116,59,.18) 0%, transparent 65%);
                pointer-events:none;
            }
            #_uf_header-inner {
                display:flex; align-items:center; gap:14px;
                padding:20px 24px 18px; position:relative; z-index:1;
            }
            .uf-hdr-icon {
                width:46px; height:46px; border-radius:13px; flex-shrink:0;
                background:linear-gradient(135deg,#e8743b,#d45a22);
                display:flex; align-items:center; justify-content:center;
                color:#fff; font-size:1.1rem;
                box-shadow:0 4px 14px rgba(232,116,59,.4);
            }
            .uf-hdr-text h2 {
                font-size:1.1rem; font-weight:800; color:#fff; margin:0 0 3px;
                letter-spacing:-.01em;
            }
            .uf-hdr-text p {
                font-size:.74rem; color:rgba(255,255,255,.5); margin:0;
            }
            #_uf_close {
                margin-left:auto; background:rgba(255,255,255,.1); border:none;
                cursor:pointer; color:rgba(255,255,255,.7); font-size:1.2rem;
                width:34px; height:34px; border-radius:8px; display:flex;
                align-items:center; justify-content:center;
                transition:background .15s,color .15s; flex-shrink:0;
            }
            #_uf_close:hover { background:rgba(255,255,255,.2); color:#fff; }

            /* Body */
            #_uf_body { overflow-y:auto; flex:1; padding:22px 24px 6px; }

            /* Sections */
            .uf-section { margin-bottom:20px; }
            .uf-section-title {
                display:flex; align-items:center; gap:8px;
                font-size:.68rem; font-weight:800; color:#64748b;
                text-transform:uppercase; letter-spacing:.09em; margin-bottom:14px;
                padding-bottom:8px; border-bottom:1.5px solid #f1f5f9;
            }
            .uf-section-title .uf-stitle-icon {
                width:22px; height:22px; border-radius:6px;
                background:linear-gradient(135deg,#e8743b,#d45a22);
                display:inline-flex; align-items:center; justify-content:center;
                color:#fff; font-size:.62rem; flex-shrink:0;
            }

            /* Grid */
            .uf-grid  { display:grid; gap:14px; }
            .uf-col2  { grid-template-columns:1fr 1fr; }
            .uf-span2 { grid-column:span 2; }

            /* Fields */
            .uf-field { display:flex; flex-direction:column; gap:4px; }
            .uf-label {
                font-size:.74rem; font-weight:700; color:#374151;
                letter-spacing:.015em; display:flex; align-items:center; gap:4px;
            }
            .uf-req { color:#ef4444; font-size:.8rem; }

            /* Inputs */
            .uf-input-wrap { position:relative; }
            .uf-input-wrap .uf-pre {
                position:absolute; left:12px; top:50%; transform:translateY(-50%);
                color:#94a3b8; font-size:.78rem; pointer-events:none; z-index:1;
            }
            .uf-input {
                width:100%; box-sizing:border-box; padding:10px 13px;
                border:1.5px solid #e2e8f0; border-radius:10px; font-size:.86rem;
                color:#0f172a; background:#fafafa; font-family:inherit; outline:none;
                transition:border-color .18s, box-shadow .18s, background .18s;
                -webkit-appearance:none; appearance:none;
            }
            .uf-input.has-pre { padding-left:36px; }
            .uf-input.has-suf { padding-right:40px; }
            .uf-input:focus {
                border-color:#e8743b; background:#fff;
                box-shadow:0 0 0 3px rgba(232,116,59,.12);
            }
            .uf-input:hover:not(:focus) { border-color:#cbd5e1; background:#fff; }
            .uf-input.uf-error { border-color:#ef4444 !important; box-shadow:0 0 0 3px rgba(239,68,68,.1) !important; }
            select.uf-input { cursor:pointer; }
            .uf-input:disabled { opacity:.55; cursor:not-allowed; background:#f8fafc; }

            /* Eye toggle */
            .uf-eye {
                position:absolute; right:11px; top:50%; transform:translateY(-50%);
                background:none; border:none; cursor:pointer; color:#94a3b8;
                padding:4px; font-size:.82rem; line-height:1; transition:color .15s; z-index:1;
            }
            .uf-eye:hover { color:#475569; }

            /* Error msg */
            .uf-err-msg {
                font-size:.69rem; color:#ef4444; font-weight:600;
                display:flex; align-items:center; gap:4px; margin-top:2px;
            }
            .uf-err-msg i { font-size:.65rem; }

            /* Hint */
            .uf-hint { font-size:.69rem; color:#94a3b8; }

            /* Strength bar */
            .uf-strength-bar {
                height:3px; border-radius:2px; background:#f1f5f9;
                overflow:hidden; margin-top:5px;
            }
            .uf-strength-fill {
                height:100%; width:0; border-radius:2px;
                transition:width .3s, background .3s;
            }
            .uf-strength-text { font-size:.67rem; color:#94a3b8; margin-top:2px; }

            /* Toggle estado */
            .uf-toggle-row {
                display:flex; align-items:center; gap:12px; padding:10px 13px;
                border:1.5px solid #e2e8f0; border-radius:10px; background:#fafafa;
                cursor:pointer; transition:border-color .18s, background .18s;
            }
            .uf-toggle-row:hover { border-color:#cbd5e1; background:#fff; }
            .uf-toggle-wrap { position:relative; width:42px; height:23px; flex-shrink:0; }
            .uf-toggle-wrap input { opacity:0; width:0; height:0; position:absolute; }
            .uf-toggle-track {
                position:absolute; inset:0; border-radius:999px;
                background:#cbd5e1; cursor:pointer; transition:background .25s;
            }
            .uf-toggle-track::before {
                content:''; position:absolute; width:17px; height:17px;
                border-radius:50%; background:#fff; top:3px; left:3px;
                box-shadow:0 1px 4px rgba(0,0,0,.22); transition:transform .25s;
            }
            .uf-toggle-wrap input:checked + .uf-toggle-track { background:#22c55e; }
            .uf-toggle-wrap input:checked + .uf-toggle-track::before { transform:translateX(19px); }
            .uf-toggle-lbl { font-size:.83rem; font-weight:700; }
            .uf-toggle-lbl.on  { color:#16a34a; }
            .uf-toggle-lbl.off { color:#94a3b8; }
            .uf-toggle-dot {
                width:7px; height:7px; border-radius:50%; flex-shrink:0;
                transition:background .25s;
            }
            .uf-toggle-dot.on  { background:#22c55e; }
            .uf-toggle-dot.off { background:#94a3b8; }

            /* Roles skeleton */
            .uf-roles-loading {
                display:flex; align-items:center; gap:8px; padding:10px 13px;
                border:1.5px solid #e2e8f0; border-radius:10px; background:#fafafa;
                color:#94a3b8; font-size:.82rem;
            }
            .uf-roles-loading .spin { animation:_uf_spin .7s linear infinite; display:inline-block; }
            @keyframes _uf_spin { to { transform:rotate(360deg); } }

            /* Footer */
            #_uf_footer {
                padding:16px 24px; border-top:1.5px solid #f1f5f9;
                display:flex; gap:10px; justify-content:flex-end;
                flex-shrink:0; background:#fff;
            }
            .uf-btn-cancel {
                padding:10px 22px; border-radius:10px; background:#f8fafc;
                color:#475569; font-weight:600; font-size:.85rem;
                border:1.5px solid #e2e8f0; cursor:pointer; transition:all .15s;
            }
            .uf-btn-cancel:hover { background:#f1f5f9; border-color:#cbd5e1; color:#334155; }
            .uf-btn-submit {
                padding:10px 26px; border-radius:10px;
                background:linear-gradient(135deg,#e8743b,#d45a22);
                color:#fff; font-weight:700; font-size:.85rem; border:none;
                cursor:pointer; box-shadow:0 4px 14px rgba(232,116,59,.35);
                transition:opacity .15s, transform .15s, box-shadow .15s;
                display:flex; align-items:center; gap:8px;
            }
            .uf-btn-submit:hover:not(:disabled) {
                opacity:.92; transform:translateY(-1px);
                box-shadow:0 6px 20px rgba(232,116,59,.4);
            }
            .uf-btn-submit:disabled { opacity:.6; cursor:not-allowed; transform:none; box-shadow:none; }

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
                <div id="_uf_header-inner">
                    <span class="uf-hdr-icon">
                        <i class="fa-solid fa-${isCreate ? 'user-plus' : 'user-pen'}"></i>
                    </span>
                    <div class="uf-hdr-text">
                        <h2>${isCreate ? 'Crear nuevo usuario' : 'Editar usuario'}</h2>
                        <p>${isCreate ? 'Completa los datos para registrar un nuevo acceso.' : 'Modifica los datos del usuario seleccionado.'}</p>
                    </div>
                    <button id="_uf_close" title="Cerrar" aria-label="Cerrar">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <!-- Body -->
            <div id="_uf_body">
                <form id="_uf_form" novalidate autocomplete="off">
                    <!-- Honeypot para engañar al autocompletar del navegador -->
                    <input type="text"     style="display:none;position:absolute;left:-9999px" tabindex="-1" aria-hidden="true" autocomplete="username">
                    <input type="password" style="display:none;position:absolute;left:-9999px" tabindex="-1" aria-hidden="true" autocomplete="current-password">

                    <!-- Identificación -->
                    <div class="uf-section">
                        <div class="uf-section-title">
                            <span class="uf-stitle-icon"><i class="fa-solid fa-id-card"></i></span>
                            Identificación
                        </div>
                        <div class="uf-grid uf-col2">
                            <div class="uf-field" id="_uf_fld_TipoDocumento">
                                <label class="uf-label">
                                    Tipo de documento <span class="uf-req">*</span>
                                </label>
                                <div class="uf-input-wrap">
                                    <select name="TipoDocumento" required class="uf-input" autocomplete="off">
                                        <option value="">— Selecciona —</option>
                                        <option value="CC">Cédula de Ciudadanía</option>
                                        <option value="CE">Cédula de Extranjería</option>
                                        <option value="PA">Pasaporte</option>
                                        <option value="NIT">NIT</option>
                                        <option value="TI">Tarjeta de Identidad</option>
                                    </select>
                                </div>
                            </div>
                            <div class="uf-field" id="_uf_fld_NumeroDocumento">
                                <label class="uf-label">
                                    Número de documento <span class="uf-req">*</span>
                                </label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-hashtag uf-pre"></i>
                                    <input type="text" name="NumeroDocumento" required
                                        placeholder="1234567890"
                                        autocomplete="off"
                                        class="uf-input has-pre">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Información personal -->
                    <div class="uf-section">
                        <div class="uf-section-title">
                            <span class="uf-stitle-icon"><i class="fa-solid fa-user"></i></span>
                            Información personal
                        </div>
                        <div class="uf-grid uf-col2">
                            <div class="uf-field" id="_uf_fld_NombreUsuario">
                                <label class="uf-label">
                                    Nombre <span class="uf-req">*</span>
                                </label>
                                <div class="uf-input-wrap">
                                    <input type="text" name="NombreUsuario" required
                                        placeholder="Ej: Juan"
                                        autocomplete="new-password"
                                        class="uf-input">
                                </div>
                            </div>
                            <div class="uf-field" id="_uf_fld_Apellido">
                                <label class="uf-label">
                                    Apellido <span class="uf-req">*</span>
                                </label>
                                <div class="uf-input-wrap">
                                    <input type="text" name="Apellido" required
                                        placeholder="Ej: Pérez"
                                        autocomplete="new-password"
                                        class="uf-input">
                                </div>
                            </div>
                            <div class="uf-field">
                                <label class="uf-label">Teléfono</label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-phone uf-pre"></i>
                                    <input type="tel" name="Telefono"
                                        placeholder="3001234567"
                                        autocomplete="off"
                                        class="uf-input has-pre">
                                </div>
                            </div>
                            <div class="uf-field">
                                <label class="uf-label">País</label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-globe uf-pre"></i>
                                    <input type="text" name="Pais"
                                        placeholder="Colombia"
                                        autocomplete="off"
                                        class="uf-input has-pre">
                                </div>
                            </div>
                            <div class="uf-field uf-span2">
                                <label class="uf-label">Dirección</label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-location-dot uf-pre"></i>
                                    <input type="text" name="Direccion"
                                        placeholder="Calle 123 #45-67"
                                        autocomplete="off"
                                        class="uf-input has-pre">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Acceso y permisos -->
                    <div class="uf-section">
                        <div class="uf-section-title">
                            <span class="uf-stitle-icon"><i class="fa-solid fa-lock"></i></span>
                            Acceso y permisos
                        </div>
                        <div class="uf-grid uf-col2">
                            <div class="uf-field ${isCreate ? '' : 'uf-span2'}" id="_uf_fld_Email">
                                <label class="uf-label">
                                    Correo electrónico <span class="uf-req">*</span>
                                </label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-envelope uf-pre"></i>
                                    <input type="email" name="Email" required
                                        placeholder="correo@ejemplo.com"
                                        autocomplete="off"
                                        class="uf-input has-pre">
                                </div>
                            </div>

                            ${isCreate ? `
                            <div class="uf-field" id="_uf_fld_Contrasena">
                                <label class="uf-label">
                                    Contraseña <span class="uf-req">*</span>
                                </label>
                                <div class="uf-input-wrap">
                                    <i class="fa-solid fa-key uf-pre"></i>
                                    <input type="password" name="Contrasena" id="_uf_pwd" required
                                        placeholder="Mínimo 8 caracteres"
                                        autocomplete="new-password"
                                        class="uf-input has-pre has-suf">
                                    <button type="button" class="uf-eye" id="_uf_eye" title="Mostrar/ocultar">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                </div>
                                <div class="uf-strength-bar">
                                    <div class="uf-strength-fill" id="_uf_strength_fill"></div>
                                </div>
                                <span class="uf-strength-text" id="_uf_strength_txt">Ingresa una contraseña</span>
                            </div>
                            ` : ''}

                            <div class="uf-field" id="_uf_fld_IDRol">
                                <label class="uf-label">
                                    Rol asignado <span class="uf-req">*</span>
                                </label>
                                <div class="uf-input-wrap" id="_uf_rol_wrap">
                                    <div class="uf-roles-loading" id="_uf_rol_loading">
                                        <span class="spin"><i class="fa-solid fa-circle-notch"></i></span>
                                        Cargando roles…
                                    </div>
                                    <select name="IDRol" id="_uf_roles" required class="uf-input"
                                        autocomplete="off" style="display:none">
                                    </select>
                                </div>
                            </div>

                            <div class="uf-field">
                                <label class="uf-label">Estado de la cuenta</label>
                                <label class="uf-toggle-row" for="_uf_active">
                                    <span class="uf-toggle-wrap">
                                        <input type="checkbox" name="IsActive" id="_uf_active" ${isCreate ? 'checked' : ''}>
                                        <span class="uf-toggle-track"></span>
                                    </span>
                                    <span class="uf-toggle-dot ${isCreate ? 'on' : 'off'}" id="_uf_active_dot"></span>
                                    <span id="_uf_active_lbl" class="uf-toggle-lbl ${isCreate ? 'on' : 'off'}">
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

    // ── Toggle mostrar/ocultar contraseña ───────────────────────────────
    const eyeBtn   = overlay.querySelector('#_uf_eye');
    const pwdInput = overlay.querySelector('#_uf_pwd');
    if (eyeBtn && pwdInput) {
        eyeBtn.addEventListener('click', () => {
            const visible = pwdInput.type === 'text';
            pwdInput.type = visible ? 'password' : 'text';
            eyeBtn.querySelector('i').className = `fa-solid fa-eye${visible ? '' : '-slash'}`;
        });

        // Indicador de fortaleza de contraseña
        pwdInput.addEventListener('input', () => {
            const v    = pwdInput.value;
            const fill = overlay.querySelector('#_uf_strength_fill');
            const txt  = overlay.querySelector('#_uf_strength_txt');
            if (!fill || !txt) return;

            let score = 0;
            if (v.length >= 8) score++;
            if (v.length >= 12) score++;
            if (/[A-Z]/.test(v)) score++;
            if (/[0-9]/.test(v)) score++;
            if (/[^A-Za-z0-9]/.test(v)) score++;

            const levels = [
                { pct:'0%',   bg:'transparent', label:'Ingresa una contraseña' },
                { pct:'20%',  bg:'#ef4444',      label:'Muy débil' },
                { pct:'40%',  bg:'#f97316',      label:'Débil' },
                { pct:'60%',  bg:'#eab308',      label:'Regular' },
                { pct:'80%',  bg:'#22c55e',      label:'Fuerte' },
                { pct:'100%', bg:'#16a34a',      label:'Muy fuerte' },
            ];
            const lv = v.length === 0 ? levels[0] : levels[Math.min(score, 5)];
            fill.style.width      = lv.pct;
            fill.style.background = lv.bg;
            txt.textContent       = lv.label;
            txt.style.color       = lv.bg === 'transparent' ? '#94a3b8' : lv.bg;
        });
    }

    // ── Toggle estado activo/inactivo ────────────────────────────────────
    const activeCheck = overlay.querySelector('#_uf_active');
    const activeLbl   = overlay.querySelector('#_uf_active_lbl');
    const activeDot   = overlay.querySelector('#_uf_active_dot');
    activeCheck.addEventListener('change', () => {
        const on = activeCheck.checked;
        activeLbl.textContent = on ? 'Activo' : 'Inactivo';
        activeLbl.className   = `uf-toggle-lbl ${on ? 'on' : 'off'}`;
        activeDot.className   = `uf-toggle-dot ${on ? 'on' : 'off'}`;
    });

    // ── Cargar roles ─────────────────────────────────────────────────────
    const rolesSelect  = overlay.querySelector('#_uf_roles');
    const rolesLoading = overlay.querySelector('#_uf_rol_loading');

    const mostrarRolesSelect = () => {
        if (rolesLoading) rolesLoading.style.display = 'none';
        if (rolesSelect)  rolesSelect.style.display  = '';
    };

    try {
        const apiUrl  = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : null)
                     || window.CONFIG?.API_URL
                     || 'http://localhost:3000/api';
        const res     = await fetch(`${apiUrl}/roles?page=1&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result  = await res.json();
        const raw     = Array.isArray(result) ? result : (result.data || []);

        const seen = new Set();
        const list = raw.filter(r => {
            const nombre = (r.Nombre || r.NombreRol || '').trim();
            if (!nombre) return false;
            if (Number(r.IsActive) === 0) return false;
            if (seen.has(nombre.toLowerCase())) return false;
            seen.add(nombre.toLowerCase());
            return true;
        });

        rolesSelect.innerHTML = '<option value="">— Selecciona un rol —</option>' +
            list.map(r => `<option value="${r.IDRol}">${r.Nombre || r.NombreRol}</option>`).join('');
    } catch {
        rolesSelect.innerHTML = '<option value="">Error al cargar roles</option>';
    } finally {
        mostrarRolesSelect();
    }

    // ── Pre-rellenar en modo edición ─────────────────────────────────────
    if (mode === 'edit' && usuarioData) {
        const form = overlay.querySelector('#_uf_form');
        Object.keys(usuarioData).forEach(key => {
            const el = form.elements[key];
            if (!el) return;
            if (el.type === 'checkbox') {
                el.checked = Number(usuarioData[key]) === 1;
                if (key === 'IsActive') {
                    const on = el.checked;
                    activeLbl.textContent = on ? 'Activo' : 'Inactivo';
                    activeLbl.className   = `uf-toggle-lbl ${on ? 'on' : 'off'}`;
                    activeDot.className   = `uf-toggle-dot ${on ? 'on' : 'off'}`;
                }
            } else {
                el.value = usuarioData[key] ?? '';
            }
        });
    }

    // ── Validación duplicados en tiempo real ─────────────────────────────
    const _ufCheckDup = (input, fieldId, errClass, getValue, findFn, msg) => {
        input?.addEventListener('blur', () => {
            const val = getValue(input);
            if (!val) return;
            overlay.querySelectorAll('.' + errClass).forEach(el => el.remove());
            input.classList.remove('uf-error');
            if (findFn(val)) {
                input.classList.add('uf-error');
                const errEl = document.createElement('span');
                errEl.className = `uf-err-msg _uf_err ${errClass}`;
                errEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
                const fld = overlay.querySelector(`#${fieldId}`);
                (fld || input.closest('.uf-field'))?.appendChild(errEl);
            }
        });
    };

    _ufCheckDup(
        overlay.querySelector('[name="Email"]'),
        '_uf_fld_Email', '_uf_dup_email',
        el => el.value.trim().toLowerCase(),
        val => _ufExistingUsers.some(u =>
            (u.Email || '').toLowerCase() === val &&
            String(u.IDUsuario) !== String(currentUsuarioId)
        ),
        'Este correo ya está registrado. Usa uno diferente.'
    );

    _ufCheckDup(
        overlay.querySelector('[name="NumeroDocumento"]'),
        '_uf_fld_NumeroDocumento', '_uf_dup_doc',
        el => el.value.trim(),
        val => _ufExistingUsers.some(u =>
            String(u.NumeroDocumento || '') === val &&
            String(u.IDUsuario) !== String(currentUsuarioId)
        ),
        'Este número de documento ya está registrado.'
    );

    // ── Eventos de cierre ────────────────────────────────────────────────
    const close = () => closeUsuarioForm();
    overlay.querySelector('#_uf_cancel').addEventListener('click', close);
    overlay.querySelector('#_uf_close').addEventListener('click', close);

    const onEsc = e => {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
    };
    document.addEventListener('keydown', onEsc);

    // ── Submit ───────────────────────────────────────────────────────────
    overlay.querySelector('#_uf_form').addEventListener('submit', async e => {
        e.preventDefault();
        await saveUsuario(token, onSave);
    });
}

// ── Validación frontend ──────────────────────────────────────────────────────

function _ufValidar(data, isCreate) {
    const errs = {};
    if (!data.TipoDocumento)   errs.TipoDocumento   = 'Selecciona el tipo de documento';
    if (!data.NumeroDocumento) errs.NumeroDocumento  = 'El número de documento es requerido';
    if (!data.NombreUsuario)   errs.NombreUsuario    = 'El nombre es requerido';
    if (!data.Apellido)        errs.Apellido         = 'El apellido es requerido';
    if (!data.Email)           errs.Email            = 'El correo electrónico es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email))
                               errs.Email            = 'El formato del correo no es válido';
    if (isCreate) {
        if (!data.Contrasena)  errs.Contrasena       = 'La contraseña es requerida';
        else if (data.Contrasena.length < 8)
                               errs.Contrasena       = 'Debe tener mínimo 8 caracteres';
    }
    if (!data.IDRol)           errs.IDRol            = 'Selecciona un rol para el usuario';

    if (data.Email) {
        const emailLow = data.Email.toLowerCase();
        const dupEmail = _ufExistingUsers.find(u =>
            (u.Email || '').toLowerCase() === emailLow &&
            String(u.IDUsuario) !== String(currentUsuarioId)
        );
        if (dupEmail) errs.Email = 'Este correo ya está registrado. Usa uno diferente.';
    }

    if (data.NumeroDocumento) {
        const dupDoc = _ufExistingUsers.find(u =>
            String(u.NumeroDocumento || '') === String(data.NumeroDocumento) &&
            String(u.IDUsuario) !== String(currentUsuarioId)
        );
        if (dupDoc) errs.NumeroDocumento = 'Este número de documento ya está registrado.';
    }

    return errs;
}

function _ufMostrarErrores(errs) {
    // Limpiar errores anteriores
    document.querySelectorAll('._uf_err').forEach(el => el.remove());
    document.querySelectorAll('.uf-error').forEach(el => el.classList.remove('uf-error'));

    const overlay = document.getElementById('_uf_overlay');
    if (!overlay) return;

    Object.entries(errs).forEach(([field, msg]) => {
        const fldWrap = overlay.querySelector(`#_uf_fld_${field}`);
        const input   = overlay.querySelector(`[name="${field}"]`);
        if (input) input.classList.add('uf-error');

        const errEl = document.createElement('span');
        errEl.className = 'uf-err-msg _uf_err';
        errEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;

        if (fldWrap) {
            fldWrap.appendChild(errEl);
        } else if (input) {
            input.closest('.uf-field')?.appendChild(errEl);
        }
    });

    // Scroll al primer error
    const first = overlay.querySelector('.uf-error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Guardar ──────────────────────────────────────────────────────────────────

async function saveUsuario(token, onSave) {
    const btn = document.getElementById('_uf_submit');
    const isCreate = currentMode === 'create';

    // Recopilar datos
    const form     = document.getElementById('_uf_form');
    const formData = new FormData(form);
    const data     = Object.fromEntries(formData.entries());
    data.IsActive  = document.getElementById('_uf_active')?.checked ? 1 : 0;
    if (data.IDRol) data.IDRol = Number(data.IDRol);

    // Validar en cliente
    const errs = _ufValidar(data, isCreate);
    if (Object.keys(errs).length > 0) {
        _ufMostrarErrores(errs);
        return;
    }

    // Limpiar errores y deshabilitar botón
    document.querySelectorAll('._uf_err').forEach(el => el.remove());
    document.querySelectorAll('.uf-error').forEach(el => el.classList.remove('uf-error'));

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…';
    }

    try {
        const apiUrl = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : null)
                    || window.CONFIG?.API_URL
                    || 'http://localhost:3000/api';
        const method = isCreate ? 'POST' : 'PUT';
        const url    = isCreate
            ? `${apiUrl}/usuarios`
            : `${apiUrl}/usuarios/${currentUsuarioId}`;

        const res     = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const resData = await res.json();

        if (!res.ok) {
            throw new Error(resData.message || resData.error || resData.detalle || 'Error en la operación');
        }

        if (typeof showAlert === 'function') {
            showAlert(`Usuario ${isCreate ? 'creado' : 'actualizado'} exitosamente`, 'success');
        }
        closeUsuarioForm();
        if (onSave) onSave();

    } catch (error) {
        if (typeof showAlert === 'function') showAlert(error.message, 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-${isCreate ? 'plus' : 'floppy-disk'}"></i> ${isCreate ? 'Crear usuario' : 'Guardar cambios'}`;
        }
    }
}

function closeUsuarioForm() {
    const modal = document.getElementById('_uf_overlay');
    if (modal) {
        modal.style.transition = 'opacity .18s';
        modal.style.opacity    = '0';
        setTimeout(() => modal.remove(), 200);
    }
}
