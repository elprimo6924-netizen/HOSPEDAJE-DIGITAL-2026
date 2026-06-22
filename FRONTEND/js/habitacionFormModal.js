// ── habitacionFormModal.js — vanilla JS, sin ES modules ──────────────────────

let _hfMode = 'create';
let _hfId   = null;
let _hfNombresCache = [];

function _hfParseImagenes(text) {
    return String(text || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
}

function _hfSerializeImagenes(imagenes) {
    const lista = (Array.isArray(imagenes) ? imagenes : []).map(s => String(s).trim()).filter(Boolean);
    if (!lista.length) return null;
    if (lista.length === 1) return lista[0];
    return JSON.stringify(lista);
}

function _hfGetExistingImages(habitacion) {
    const raw = habitacion?.ImagenHabitacion;
    if (!raw) return [];
    const s = String(raw).trim();
    if (s.startsWith('[')) {
        try { const p = JSON.parse(s); if (Array.isArray(p)) return p; } catch {}
    }
    return s ? [s] : [];
}

function openHabitacionForm(habitacionData) {
    _hfMode = habitacionData ? 'edit' : 'create';
    _hfId   = habitacionData
        ? (habitacionData.IDHabitacion ?? habitacionData.IdHabitacion ?? habitacionData.id ?? null)
        : null;

    const cached = (typeof habitacionesAdminCargadas !== 'undefined' && Array.isArray(habitacionesAdminCargadas))
        ? habitacionesAdminCargadas
        : [];
    _hfNombresCache = cached
        .filter(h => {
            if (_hfMode !== 'edit') return true;
            const hId = h.IDHabitacion ?? h.IdHabitacion ?? h.id;
            return String(hId) !== String(_hfId);
        })
        .map(h => String(h.NombreHabitacion || '').trim().toLowerCase())
        .filter(Boolean);

    if (!document.getElementById('_hf_styles')) {
        const s = document.createElement('style');
        s.id = '_hf_styles';
        s.textContent = `
            #_hf_overlay {
                position:fixed; inset:0; background:rgba(15,23,42,.6);
                display:flex; align-items:center; justify-content:center;
                z-index:9999; padding:16px; box-sizing:border-box;
                animation:_hf_bg .2s ease;
            }
            @keyframes _hf_bg { from{opacity:0} to{opacity:1} }
            @keyframes _hf_up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

            #_hf_box {
                background:#fff; border-radius:20px; width:100%; max-width:560px;
                max-height:calc(100vh - 32px); display:flex; flex-direction:column;
                box-shadow:0 32px 80px rgba(15,23,42,.28); overflow:hidden;
                animation:_hf_up .28s cubic-bezier(.22,.68,0,1.2);
            }

            #_hf_header {
                flex-shrink:0;
                background:linear-gradient(135deg,#1a2e1a 0%,#2d4a2d 100%);
                position:relative; overflow:hidden;
            }
            #_hf_header::before {
                content:''; position:absolute; inset:0;
                background:radial-gradient(ellipse at 85% 50%, rgba(232,116,59,.18) 0%, transparent 65%);
                pointer-events:none;
            }
            #_hf_hdr_inner {
                display:flex; align-items:center; gap:14px;
                padding:20px 24px 18px; position:relative; z-index:1;
            }
            .hf-hdr-icon {
                width:46px; height:46px; border-radius:13px; flex-shrink:0;
                background:linear-gradient(135deg,#e8743b,#d45a22);
                display:flex; align-items:center; justify-content:center;
                color:#fff; font-size:1.1rem;
                box-shadow:0 4px 14px rgba(232,116,59,.4);
            }
            .hf-hdr-text h2 {
                font-size:1.1rem; font-weight:800; color:#fff; margin:0 0 3px;
                letter-spacing:-.01em;
            }
            .hf-hdr-text p { font-size:.74rem; color:rgba(255,255,255,.5); margin:0; }
            #_hf_close {
                margin-left:auto; background:rgba(255,255,255,.1); border:none;
                cursor:pointer; color:rgba(255,255,255,.7); font-size:1.1rem;
                width:34px; height:34px; border-radius:8px; display:flex;
                align-items:center; justify-content:center;
                transition:background .15s,color .15s; flex-shrink:0;
            }
            #_hf_close:hover { background:rgba(255,255,255,.2); color:#fff; }

            #_hf_body { overflow-y:auto; flex:1; padding:22px 24px 10px; }

            .hf-section { margin-bottom:22px; }
            .hf-section-title {
                display:flex; align-items:center; gap:8px;
                font-size:.68rem; font-weight:800; color:#64748b;
                text-transform:uppercase; letter-spacing:.09em;
                margin-bottom:14px; padding-bottom:8px;
                border-bottom:1.5px solid #f1f5f9;
            }
            .hf-stitle-icon {
                width:22px; height:22px; border-radius:6px;
                background:linear-gradient(135deg,#e8743b,#d45a22);
                display:inline-flex; align-items:center; justify-content:center;
                color:#fff; font-size:.62rem; flex-shrink:0;
            }

            .hf-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
            @media(max-width:480px) { .hf-grid-2 { grid-template-columns:1fr; } }

            .hf-field { display:flex; flex-direction:column; gap:4px; }
            .hf-label {
                font-size:.74rem; font-weight:700; color:#374151; letter-spacing:.015em;
            }
            .hf-req { color:#ef4444; margin-left:2px; }

            .hf-input-wrap { position:relative; }
            .hf-pre {
                position:absolute; left:12px; top:50%; transform:translateY(-50%);
                color:#94a3b8; font-size:.78rem; pointer-events:none; z-index:1;
            }
            .hf-input, .hf-textarea, .hf-select {
                width:100%; box-sizing:border-box;
                border:1.5px solid #e2e8f0; border-radius:10px; font-size:.86rem;
                color:#0f172a; background:#fafafa; font-family:inherit; outline:none;
                transition:border-color .18s,box-shadow .18s,background .18s;
            }
            .hf-input  { padding:10px 13px 10px 36px; }
            .hf-input.no-icon  { padding:10px 13px; }
            .hf-select { padding:10px 13px; cursor:pointer; }
            .hf-textarea { padding:10px 13px; min-height:72px; resize:vertical; }

            .hf-input:focus, .hf-textarea:focus, .hf-select:focus {
                border-color:#e8743b; background:#fff;
                box-shadow:0 0 0 3px rgba(232,116,59,.12);
            }
            .hf-input:hover:not(:focus), .hf-textarea:hover:not(:focus),
            .hf-select:hover:not(:focus) { border-color:#cbd5e1; background:#fff; }
            .hf-input.hf-error, .hf-textarea.hf-error { border-color:#ef4444 !important; box-shadow:0 0 0 3px rgba(239,68,68,.1) !important; }
            .hf-input.hf-warn  { border-color:#f59e0b !important; box-shadow:0 0 0 3px rgba(245,158,11,.1) !important; }

            .hf-field-msg {
                font-size:.69rem; font-weight:600; display:flex; align-items:center; gap:4px;
            }
            .hf-field-msg.error { color:#ef4444; }
            .hf-field-msg.warn  { color:#b45309; }
            .hf-field-msg.ok    { color:#16a34a; }

            .hf-toggle-row {
                display:flex; align-items:center; gap:12px; padding:10px 13px;
                border:1.5px solid #e2e8f0; border-radius:10px; background:#fafafa;
                cursor:pointer; transition:border-color .18s,background .18s;
            }
            .hf-toggle-row:hover { border-color:#cbd5e1; background:#fff; }
            .hf-toggle-wrap { position:relative; width:42px; height:23px; flex-shrink:0; }
            .hf-toggle-wrap input { opacity:0; width:0; height:0; position:absolute; }
            .hf-toggle-track {
                position:absolute; inset:0; border-radius:999px;
                background:#cbd5e1; cursor:pointer; transition:background .25s;
            }
            .hf-toggle-track::before {
                content:''; position:absolute; width:17px; height:17px;
                border-radius:50%; background:#fff; top:3px; left:3px;
                box-shadow:0 1px 4px rgba(0,0,0,.22); transition:transform .25s;
            }
            .hf-toggle-wrap input:checked + .hf-toggle-track { background:#22c55e; }
            .hf-toggle-wrap input:checked + .hf-toggle-track::before { transform:translateX(19px); }
            .hf-toggle-lbl { font-size:.83rem; font-weight:700; }
            .hf-toggle-lbl.on  { color:#16a34a; }
            .hf-toggle-lbl.off { color:#94a3b8; }
            .hf-toggle-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; transition:background .25s; }
            .hf-toggle-dot.on  { background:#22c55e; }
            .hf-toggle-dot.off { background:#94a3b8; }

            .hf-img-help {
                font-size:.72rem; color:#94a3b8; margin-top:4px;
                display:flex; align-items:center; gap:5px;
            }

            #_hf_footer {
                padding:16px 24px; border-top:1.5px solid #f1f5f9;
                display:flex; gap:10px; justify-content:flex-end;
                flex-shrink:0; background:#fff;
            }
            .hf-btn-cancel {
                padding:10px 22px; border-radius:10px; background:#f8fafc;
                color:#475569; font-weight:600; font-size:.85rem;
                border:1.5px solid #e2e8f0; cursor:pointer; transition:all .15s;
            }
            .hf-btn-cancel:hover { background:#f1f5f9; border-color:#cbd5e1; }
            .hf-btn-submit {
                padding:10px 26px; border-radius:10px;
                background:linear-gradient(135deg,#e8743b,#d45a22);
                color:#fff; font-weight:700; font-size:.85rem; border:none;
                cursor:pointer; box-shadow:0 4px 14px rgba(232,116,59,.35);
                transition:opacity .15s,transform .15s,box-shadow .15s;
                display:flex; align-items:center; gap:8px;
            }
            .hf-btn-submit:hover:not(:disabled) {
                opacity:.92; transform:translateY(-1px);
                box-shadow:0 6px 20px rgba(232,116,59,.42);
            }
            .hf-btn-submit:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }
        `;
        document.head.appendChild(s);
    }

    const isCreate = _hfMode === 'create';
    const existingImages = isCreate ? [] : _hfGetExistingImages(habitacionData);

    let estadoActivo = true;
    if (!isCreate && habitacionData) {
        const e = habitacionData.Estado;
        estadoActivo = (e === 1 || e === '1' || e === true ||
            (typeof e === 'string' && ['disponible','activo','activa','available'].includes(e.toLowerCase().trim())));
    }

    const overlay = document.createElement('div');
    overlay.id = '_hf_overlay';
    overlay.innerHTML = `
        <div id="_hf_box">
            <div id="_hf_header">
                <div id="_hf_hdr_inner">
                    <span class="hf-hdr-icon">
                        <i class="fa-solid fa-bed"></i>
                    </span>
                    <div class="hf-hdr-text">
                        <h2>${isCreate ? 'Crear habitación' : 'Editar habitación'}</h2>
                        <p>${isCreate
                            ? 'Completa los datos para registrar una nueva habitación.'
                            : `Modificando: ${habitacionData?.NombreHabitacion || 'habitación seleccionada'}`}</p>
                    </div>
                    <button type="button" id="_hf_close" title="Cerrar" aria-label="Cerrar">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <div id="_hf_body">
                <form id="_hf_form" novalidate autocomplete="off">

                    <!-- Información básica -->
                    <div class="hf-section">
                        <div class="hf-section-title">
                            <span class="hf-stitle-icon"><i class="fa-solid fa-circle-info"></i></span>
                            Información de la habitación
                        </div>
                        <div style="display:flex;flex-direction:column;gap:14px;">

                            <!-- Nombre -->
                            <div class="hf-field">
                                <label class="hf-label">
                                    Nombre <span class="hf-req">*</span>
                                </label>
                                <div class="hf-input-wrap">
                                    <i class="fa-solid fa-bed hf-pre"></i>
                                    <input type="text" id="_hf_nombre" class="hf-input"
                                        placeholder="Ej. Suite Presidencial" maxlength="100"
                                        autocomplete="off" value="${_hfEsc(habitacionData?.NombreHabitacion || '')}">
                                </div>
                                <span class="hf-field-msg" id="_hf_nombre_msg" style="display:none"></span>
                            </div>

                            <!-- Descripción -->
                            <div class="hf-field">
                                <label class="hf-label">
                                    Descripción <span class="hf-req">*</span>
                                </label>
                                <textarea id="_hf_descripcion" class="hf-textarea"
                                    placeholder="Describe brevemente la habitación..." maxlength="500"
                                    autocomplete="off">${_hfEsc(habitacionData?.Descripcion || '')}</textarea>
                                <span class="hf-field-msg" id="_hf_desc_msg" style="display:none"></span>
                            </div>

                            <!-- Costo y Estado -->
                            <div class="hf-grid-2">
                                <div class="hf-field">
                                    <label class="hf-label">
                                        Costo (COP) <span class="hf-req">*</span>
                                    </label>
                                    <div class="hf-input-wrap">
                                        <i class="fa-solid fa-dollar-sign hf-pre"></i>
                                        <input type="number" id="_hf_costo" class="hf-input"
                                            placeholder="Ej. 250000" min="0" step="1"
                                            value="${habitacionData?.Costo ?? ''}">
                                    </div>
                                    <span class="hf-field-msg" id="_hf_costo_msg" style="display:none"></span>
                                </div>

                                <div class="hf-field">
                                    <label class="hf-label">Estado</label>
                                    <label class="hf-toggle-row" for="_hf_estado">
                                        <span class="hf-toggle-wrap">
                                            <input type="checkbox" id="_hf_estado" ${estadoActivo ? 'checked' : ''}>
                                            <span class="hf-toggle-track"></span>
                                        </span>
                                        <span class="hf-toggle-dot ${estadoActivo ? 'on' : 'off'}" id="_hf_estado_dot"></span>
                                        <span id="_hf_estado_lbl" class="hf-toggle-lbl ${estadoActivo ? 'on' : 'off'}">
                                            ${estadoActivo ? 'Disponible' : 'No disponible'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                        </div>
                    </div>

                    <!-- Imágenes -->
                    <div class="hf-section">
                        <div class="hf-section-title">
                            <span class="hf-stitle-icon"><i class="fa-solid fa-images"></i></span>
                            Imágenes
                        </div>
                        <div class="hf-field">
                            <label class="hf-label">URLs de imágenes</label>
                            <textarea id="_hf_imagenes" class="hf-textarea"
                                placeholder="https://ejemplo.com/imagen1.jpg&#10;https://ejemplo.com/imagen2.jpg"
                                style="min-height:80px">${existingImages.join('\n')}</textarea>
                            <span class="hf-img-help">
                                <i class="fa-solid fa-circle-info"></i>
                                Una URL por línea. Las imágenes son opcionales.
                            </span>
                        </div>
                    </div>

                </form>
            </div>

            <div id="_hf_footer">
                <button type="button" class="hf-btn-cancel" id="_hf_cancel">Cancelar</button>
                <button type="submit" form="_hf_form" class="hf-btn-submit" id="_hf_submit">
                    <i class="fa-solid fa-${isCreate ? 'plus' : 'floppy-disk'}"></i>
                    ${isCreate ? 'Crear habitación' : 'Guardar cambios'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Toggle estado
    const estadoChk = overlay.querySelector('#_hf_estado');
    const estadoLbl = overlay.querySelector('#_hf_estado_lbl');
    const estadoDot = overlay.querySelector('#_hf_estado_dot');
    estadoChk.addEventListener('change', () => {
        const on = estadoChk.checked;
        estadoLbl.textContent = on ? 'Disponible' : 'No disponible';
        estadoLbl.className = `hf-toggle-lbl ${on ? 'on' : 'off'}`;
        estadoDot.className = `hf-toggle-dot ${on ? 'on' : 'off'}`;
    });

    // Validación nombre en tiempo real
    const nombreInput = overlay.querySelector('#_hf_nombre');
    const nombreMsg   = overlay.querySelector('#_hf_nombre_msg');
    let _hfNombreTimer;
    nombreInput?.addEventListener('input', () => {
        nombreInput.classList.remove('hf-error', 'hf-warn');
        _hfSetMsg(nombreMsg, null, '');
        clearTimeout(_hfNombreTimer);
        const val = nombreInput.value.trim().toLowerCase();
        if (!val) return;
        _hfNombreTimer = setTimeout(() => {
            if (_hfNombresCache.includes(val)) {
                nombreInput.classList.add('hf-warn');
                _hfSetMsg(nombreMsg, 'warn', 'Ya existe una habitación con ese nombre.');
            } else {
                _hfSetMsg(nombreMsg, 'ok', 'Nombre disponible.');
            }
        }, 400);
    });

    // Costo: solo enteros no negativos
    const costoInput = overlay.querySelector('#_hf_costo');
    costoInput?.addEventListener('input', function () {
        const v = parseInt(this.value, 10);
        if (this.value !== '' && (isNaN(v) || v < 0)) this.value = 0;
        else if (!isNaN(v) && String(v) !== this.value.replace(/\..*$/, '')) this.value = v;
    });

    // Cierre
    const close = () => closeHabitacionForm();
    overlay.querySelector('#_hf_cancel').addEventListener('click', close);
    overlay.querySelector('#_hf_close').addEventListener('click', close);
    const onEsc = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
    document.addEventListener('keydown', onEsc);

    // Submit
    overlay.querySelector('#_hf_form').addEventListener('submit', async e => {
        e.preventDefault();
        await _hfSave();
    });

    nombreInput?.focus();
}

function _hfEsc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _hfSetMsg(el, tipo, texto) {
    if (!el) return;
    if (!tipo) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.className = `hf-field-msg ${tipo}`;
    const icons = { error:'fa-circle-exclamation', warn:'fa-triangle-exclamation', ok:'fa-circle-check' };
    el.innerHTML = `<i class="fa-solid ${icons[tipo] || 'fa-circle-exclamation'}"></i> ${texto}`;
}

async function _hfSave() {
    const isCreate = _hfMode === 'create';
    const btn = document.getElementById('_hf_submit');

    const nombreInput = document.getElementById('_hf_nombre');
    const descInput   = document.getElementById('_hf_descripcion');
    const costoInput  = document.getElementById('_hf_costo');
    const estadoChk   = document.getElementById('_hf_estado');
    const imagenesTA  = document.getElementById('_hf_imagenes');

    const nombreMsg = document.getElementById('_hf_nombre_msg');
    const descMsg   = document.getElementById('_hf_desc_msg');
    const costoMsg  = document.getElementById('_hf_costo_msg');

    const nombre    = (nombreInput?.value || '').trim();
    const desc      = (descInput?.value || '').trim();
    const costoRaw  = (costoInput?.value || '').trim();
    const costo     = parseInt(costoRaw, 10);
    const estado    = estadoChk?.checked ? 1 : 0;
    const imagenes  = _hfParseImagenes(imagenesTA?.value || '');
    const imagenFinal = _hfSerializeImagenes(imagenes);

    // Validación frontend
    let hayError = false;

    [nombreInput, descInput, costoInput].forEach(el => el?.classList.remove('hf-error', 'hf-warn'));

    if (!nombre) {
        nombreInput?.classList.add('hf-error');
        _hfSetMsg(nombreMsg, 'error', 'El nombre es obligatorio.');
        hayError = true;
    } else if (_hfNombresCache.includes(nombre.toLowerCase())) {
        nombreInput?.classList.add('hf-warn');
        _hfSetMsg(nombreMsg, 'warn', 'Ya existe una habitación con ese nombre.');
        hayError = true;
    }

    if (!desc) {
        descInput?.classList.add('hf-error');
        _hfSetMsg(descMsg, 'error', 'La descripción es obligatoria.');
        hayError = true;
    }

    if (!costoRaw || isNaN(costo) || costo < 0 || String(parseInt(costoRaw, 10)) !== costoRaw) {
        costoInput?.classList.add('hf-error');
        _hfSetMsg(costoMsg, 'error', 'Ingresa un número entero no negativo (ej: 250000).');
        hayError = true;
    }

    if (hayError) { nombreInput?.focus(); return; }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…';
    }

    try {
        const apiUrl = window.CONFIG?.API_URL || 'http://localhost:3000/api';
        const token  = localStorage.getItem('token') || '';
        const url    = isCreate
            ? `${apiUrl}/habitaciones`
            : `${apiUrl}/habitaciones/${_hfId}`;
        const method = isCreate ? 'POST' : 'PUT';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                NombreHabitacion: nombre,
                Descripcion: desc,
                Costo: costo,
                Estado: estado,
                ImagenHabitacion: imagenFinal
            })
        });

        if (res.status === 401) {
            localStorage.removeItem('token'); localStorage.removeItem('user');
            const enPages = window.location.pathname.includes('/pages/');
            window.location.href = enPages ? '../login.html' : 'login.html';
            return;
        }

        const resData = await res.json().catch(() => ({}));

        if (!res.ok) {
            if (res.status === 409) {
                nombreInput?.classList.add('hf-warn');
                _hfSetMsg(nombreMsg, 'warn', resData.error || 'Ya existe una habitación con ese nombre.');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fa-solid fa-${isCreate ? 'plus' : 'floppy-disk'}"></i> ${isCreate ? 'Crear habitación' : 'Guardar cambios'}`;
                }
                return;
            }
            throw new Error(resData.error || resData.message || resData.detalle || `Error ${res.status}`);
        }

        if (typeof showAlert === 'function') {
            showAlert(`Habitación ${isCreate ? 'creada' : 'actualizada'} correctamente`, 'success');
        }

        closeHabitacionForm();

        if (typeof cargarHabitacionesAdmin === 'function') {
            await cargarHabitacionesAdmin();
        }
        if (typeof cargarHabitaciones === 'function') {
            await cargarHabitaciones();
        }

    } catch (error) {
        if (typeof showAlert === 'function') {
            showAlert(error.message || 'Error al guardar la habitación', 'error');
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-${isCreate ? 'plus' : 'floppy-disk'}"></i> ${isCreate ? 'Crear habitación' : 'Guardar cambios'}`;
        }
    }
}

function closeHabitacionForm() {
    const modal = document.getElementById('_hf_overlay');
    if (modal) {
        modal.style.transition = 'opacity .18s';
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 200);
    }
}

window.openHabitacionForm  = openHabitacionForm;
window.closeHabitacionForm = closeHabitacionForm;
