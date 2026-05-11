document.addEventListener("DOMContentLoaded", async () => {
  const session = window.getStoredSession ? window.getStoredSession() : verificarSesion();

  if (!session) {
    window.location.href = "../login.html";
    return;
  }

  await window.loadSidebarComponent("sidebar-placeholder");
  await window.filterSidebarByPermissions();

  const searchInput = document.getElementById("busqueda-usuarios");
  const searchButton = document.getElementById("id-btn-buscar");
  const resetButton = document.getElementById("btn-limpiar");
  const createButton = document.getElementById("btn-crear-usuario");
  const tbody = document.getElementById("usuarios-tbody");

  let currentQuery = "";
  let listaRoles = [];
  let allUsers   = []; // Cache local para filtrado instantáneo

  // 1. Nueva función para obtener los roles desde el backend
  const fetchRoles = async () => {
    try {
      const response = await window.apiRequest("/roles");
      // Validamos si la respuesta es el array directamente o viene dentro de .data
      const data = response.data || response;

      if (Array.isArray(data)) {
        listaRoles = data;
      } else {
        console.error("La API de roles no devolvió un array:", data);
        listaRoles = [];
      }
    } catch (error) {
      console.error("Error cargando roles:", error);
      listaRoles = [];
    }
  };

  // ID del SuperAdministrador que no puede ser modificado
  const SUPER_ADMIN_ID = 1;

  const isSuperAdmin = (item) => {
    return Number(item.IDUsuario) === SUPER_ADMIN_ID;
  };

  /* Resalta coincidencias del texto buscado */
  const resaltar = (texto, query) => {
    if (!query || !query.trim()) return texto;
    const re = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return String(texto).replace(re, '<mark style="background:#fef08a;border-radius:2px;padding:0 1px">$1</mark>');
  };

  const renderRows = (items) => {
    if (!tbody) return;

    const q = searchInput?.value || '';

    if (!items || items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">${q ? `No se encontraron usuarios para "<strong>${q}</strong>"` : 'No hay usuarios para mostrar'}</td></tr>`;
      return;
    }

    tbody.innerHTML = items
      .map((item) => {
        const isActive = Number(item.IsActive) === 1;
        const nombreMostrar = resaltar(item.Nombre || item.NombreUsuario || "Sin Nombre", q);
        const emailMostrar  = resaltar(item.Email || "Sin Email", q);
        const idRolActual = item.IDRol || item.id_rol;
        const isProtected = isSuperAdmin(item);

        // Generar opciones con validación para evitar el "undefined"
        const opcionesRoles =
          listaRoles.length > 0
            ? listaRoles
                .map((rol) => {
                  const nombreDelRol = rol.NombreRol || rol.nombre || rol.Nombre || "Rol Desconocido";
                  const idDelRol = rol.IDRol || rol.id || rol.ID;
                  return `<option value="${idDelRol}" ${idRolActual == idDelRol ? "selected" : ""}>${nombreDelRol}</option>`;
                })
                .join("")
            : `<option value="">Cargando roles...</option>`;

        // Badge de SuperAdministrador
        const superAdminBadge = isProtected
          ? `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200" title="Este usuario es el SuperAdministrador del sistema">
               <i class="fa-solid fa-crown mr-1"></i>SuperAdmin
             </span>`
          : '';

        return `
            <tr class="hover:bg-slate-50 transition-colors ${isProtected ? 'bg-amber-50/30' : ''}">
                <td class="p-4">
                    <div class="font-bold text-slate-800 flex items-center flex-wrap gap-1">
                      ${nombreMostrar}${superAdminBadge}
                    </div>
                    <div class="text-xs text-slate-500">${emailMostrar}</div>
                </td>
                <td class="p-4 text-center">
                    <select class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-hospedaje-green outline-none text-slate-700 ${isProtected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
                            data-action="change-role" data-id="${item.IDUsuario}" ${isProtected ? 'disabled' : ''}>
                        ${opcionesRoles}
                    </select>
                </td>
                <td class="p-4 text-center">
                    <label class="switch">
                        <input type="checkbox" ${isActive ? "checked" : ""} data-action="toggle" data-id="${item.IDUsuario}" ${isProtected ? 'disabled' : ''}>
                        <span class="slider ${isProtected ? 'opacity-50 cursor-not-allowed' : ''}"></span>
                    </label>
                </td>
                <td class="p-4">
                    <div class="flex justify-center gap-2">
                        <button class="p-2 bg-blue-50 text-blue-600 rounded-lg ${isProtected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'} transition-colors shadow-sm"
                                data-action="edit" data-id="${item.IDUsuario}" title="${isProtected ? 'No editable - SuperAdministrador' : 'Editar'}" ${isProtected ? 'disabled' : ''}>
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="p-2 bg-red-50 text-red-600 rounded-lg ${isProtected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'} transition-colors shadow-sm"
                                data-action="delete" data-id="${item.IDUsuario}" title="${isProtected ? 'No eliminable - SuperAdministrador' : 'Eliminar'}" ${isProtected ? 'disabled' : ''}>
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
      })
      .join("");
  };

  /* ── Filtrado local instantáneo ── */
  const filtrarLocalmente = (query) => {
    if (!query.trim()) return allUsers;
    const q = query.trim().toLowerCase();
    return allUsers.filter((u) => {
      const nombre = (u.Nombre || u.NombreUsuario || '').toLowerCase();
      const email  = (u.Email || '').toLowerCase();
      const doc    = String(u.NroDocumento || u.nro_documento || '').toLowerCase();
      return nombre.includes(q) || email.includes(q) || doc.includes(q);
    });
  };

  const actualizarContador = (total) => {
    const el = document.getElementById("usuarios-info");
    if (el) el.textContent = `Mostrando ${total} usuario${total !== 1 ? 's' : ''}`;
  };

  const setSearchState = (loading) => {
    if (!searchInput) return;
    if (loading) {
      searchInput.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='none' stroke='%2394a3b8' stroke-width='3' stroke-dasharray='40 20'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='.7s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/svg%3E\")";
      searchInput.style.backgroundRepeat = 'no-repeat';
      searchInput.style.backgroundPosition = 'right 12px center';
    } else {
      searchInput.style.backgroundImage = '';
    }
  };

  const loadUsuarios = async () => {
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500 italic">Cargando usuarios...</td></tr>';
    setSearchState(true);

    try {
      const response = await window.apiRequest("/usuarios?page=1&limit=200");
      const data = response.data || response;

      allUsers = Array.isArray(data) ? data : [];

      const visible = filtrarLocalmente(currentQuery);
      renderRows(visible);
      actualizarContador(visible.length);
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Error: ${error.message}</td></tr>`;
    } finally {
      setSearchState(false);
    }
  };

  tbody?.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action], input[data-action]");
    if (!button) return;

    // Validar que no esté deshabilitado
    if (button.disabled) {
      event.preventDefault();
      return;
    }

    const { action, id } = button.dataset;

    // Bloquear acciones sobre el SuperAdministrador
    if (Number(id) === SUPER_ADMIN_ID) {
      if (typeof showAlert === 'function') showAlert('El SuperAdministrador no puede ser modificado.', 'warning');
      event.preventDefault();
      return;
    }

    try {
      if (action === "delete") {
        if (!confirm("¿Eliminar este usuario?")) return;
        await window.apiRequest(`/usuarios/${id}`, { method: "DELETE" });
        if (typeof showAlert === 'function') showAlert('Usuario eliminado correctamente.', 'success');
        await loadUsuarios();
      }

      if (action === "toggle") {
        const newState = button.checked;
        await window.apiRequest(`/usuarios/${id}/status`, {
          method: "PATCH",
          body: { isActive: newState },
        });
      }

      if (action === "edit") {
        const session = window.getStoredSession();
        const usuarioData = await window.apiRequest(`/usuarios/${id}`);
        await openUsuarioForm("edit", usuarioData, session.token, loadUsuarios);
      }
    } catch (error) {
      if (typeof showAlert === 'function') showAlert(error.message || 'No se pudo completar la acción.', 'error');
      await loadUsuarios();
    }
  });

  // Busca el manejador del 'change' en el select y cámbialo por este:
  tbody?.addEventListener("change", async (event) => {
    const select = event.target.closest('select[data-action="change-role"]');
    if (!select) return;

    // Validar que no esté deshabilitado
    if (select.disabled) {
      event.preventDefault();
      return;
    }

    const { id } = select.dataset;

    // Bloquear cambio de rol para el SuperAdministrador
    if (Number(id) === SUPER_ADMIN_ID) {
      if (typeof showAlert === 'function') showAlert('El rol del SuperAdministrador no puede ser modificado.', 'warning');
      await loadUsuarios();
      return;
    }

    const newRoleId = select.value;

    try {
      await window.apiRequest(`/usuarios/${id}`, {
        method: "PUT",
        body: { IDRol: newRoleId },
      });
      if (typeof showAlert === 'function') showAlert('Rol actualizado correctamente.', 'success');
    } catch (error) {
      if (typeof showAlert === 'function') showAlert('No se pudo actualizar el rol del usuario.', 'error');
      await loadUsuarios();
    }
  });

  /* ── Búsqueda en tiempo real ── */
  let _searchTimer;
  searchInput?.addEventListener("input", () => {
    const q = searchInput.value;

    // Filtrado local instantáneo (sin esperar al servidor)
    const visibles = filtrarLocalmente(q);
    renderRows(visibles);
    actualizarContador(visibles.length);

    // Resincronizar con el servidor si la query cambia significativamente
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      if (q.trim() !== currentQuery.trim()) {
        currentQuery = q;
        loadUsuarios();
      }
    }, 450);
  });

  searchButton?.addEventListener("click", () => {
    currentQuery = searchInput?.value || "";
    loadUsuarios();
  });

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      searchInput.value = "";
      currentQuery = "";
      renderRows(allUsers);
      actualizarContador(allUsers.length);
    }
  });

  resetButton?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    currentQuery = "";
    renderRows(allUsers);
    actualizarContador(allUsers.length);
  });

  createButton?.addEventListener("click", async () => {
    const session = getStoredSession();
    if (session && session.token) {
      await openUsuarioForm("create", null, session.token, loadUsuarios);
    } else {
      if (typeof showAlert === 'function') showAlert('Sesión expirada. Por favor, inicia sesión nuevamente.', 'warning');
      setTimeout(() => { window.location.href = "../login.html"; }, 1500);
    }
  });

  // 4. Ejecución inicial: primero roles, luego usuarios
  await fetchRoles();
  await loadUsuarios();
});
