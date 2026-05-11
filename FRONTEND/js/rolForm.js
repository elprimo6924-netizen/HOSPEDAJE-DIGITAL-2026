/**
 * Modal de formulario para crear/editar roles
 */

import { showToast } from './toast.js';
import { getFormData, fillForm, clearForm } from './formBuilder.js';
import { createRol, updateRol } from './api.js';

let currentMode = 'create';
let currentRolId = null;

// Permisos disponibles
const PERMISOS_DISPONIBLES = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'usuarios', label: 'Usuarios', icon: '👥' },
  { id: 'roles', label: 'Roles', icon: '🔐' },
  { id: 'habitaciones', label: 'Habitaciones', icon: '🏠' },
  { id: 'servicios', label: 'Servicios', icon: '🛎️' },
  { id: 'reservas', label: 'Reservas', icon: '📅' },
];

/**
 * Abre el modal de formulario de rol
 * @param {String} mode - 'create' o 'edit'
 * @param {Object} rolData - Datos del rol (si es edit)
 * @param {String} token - Token JWT
 * @param {Boolean} isProtected - Si es un rol protegido
 * @param {Function} onSave - Callback después de guardar
 */
async function openRolForm(mode = 'create', rolData = null, token, isProtected = false, onSave) {
  currentMode = mode;
  currentRolId = rolData?.IDRol || null;

  // Crear modal
  const modal = document.createElement('div');
  modal.id = 'rolFormModal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl my-8">
      <h2 class="text-2xl font-bold text-slate-800 mb-6">
        ${mode === 'create' ? '➕ Crear Rol' : '✏️ Editar Rol'}
      </h2>

      ${isProtected && mode === 'edit' ? `
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p class="text-yellow-700 font-medium">⚠️ Este es un rol protegido y no puede ser eliminado ni desactivado.</p>
        </div>
      ` : ''}

      <form id="rolForm" class="space-y-6">
        <!-- Nombre del Rol -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">📋 Nombre del Rol <span class="text-red-500">*</span></label>
          <input type="text" name="Nombre" required
            class="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            placeholder="Gestor de Reservas"
            ${isProtected && mode === 'edit' ? 'disabled' : ''}>
        </div>

        <!-- Estado y Control Total -->
        ${!isProtected || mode === 'create' ? `
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Estado</label>
              <div class="flex items-center gap-3">
                <input type="checkbox" id="estadoCheck" class="w-5 h-5 accent-green-600">
                <span id="estadoLabel" class="text-slate-600 font-medium">Activo</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Control Total</label>
              <div class="flex items-center gap-3">
                <input type="checkbox" id="controlTotalCheck" class="w-5 h-5 accent-orange-600">
                <span id="controlTotalLabel" class="text-slate-600 font-medium">Marcar todos</span>
              </div>
            </div>
          </div>
        ` : `
          <input type="hidden" name="Estado" value="1">
        `}

        <!-- Sección de Permisos -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-3">🔒 Permisos del Rol</label>
          <p class="text-xs text-slate-500 mb-3">Selecciona qué secciones del sistema podrá ver este rol</p>
          <div class="grid grid-cols-2 gap-3">
            ${PERMISOS_DISPONIBLES.map(permiso => `
              <label class="flex items-center p-3 border-2 border-slate-200 rounded-lg hover:border-blue-400 cursor-pointer transition">
                <input type="checkbox" name="permisos" value="${permiso.id}" class="permiso-checkbox w-5 h-5">
                <span class="ml-3 text-slate-700">
                  <span class="text-lg">${permiso.icon}</span>
                  <span class="font-medium">${permiso.label}</span>
                </span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 justify-end">
          <button type="button" id="cancelBtn" class="px-6 py-2 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition">
            Cancelar
          </button>
          <button type="submit" class="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            ${isProtected && mode === 'edit' ? 'disabled' : ''}>
            ${mode === 'create' ? '➕ Crear' : '💾 Guardar'}
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Si es edit, llenar con datos
  if (mode === 'edit' && rolData) {
    const nombreInput = modal.querySelector('input[name="Nombre"]');
    const estadoCheck = modal.querySelector('#estadoCheck');
    if (nombreInput) nombreInput.value = rolData.Nombre;
    if (estadoCheck) estadoCheck.checked = rolData.IsActive === 1;

    // Llenar permisos guardados si existen
    if (rolData.Permisos) {
      const permisos = typeof rolData.Permisos === 'string' ? JSON.parse(rolData.Permisos) : rolData.Permisos;
      const checkboxes = modal.querySelectorAll('.permiso-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = permisos.includes(checkbox.value);
      });
    }
  } else if (mode === 'create') {
    // Crear: marcar por defecto como activo
    const estadoCheck = modal.querySelector('#estadoCheck');
    if (estadoCheck) estadoCheck.checked = true;
  }

  // Evento para cambiar el label del estado
  const estadoCheck = modal.querySelector('#estadoCheck');
  if (estadoCheck) {
    const updateEstadoLabel = () => {
      const label = modal.querySelector('#estadoLabel');
      label.textContent = estadoCheck.checked ? '✓ Activo' : '✗ Inactivo';
      label.className = `text-slate-600 font-medium ${estadoCheck.checked ? 'text-green-600' : 'text-red-600'}`;
    };
    estadoCheck.addEventListener('change', updateEstadoLabel);
    updateEstadoLabel();
  }

  // Lógica de "Control Total"
  const controlTotalCheck = modal.querySelector('#controlTotalCheck');
  const permisoCheckboxes = modal.querySelectorAll('.permiso-checkbox');

  if (controlTotalCheck) {
    // Si "Control Total" está checked, marcar todos
    controlTotalCheck.addEventListener('change', () => {
      permisoCheckboxes.forEach(checkbox => {
        checkbox.checked = controlTotalCheck.checked;
      });
    });

    // Si todos están marcados, marcar "Control Total"
    const updateControlTotal = () => {
      const allChecked = Array.from(permisoCheckboxes).every(cb => cb.checked);
      controlTotalCheck.checked = allChecked && permisoCheckboxes.length > 0;
    };

    permisoCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateControlTotal);
    });
  }

  // Manejadores
  const cancelBtn = modal.querySelector('#cancelBtn');
  const form = modal.querySelector('#rolForm');

  cancelBtn.addEventListener('click', closeRolForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveRol(token, onSave);
  });

  // Cerrar con ESC
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', handleEscape);
      closeRolForm();
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/**
 * Guarda el rol (create o update)
 */
async function saveRol(token, onSave) {
  try {
    const form = document.getElementById('rolForm');
    const nombre = form.elements['Nombre'].value;
    const estadoCheck = form.querySelector('#estadoCheck');
    const permisoCheckboxes = form.querySelectorAll('.permiso-checkbox:checked');
    
    if (!nombre || nombre.trim() === '') {
      showToast('⚠️ El nombre del rol es requerido', 'info');
      return;
    }

    // Recopilar permisos seleccionados
    const permisos = Array.from(permisoCheckboxes).map(cb => cb.value);

    const data = {
      Nombre: nombre,
      Estado: estadoCheck && estadoCheck.checked ? 1 : 0,
      Permisos: permisos,
    };

    if (currentMode === 'create') {
      await createRol(data, token);
      showToast('✅ Rol creado exitosamente', 'success');
    } else {
      await updateRol(currentRolId, data, token);
      showToast('✅ Rol actualizado exitosamente', 'success');
    }

    closeRolForm();
    if (onSave) onSave();
  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  }
}

/**
 * Cierra el modal
 */
function closeRolForm() {
  const modal = document.getElementById('rolFormModal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => modal.remove(), 300);
  }
}

export { openRolForm, closeRolForm, PERMISOS_DISPONIBLES };
