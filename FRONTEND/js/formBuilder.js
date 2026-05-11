/**
 * Utilidades para manejo de formularios
 */

/**
 * Llena los campos de un formulario con datos de un objeto
 * @param {String} formId - ID del formulario
 * @param {Object} data - Objeto con datos
 */
function fillForm(formId, data) {
  const form = document.getElementById(formId);
  if (!form) return;

  Object.keys(data).forEach((key) => {
    const element = form.elements[key];
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = data[key];
      } else if (element.type === 'radio') {
        const radio = form.querySelector(`input[name="${key}"][value="${data[key]}"]`);
        if (radio) radio.checked = true;
      } else if (element.tagName === 'SELECT') {
        // Para select, convertir el valor a string para coincidir con las opciones
        element.value = String(data[key] || '');
      } else {
        element.value = data[key] || '';
      }
    }
  });
}

/**
 * Extrae datos de un formulario y los retorna como objeto
 * @param {String} formId - ID del formulario
 * @returns {Object} Objeto con los datos del formulario
 */
function getFormData(formId) {
  const form = document.getElementById(formId);
  if (!form) return {};

  const data = {};

  // Procesar todos los elementos del formulario
  const formElements = form.querySelectorAll('input, select, textarea');
  formElements.forEach(element => {
    if (element.type === 'checkbox') {
      // Los checkboxes devuelven true/false
      data[element.name] = element.checked;
    } else if (element.type === 'radio') {
      // Los radios solo se incluyen si están seleccionados
      if (element.checked) {
        data[element.name] = element.value;
      }
    } else if (element.name) {
      // Inputs, selects, textareas
      data[element.name] = element.value;
    }
  });

  return data;
}

/**
 * Limpia todos los campos de un formulario
 * @param {String} formId - ID del formulario
 */
function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();
}

/**
 * Valida que un campo no esté vacío
 * @param {Element} element - Elemento del formulario
 * @returns {Boolean}
 */
function validateRequired(element) {
  return element.value.trim() !== '';
}

/**
 * Valida formato de email
 * @param {String} email - Email a validar
 * @returns {Boolean}
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Muestra error en un campo del formulario
 * @param {String} fieldName - Nombre del campo
 * @param {String} errorMessage - Mensaje de error
 * @param {String} formId - ID del formulario
 */
function showFieldError(fieldName, errorMessage, formId) {
  const form = document.getElementById(formId);
  const field = form.elements[fieldName];
  
  if (field) {
    field.classList.add('border-red-500', 'focus:ring-red-500');
    
    // Crear o actualizar elemento de error
    let errorElement = field.parentElement.querySelector('.field-error');
    if (!errorElement) {
      errorElement = document.createElement('small');
      errorElement.className = 'field-error text-red-500 block mt-1';
      field.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = errorMessage;
  }
}

/**
 * Limpia errores de un campo
 * @param {String} fieldName - Nombre del campo
 * @param {String} formId - ID del formulario
 */
function clearFieldError(fieldName, formId) {
  const form = document.getElementById(formId);
  const field = form.elements[fieldName];
  
  if (field) {
    field.classList.remove('border-red-500', 'focus:ring-red-500');
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) errorElement.remove();
  }
}

export {
  fillForm,
  getFormData,
  clearForm,
  validateRequired,
  validateEmail,
  showFieldError,
  clearFieldError,
};
