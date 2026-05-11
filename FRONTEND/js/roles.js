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
            renderRows(response.data || response);
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
            if (action === "delete") {
                if (!confirm("¿Eliminar este rol?")) return;
                await window.apiRequest(`/roles/${id}`, { method: "DELETE" });
                if (typeof showAlert === 'function') showAlert('Rol eliminado correctamente.', 'success');
                await loadRoles();
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