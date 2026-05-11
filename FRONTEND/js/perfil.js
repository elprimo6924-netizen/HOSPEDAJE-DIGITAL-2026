document.addEventListener('DOMContentLoaded', async () => {
    const session = window.getStoredSession ? window.getStoredSession() : verificarSesion();

    if (!session) {
        window.location.href = '../login.html';
        return;
    }

    await window.loadSidebarComponent('sidebar-placeholder');
    await window.filterSidebarByPermissions();

    const userId = session.usuario.IDUsuario || session.usuario.id;
    const viewMode = document.getElementById('profileViewMode');
    const editMode = document.getElementById('profileForm');
    const editBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const form = document.getElementById('profileForm');

    let userData = null;

    const setViewValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value ?? '-';
    };

    const setFieldValue = (id, value) => {
        const input = document.getElementById(id);
        if (input) input.value = value ?? '';
    };

    const toggleMode = (isEdit) => {
        if (isEdit) {
            viewMode.classList.add('hidden');
            editMode.classList.remove('hidden');
        } else {
            viewMode.classList.remove('hidden');
            editMode.classList.add('hidden');
        }
    };

    const loadProfileData = async () => {
        try {
            userData = await window.apiRequest(`/usuarios/${userId}`);
            
            // Modo vista
            setViewValue('viewTipoDocumento', userData.TipoDocumento || '-');
            setViewValue('viewNumeroDocumento', userData.NumeroDocumento || '-');
            setViewValue('viewNombre', userData.Nombre || userData.NombreUsuario || '-');
            setViewValue('viewApellido', userData.Apellido || '-');
            setViewValue('viewTelefono', userData.Telefono || '-');
            setViewValue('viewPais', userData.Pais || '-');
            setViewValue('viewDireccion', userData.Direccion || '-');
            setViewValue('viewNombreUsuario', userData.NombreUsuario || '-');
            setViewValue('viewEmail', userData.Email || '-');
            setViewValue('viewRol', userData.NombreRol || window.getRoleName(userData.IDRol) || '-');

            // Modo edición
            setFieldValue('TipoDocumento', userData.TipoDocumento || '');
            setFieldValue('NumeroDocumento', userData.NumeroDocumento || '');
            setFieldValue('Nombre', userData.Nombre || '');
            setFieldValue('Apellido', userData.Apellido || '');
            setFieldValue('Telefono', userData.Telefono || '');
            setFieldValue('Pais', userData.Pais || '');
            setFieldValue('Direccion', userData.Direccion || '');
            setFieldValue('NombreUsuario', userData.NombreUsuario || '');
            setFieldValue('Email', userData.Email || '');
            setFieldValue('Rol', userData.NombreRol || window.getRoleName(userData.IDRol) || '');
        } catch (error) {
            alert(error.message || 'No se pudieron cargar los datos del perfil');
        }
    };

    // Cargar datos iniciales
    await loadProfileData();

    // Botón editar
    editBtn?.addEventListener('click', () => toggleMode(true));

    // Botón cancelar edición
    cancelEditBtn?.addEventListener('click', () => toggleMode(false));

    // Envío del formulario
    form?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const tipoDoc = document.getElementById('TipoDocumento')?.value?.trim() || '';
        const numDoc = document.getElementById('NumeroDocumento')?.value?.trim() || '';
        const nombre = document.getElementById('Nombre')?.value?.trim() || '';
        const apellido = document.getElementById('Apellido')?.value?.trim() || '';

        if (!tipoDoc) {
            alert('El tipo de documento es requerido');
            return;
        }
        if (!numDoc) {
            alert('El número de documento es requerido');
            return;
        }
        if (!nombre) {
            alert('El nombre es requerido');
            return;
        }
        if (!apellido) {
            alert('El apellido es requerido');
            return;
        }

        const payload = {
            TipoDocumento: tipoDoc,
            NumeroDocumento: numDoc,
            Nombre: nombre,
            Apellido: apellido,
            Telefono: document.getElementById('Telefono')?.value?.trim() || '',
            Direccion: document.getElementById('Direccion')?.value?.trim() || '',
            Pais: document.getElementById('Pais')?.value?.trim() || '',
        };

        try {
            await window.apiRequest(`/usuarios/${userId}`, {
                method: 'PUT',
                body: payload,
            });

            alert('Perfil actualizado correctamente');
            await loadProfileData();
            toggleMode(false);
        } catch (error) {
            alert(error.message || 'No se pudo actualizar el perfil');
        }
    });

    // Botón eliminar cuenta
    deleteAccountBtn?.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.')) {
            return;
        }
        
        if (!confirm('Esta es una advertencia final. ¿Realmente deseas continuar?')) {
            return;
        }

        try {
            await window.apiRequest(`/usuarios/${userId}`, {
                method: 'DELETE',
            });

            alert('Cuenta eliminada correctamente');
            window.location.href = '../login.html';
        } catch (error) {
            alert(error.message || 'No se pudo eliminar la cuenta');
        }
    });
});