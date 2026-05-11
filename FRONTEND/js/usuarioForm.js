/**
 * Modal de formulario para crear/editar usuarios
 */

import { showToast } from './toast.js';
import { getFormData, fillForm, clearForm } from './formBuilder.js';
import { createUsuario, updateUsuario, getUsuarios, getRoles } from './api.js';

let currentMode = 'create';
let currentUsuarioId = null;

/**
 * Abre el modal de formulario de usuario
 * @param {String} mode - 'create' o 'edit'
 * @param {Object} usuarioData - Datos del usuario (si es edit)
 * @param {String} token - Token JWT
 * @param {Function} onSave - Callback después de guardar
 */
async function openUsuarioForm(mode = 'create', usuarioData = null, token, onSave) {
  // Proteger super usuario (IDUsuario = 1)
  if (mode === 'edit' && usuarioData?.IDUsuario === 1) {
    showToast('❌ No se puede editar al Super Usuario', 'error');
    return;
  }
  
  currentMode = mode;
  currentUsuarioId = usuarioData?.IDUsuario || null;

  // Crear modal
  const modal = document.createElement('div');
  modal.id = 'usuarioFormModal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-6 sticky top-0 bg-white">
          ${mode === 'create' ? '➕ Crear Usuario' : '✏️ Editar Usuario'}
      </h2>

      <form id="usuarioForm" class="space-y-6">
        <!-- SECCIÓN 1: DOCUMENTO -->
        <div class="border-b-2 border-slate-200 pb-6">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">📋 Información de Documento</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">📄 Tipo Documento <span class="text-red-500">*</span></label>
              <select name="TipoDocumento" required
                class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition">
                <option value="">Selecciona un tipo</option>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="PA">Pasaporte</option>
                <option value="NIT">NIT</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Número Documento <span class="text-red-500">*</span></label>
              <input type="text" name="NumeroDocumento" required
                class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="1234567890">
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: DATOS DE CONTACTO -->
        <div class="border-b-2 border-slate-200 pb-6">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">📱 Datos de Contacto</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Nombre <span class="text-red-500">*</span></label>
              <input type="text" name="Nombre" required
                class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Juan">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Apellido <span class="text-red-500">*</span></label>
              <input type="text" name="Apellido" required
                class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Pérez">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">📱 Teléfono</label>
              <input type="tel" name="Telefono"
                class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="3001234567">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">🌍 País</label>
              <input type="text" name="Pais"
                class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Colombia">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-2">📍 Dirección</label>
              <input type="text" name="Direccion"
                class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Calle 123 #456">
            </div>
          </div>
        </div>

        <!-- SECCIÓN 3: CREDENCIALES DE ACCESO -->
        <div class="border-b-2 border-slate-200 pb-6">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">🔐 Credenciales de Acceso</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">✉️ Email <span class="text-red-500">*</span></label>
              <input type="email" name="Email" required
                class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="juan@ejemplo.com">
            </div>
            ${mode === 'create' ? `
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-2">🔑 Contraseña <span class="text-red-500">*</span></label>
                <input type="password" name="Contrasena" required
                  class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  placeholder="Contraseña segura">
              </div>
            ` : ''}
          </div>
        </div>

        <!-- SECCIÓN 4: CONFIGURACIÓN -->
        <div>
          <h3 class="text-lg font-semibold text-slate-800 mb-4">⚙️ Configuración</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">👤 Rol <span class="text-red-500">*</span></label>
              <select name="IDRol" id="rolesSelect" required
                class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition">
                <option value="">Cargando roles...</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">🟢 Estado</label>
              <div class="flex items-center gap-3 p-3">
                <input type="checkbox" name="IsActive" id="isActiveCheck" class="w-5 h-5 accent-green-600" ${mode === 'create' ? 'checked' : ''}>
                <span id="isActiveLabel" class="text-slate-600 font-medium text-green-600">✓ Activo</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 justify-end">
          <button type="button" id="cancelBtn" class="px-6 py-2 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition">
            Cancelar
          </button>
          <button type="submit" class="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
            ${mode === 'create' ? '➕ Crear' : '💾 Guardar'}
          </button>
        </div>
      </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Cargar roles desde la API
  try {
    const rolesResponse = await getRoles(1, 100, token);
    const rolesSelect = modal.querySelector('#rolesSelect');
    rolesSelect.innerHTML = '';
    
    rolesResponse.data.forEach(rol => {
      const option = document.createElement('option');
      option.value = rol.IDRol;
      option.textContent = rol.Nombre;
      rolesSelect.appendChild(option);
    });
  } catch (error) {
    showToast(`⚠️ Error al cargar roles: ${error.message}`, 'error');
  }

  // Si es edit, llenar con datos
  if (mode === 'edit' && usuarioData) {
    fillForm('usuarioForm', usuarioData);
  }

  // Evento para cambiar el label del estado
  const isActiveCheck = modal.querySelector('#isActiveCheck');
  if (isActiveCheck) {
    const updateIsActiveLabel = () => {
      const label = modal.querySelector('#isActiveLabel');
      label.textContent = isActiveCheck.checked ? '✓ Activo' : '✗ Inactivo';
      label.className = `text-slate-600 font-medium ${isActiveCheck.checked ? 'text-green-600' : 'text-red-600'}`;
    };
    isActiveCheck.addEventListener('change', updateIsActiveLabel);
    updateIsActiveLabel();
  }

  // Manejadores
  const cancelBtn = modal.querySelector('#cancelBtn');
  const form = modal.querySelector('#usuarioForm');

  cancelBtn.addEventListener('click', closeUsuarioForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveUsuario(token, onSave);
  });

  // Cerrar con ESC
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', handleEscape);
      closeUsuarioForm();
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/**
 * Guarda el usuario (create o update)
 */
async function saveUsuario(token, onSave) {
  try {
    const form = document.getElementById('usuarioForm');
    const isActiveCheckbox = form.querySelector('input[name="IsActive"]');
    
    // Extraer datos del formulario
    const data = getFormData('usuarioForm');
    
    // Validar campos obligatorios
    if (!data.Email || !data.Email.trim()) {
      showToast('❌ El Email es obligatorio', 'error');
      return;
    }
    
    if (currentMode === 'create' && (!data.Contrasena || !data.Contrasena.trim())) {
      showToast('❌ La Contraseña es obligatoria', 'error');
      return;
    }
    
    if (!data.TipoDocumento || !data.TipoDocumento.trim()) {
      showToast('❌ El Tipo de Documento es obligatorio', 'error');
      return;
    }
    
    if (!data.NumeroDocumento || !data.NumeroDocumento.toString().trim()) {
      showToast('❌ El Número de Documento es obligatorio', 'error');
      return;
    }
    
    if (!data.Nombre || !data.Nombre.trim()) {
      showToast('❌ El Nombre es obligatorio', 'error');
      return;
    }
    
    if (!data.Apellido || !data.Apellido.trim()) {
      showToast('❌ El Apellido es obligatorio', 'error');
      return;
    }
    
    if (!data.IDRol || !data.IDRol.toString().trim()) {
      showToast('❌ El Rol es obligatorio', 'error');
      return;
    }
    
    // Permitir campos opcionales vacíos (null)
    Object.keys(data).forEach(key => {
      if (data[key] === '' || (typeof data[key] === 'string' && !data[key].trim())) {
        data[key] = null;
      }
    });
    
    // Asegurar que IsActive sea 1 o 0 (no true/false)
    if (isActiveCheckbox) {
      data.IsActive = isActiveCheckbox.checked ? 1 : 0;
      console.log('IsActive checkbox checked:', isActiveCheckbox.checked, '-> IsActive value:', data.IsActive);
    }

    if (currentMode === 'create') {
      // Crear: enviar todo
      console.log('Datos a crear:', data);
      await createUsuario(data, token);
      showToast('✅ Usuario creado exitosamente', 'success');
    } else {
      // Editar: solo enviar campos con valores (no vacíos)
      const updateData = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== '' && data[key] !== undefined) {
          updateData[key] = data[key];
        }
      });
      
      console.log('Datos a actualizar:', updateData);
      await updateUsuario(currentUsuarioId, updateData, token);
      showToast('✅ Usuario actualizado exitosamente', 'success');
    }

    closeUsuarioForm();
    if (onSave) onSave();
  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  }
}

/**
 * Cierra el modal
 */
function closeUsuarioForm() {
  const modal = document.getElementById('usuarioFormModal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => modal.remove(), 300);
  }
}

export { openUsuarioForm, closeUsuarioForm };
