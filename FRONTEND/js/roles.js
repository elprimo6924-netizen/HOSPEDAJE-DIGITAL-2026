document.addEventListener("DOMContentLoaded", async () => {
    const session = window.getStoredSession ? window.getStoredSession() : verificarSesion();

    if (!session) {
        window.location.href = "../login.html";
        return;
    }

    await window.loadSidebarComponent("sidebar-placeholder");
    await window.filterSidebarByPermissions();

    const searchInput = document.getElementById("busqueda-roles");
    const searchButton = document.getElementById("btn-buscar");
    const resetButton = document.getElementById("btn-limpiar");
    const createButton = document.getElementById("btn-crear-rol");
    const tbody = document.getElementById("roles-tbody");

    let currentQuery = "";

    // Roles protegidos que no se pueden editar, desactivar ni eliminar
    const PROTECTED_ROLES = ['Administrador', 'Cliente'];
    const PROTECTED_IDS = [1, 2]; // ID 1 = Administrador, ID 2 = Cliente

    const isRoleProtected = (item) => {
        const nombre = (item.NombreRol || item.Nombre || '').trim();
        const id = Number(item.IDRol);
        return PROTECTED_ROLES.includes(nombre) || PROTECTED_IDS.includes(id);
    };

    const renderRows = (items) => {
        if (!tbody) return;

        // Actualizar contador de texto
        const infoSpan = document.getElementById('roles-info');
        if (infoSpan) {
            const total = items ? items.length : 0;
            // Ajustamos el texto para que sea dinámico
            infoSpan.textContent = total > 0 
                ? `Mostrando 1 a ${total} de ${total} roles` 
                : "Mostrando 0 de 0 roles";
        }

        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-slate-500">No hay roles para mostrar</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => {
            // Verificamos el estado (pueden venir como 1/0 o Activo/Inactivo)
            const isActive = Number(item.IsActive) === 1 || item.Estado === "Activo";
            const isProtected = isRoleProtected(item);

            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-4">
                        <div class="font-bold text-slate-800">${item.NombreRol || item.Nombre || "-"}</div>
                    </td>
                    <td class="p-4 text-center">
                        <label class="switch">
                            <!-- Agregamos el data-action al input directamente -->
                            <input type="checkbox" ${isActive ? "checked" : ""} data-action="toggle" data-id="${item.IDRol}" ${isProtected ? 'disabled' : ''}>
                            <span class="slider ${isProtected ? 'opacity-50 cursor-not-allowed' : ''}"></span>
                        </label>
                    </td>
                    <td class="p-4">
                        <div class="flex justify-center gap-2">
                            <button class="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                                    data-action="view" data-id="${item.IDRol}" title="Ver detalle">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button class="p-2 bg-blue-50 text-blue-600 rounded-lg ${isProtected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'} transition-colors shadow-sm"
                                    data-action="edit" data-id="${item.IDRol}" title="${isProtected ? 'No editable' : 'Editar'}" ${isProtected ? 'disabled' : ''}>
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button class="p-2 bg-red-50 text-red-600 rounded-lg ${isProtected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'} transition-colors shadow-sm"
                                    data-action="delete" data-id="${item.IDRol}" title="${isProtected ? 'No eliminable' : 'Eliminar'}" ${isProtected ? 'disabled' : ''}>
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    };

    const loadRoles = async () => {
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-slate-500 italic">Cargando roles...</td></tr>';

        try {
            const endpoint = currentQuery.trim() 
                ? `/roles/search?q=${encodeURIComponent(currentQuery.trim())}&page=1&limit=20` 
                : "/roles?page=1&limit=20";

            const response = await window.apiRequest(endpoint);
            const roles = response.data || response;
            const visibles = Array.isArray(roles)
                ? roles.filter((rol) => Number(rol.IsActive) === 1 || rol.Estado === 'Activo')
                : [];
            renderRows(visibles);
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-red-500">Error: ${error.message}</td></tr>`;
        }
    };

    // Manejador de eventos delegado corregido
    tbody?.addEventListener("click", async (event) => {
        // CORRECCIÓN: Ahora también busca INPUTS (el switch)
        const target = event.target.closest("button[data-action], input[data-action]");
        if (!target) return;

        // Validar que no esté deshabilitado
        if (target.disabled) {
            event.preventDefault();
            return;
        }

        const { action, id } = target.dataset;

        // Obtener el nombre del rol para validar si está protegido
        const rolRow = target.closest('tr');
        const rolName = rolRow?.querySelector('td:first-child .font-bold')?.textContent?.trim() || '';
        const rolId = Number(id);
        const isProtected = PROTECTED_ROLES.includes(rolName) || PROTECTED_IDS.includes(rolId);

        if (isProtected && (action === 'edit' || action === 'delete' || action === 'toggle')) {
            const accion = action === 'edit' ? 'editado' : action === 'delete' ? 'eliminado' : 'desactivado';
            if (typeof showAlert === 'function')
                showAlert(`El rol "${rolName}" está protegido y no puede ser ${accion}.`, 'warning');
            event.preventDefault();
            return;
        }

        try {
            if (action === "view") {
                await mostrarDetalleRol(id);
                return;
            }

            if (action === "delete") {
                if (typeof confirmarAccion === 'function') {
                    confirmarAccion({
                        titulo: '¿Eliminar rol?',
                        mensaje: `El rol "${rolName}" será desactivado y no podrá usarse para nuevos usuarios.`,
                        textoConfirmar: 'Eliminar',
                        tipo: 'danger',
                        onConfirmar: async () => {
                            try {
                                await window.apiRequest(`/roles/${id}`, { method: "DELETE" });
                                if (typeof showAlert === 'function') showAlert('Rol eliminado correctamente.', 'success');
                                await loadRoles();
                            } catch (err) {
                                if (typeof showAlert === 'function') showAlert(err.message || 'Error al eliminar.', 'error');
                            }
                        }
                    });
                } else {
                    if (!confirm("¿Eliminar este rol?")) return;
                    await window.apiRequest(`/roles/${id}`, { method: "DELETE" });
                    if (typeof showAlert === 'function') showAlert('Rol eliminado correctamente.', 'success');
                    await loadRoles();
                }
                return;
            }

            if (action === "toggle") {
                const newState = target.checked;
                await window.apiRequest(`/roles/${id}/status`, {
                    method: "PATCH",
                    body: { isActive: newState },
                });
            }

            if (action === "edit") {
                const session = window.getStoredSession ? window.getStoredSession() : verificarSesion();
                await openRolForm("edit", id, session.token, false, loadRoles);
            }
        } catch (error) {
            if (typeof showAlert === 'function') showAlert(error.message || 'No se pudo completar la acción.', 'error');
            await loadRoles();
        }
    });

    searchButton?.addEventListener("click", () => {
        currentQuery = searchInput?.value || "";
        loadRoles();
    });

    searchInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            currentQuery = searchInput.value || "";
            loadRoles();
        }
    });

    resetButton?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        currentQuery = "";
        loadRoles();
    });

    createButton?.addEventListener("click", async () => {
        const session = window.getStoredSession ? window.getStoredSession() : verificarSesion();
        if (session && session.token) {
            await openRolForm("create", null, session.token, false, loadRoles);
        } else {
            alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
            window.location.href = "../login.html";
        }
    });

    await loadRoles();
});

/* ── Modal de detalle de rol (R3) ── */
async function mostrarDetalleRol(rolId) {
    const session = window.getStoredSession ? window.getStoredSession() : null;
    if (!session) return;

    let rolData;
    try {
        rolData = await window.apiRequest(`/roles/${rolId}`);
    } catch (e) {
        if (typeof showAlert === 'function') showAlert('No se pudo cargar el detalle del rol.', 'error');
        return;
    }

    const nombre = rolData.Nombre || rolData.NombreRol || `Rol #${rolId}`;
    const isActive = Number(rolData.IsActive) === 1 || rolData.Estado === 'Activo';
    const permisos = rolData.permisos || [];

    const ICON_MAP = {
        dashboard:    'fa-chart-line',
        usuarios:     'fa-users',
        roles:        'fa-shield-halved',
        habitaciones: 'fa-bed',
        servicios:    'fa-bell-concierge',
        reservas:     'fa-calendar-check',
        paquetes:     'fa-box-open',
        clientes:     'fa-address-book',
    };

    const permisosHtml = permisos.length
        ? permisos.map(p => {
            const n = (p.nombre || '').toLowerCase().trim();
            const icon = ICON_MAP[n] || 'fa-lock';
            return `<span style="display:inline-flex;align-items:center;gap:6px;
                         background:#f5f3ff;color:#6d28d9;border:1px solid #ede9fe;
                         border-radius:8px;padding:5px 11px;font-size:.78rem;font-weight:600;">
                        <i class="fa-solid ${icon}" style="font-size:.75rem"></i>
                        ${p.nombre || '—'}
                    </span>`;
        }).join('')
        : '<span style="color:#94a3b8;font-size:.82rem">Sin permisos asignados</span>';

    const overlay = document.createElement('div');
    overlay.id = '_rd_overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;animation:_rf_bg .2s ease';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:480px;
                    box-shadow:0 24px 64px rgba(15,23,42,.22);overflow:hidden;animation:_rf_up .25s ease">
            <div style="padding:20px 24px 16px;border-bottom:1px solid #f1f5f9;
                        display:flex;align-items:center;justify-content:space-between">
                <h2 style="font-size:1.05rem;font-weight:800;color:#0f172a;margin:0;display:flex;align-items:center;gap:10px">
                    <span style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#6d28d9);
                                 display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:.85rem;flex-shrink:0">
                        <i class="fa-solid fa-shield-halved"></i>
                    </span>
                    Detalle del Rol
                </h2>
                <button id="_rd_close" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:1.3rem;line-height:1;padding:4px 6px;border-radius:6px">&times;</button>
            </div>
            <div style="padding:22px 24px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
                    <div>
                        <div style="font-size:1.25rem;font-weight:800;color:#0f172a">${nombre}</div>
                        <div style="font-size:.78rem;color:#94a3b8;margin-top:2px">ID: ${rolId}</div>
                    </div>
                    <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;font-size:.75rem;font-weight:700;
                                 ${isActive ? 'background:#dcfce7;color:#166534' : 'background:#f1f5f9;color:#64748b'}">
                        <i class="fa-solid ${isActive ? 'fa-circle-check' : 'fa-circle-xmark'}" style="font-size:.7rem"></i>
                        ${isActive ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:10px">
                    <i class="fa-solid fa-lock" style="margin-right:5px;color:#7c3aed"></i>Permisos asignados (${permisos.length})
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px">${permisosHtml}</div>
            </div>
            <div style="padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end">
                <button id="_rd_cerrar_btn"
                    style="padding:8px 22px;background:#f1f5f9;border:none;border-radius:8px;
                           font-weight:700;font-size:.83rem;cursor:pointer;color:#475569;transition:background .15s">
                    Cerrar
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    const close = () => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity .2s';
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#_rd_close').addEventListener('click', close);
    overlay.querySelector('#_rd_cerrar_btn').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function onEsc(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
    });
}