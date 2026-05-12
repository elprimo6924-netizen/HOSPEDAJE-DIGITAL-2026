// ============================================
// FUNCIONES DE VALIDACIÓN — v2.0
// ✏️ MODIFICADO: Reescritura completa con corrección de bugs
// y nuevas funciones de validación
// ============================================

// ✏️ MODIFICADO: Regex robusta con TLD mínimo de 2 caracteres (Bug #3)
function validarEmail(email) {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!regex.test(email)) {
        return {
            valido: false,
            mensaje: 'El formato del email no es válido'
        };
    }
    return { valido: true };
}

// Validar que un campo no esté vacío
function validarRequerido(valor, nombreCampo) {
    if (!valor || String(valor).trim() === '') {
        return {
            valido: false,
            mensaje: `El campo ${nombreCampo} es requerido`
        };
    }
    return { valido: true };
}

// Validar número de teléfono
function validarTelefono(telefono) {
    const limpio = telefono.replace(/[\s\-\(\)]/g, '');
    const regex = /^[0-9]{7,15}$/;
    if (!regex.test(limpio)) {
        return {
            valido: false,
            mensaje: 'El teléfono debe tener entre 7 y 15 dígitos'
        };
    }
    return { valido: true };
}

// Validar que un valor sea numérico
function validarNumerico(valor, nombreCampo) {
    if (isNaN(valor) || valor === '' || valor === null || valor === undefined) {
        return {
            valido: false,
            mensaje: `El campo ${nombreCampo} debe ser un número`
        };
    }
    return { valido: true };
}

// Validar que un valor sea positivo (estricto > 0)
function validarPositivo(valor, nombreCampo) {
    if (parseFloat(valor) <= 0) {
        return {
            valido: false,
            mensaje: `El campo ${nombreCampo} debe ser un valor positivo`
        };
    }
    return { valido: true };
}

// ✏️ MODIFICADO: Nueva función — permite 0 para duraciones (Bug #4)
function validarNoNegativo(valor, nombreCampo) {
    if (parseFloat(valor) < 0) {
        return {
            valido: false,
            mensaje: `${nombreCampo} no puede ser negativo`
        };
    }
    return { valido: true };
}

// Validar fecha
function validarFecha(fecha) {
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
        return {
            valido: false,
            mensaje: 'La fecha no es válida'
        };
    }
    return { valido: true };
}

// Validar que una fecha sea futura
function validarFechaFutura(fecha, nombreCampo) {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaObj < hoy) {
        return {
            valido: false,
            mensaje: `La ${nombreCampo} debe ser una fecha futura`
        };
    }
    return { valido: true };
}

// ✏️ MODIFICADO: Nueva función — permite reservas para hoy (Bug #6)
function validarFechaNoAnterior(fecha, nombreCampo) {
    const fechaObj = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaObj < hoy) {
        return {
            valido: false,
            mensaje: `${nombreCampo} no puede ser en el pasado`
        };
    }
    return { valido: true };
}

// Validar rango de fechas (entrada antes que salida)
function validarRangoFechas(fechaEntrada, fechaSalida) {
    const entrada = new Date(fechaEntrada);
    const salida = new Date(fechaSalida);

    if (salida <= entrada) {
        return {
            valido: false,
            mensaje: 'La fecha de salida debe ser posterior a la fecha de entrada'
        };
    }
    return { valido: true };
}

// ✏️ MODIFICADO: Nueva función — mínimo 1 noche de estadía
function validarMinimaNoche(fechaEntrada, fechaSalida) {
    const entrada = new Date(fechaEntrada + 'T00:00:00');
    const salida = new Date(fechaSalida + 'T00:00:00');
    const diffMs = salida - entrada;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    if (diffDias < 1) {
        return {
            valido: false,
            mensaje: 'La estadía mínima es de 1 noche'
        };
    }
    return { valido: true };
}

// Validar longitud mínima
function validarLongitudMinima(valor, minimo, nombreCampo) {
    if (String(valor).length < minimo) {
        return {
            valido: false,
            mensaje: `El campo ${nombreCampo} debe tener al menos ${minimo} caracteres`
        };
    }
    return { valido: true };
}

// Validar longitud máxima
function validarLongitudMaxima(valor, maximo, nombreCampo) {
    if (String(valor).length > maximo) {
        return {
            valido: false,
            mensaje: `El campo ${nombreCampo} no puede exceder ${maximo} caracteres`
        };
    }
    return { valido: true };
}

// ✏️ MODIFICADO: Nueva función — validar documento (Bug #5)
function validarDocumento(documento) {
    const limpio = documento.trim().replace(/\s/g, '');
    if (!/^[0-9A-Za-z\-]{5,20}$/.test(limpio)) {
        return {
            valido: false,
            mensaje: 'Documento inválido (5-20 caracteres alfanuméricos)'
        };
    }
    return { valido: true };
}

// ✏️ MODIFICADO: Nueva función — validar contraseña segura
function validarContrasena(contrasena) {
    const errores = [];
    if (contrasena.length < 8) errores.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(contrasena)) errores.push('Al menos una mayúscula');
    if (!/[0-9]/.test(contrasena)) errores.push('Al menos un número');
    if (errores.length > 0) {
        return { valido: false, mensaje: errores.join(' · ') };
    }
    return { valido: true };
}

// ✏️ MODIFICADO: Nueva función — confirmar contraseñas
function validarConfirmacionContrasena(contrasena, confirmacion) {
    if (contrasena !== confirmacion) {
        return { valido: false, mensaje: 'Las contraseñas no coinciden' };
    }
    return { valido: true };
}

// ✏️ MODIFICADO: Nueva función — validar nombre/apellido (sin números)
function validarNombrePersona(valor, nombreCampo) {
    const limpio = valor.trim();
    if (limpio.length < 2) {
        return { valido: false, mensaje: `${nombreCampo} muy corto` };
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-']+$/.test(limpio)) {
        return {
            valido: false,
            mensaje: `${nombreCampo} solo puede contener letras`
        };
    }
    return { valido: true };
}

// ✏️ MODIFICADO: Nueva función — entero positivo
function validarEnteroPositivo(valor, nombreCampo) {
    const num = parseInt(valor, 10);
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        return {
            valido: false,
            mensaje: `${nombreCampo} debe ser un número entero mayor a 0`
        };
    }
    return { valido: true };
}

// ✏️ MODIFICADO: Nueva función — validar precio/costo
function validarPrecio(valor, nombreCampo) {
    const num = parseFloat(valor);
    if (isNaN(num) || num <= 0) {
        return {
            valido: false,
            mensaje: `${nombreCampo} debe ser mayor a $0`
        };
    }
    if (num > 99999999) {
        return {
            valido: false,
            mensaje: `${nombreCampo} excede el valor máximo permitido`
        };
    }
    return { valido: true };
}

// ============================================
// VALIDACIONES DE FORMULARIOS COMPLETOS
// ============================================

// Validar formulario de cliente
function validarFormularioCliente(cliente) {
    const errores = [];

    // Validar nombre
    const validacionNombre = validarRequerido(cliente.NombreCliente, 'Nombre');
    if (!validacionNombre.valido) {
        errores.push(validacionNombre.mensaje);
    }

    // Validar email
    const validacionEmail = validarEmail(cliente.EmailCliente);
    if (!validacionEmail.valido) {
        errores.push(validacionEmail.mensaje);
    }

    // Validar teléfono
    if (cliente.TelefonoCliente) {
        const validacionTelefono = validarTelefono(cliente.TelefonoCliente);
        if (!validacionTelefono.valido) {
            errores.push(validacionTelefono.mensaje);
        }
    }

    return {
        valido: errores.length === 0,
        errores: errores
    };
}

// Validar formulario de reserva
function validarFormularioReserva(reserva) {
    const errores = [];

    // Validar habitación
    const validacionHabitacion = validarNumerico(reserva.IDHabitacion, 'Habitación');
    if (!validacionHabitacion.valido) {
        errores.push(validacionHabitacion.mensaje);
    }

    // Validar fecha de entrada
    const validacionFechaEntrada = validarFecha(reserva.FechaEntrada);
    if (!validacionFechaEntrada.valido) {
        errores.push(validacionFechaEntrada.mensaje);
    } else {
        // ✏️ MODIFICADO: Usar validarFechaNoAnterior para permitir hoy
        const validacionFutura = validarFechaNoAnterior(reserva.FechaEntrada, 'Fecha de entrada');
        if (!validacionFutura.valido) {
            errores.push(validacionFutura.mensaje);
        }
    }

    // Validar fecha de salida
    const validacionFechaSalida = validarFecha(reserva.FechaSalida);
    if (!validacionFechaSalida.valido) {
        errores.push(validacionFechaSalida.mensaje);
    }

    // Validar rango de fechas y mínima noche
    if (reserva.FechaEntrada && reserva.FechaSalida) {
        const validacionRango = validarRangoFechas(reserva.FechaEntrada, reserva.FechaSalida);
        if (!validacionRango.valido) {
            errores.push(validacionRango.mensaje);
        } else {
            const validacionNoche = validarMinimaNoche(reserva.FechaEntrada, reserva.FechaSalida);
            if (!validacionNoche.valido) {
                errores.push(validacionNoche.mensaje);
            }
        }
    }

    // Validar número de adultos
    const validacionAdultos = validarNumerico(reserva.NumeroAdultos, 'Número de adultos');
    if (!validacionAdultos.valido) {
        errores.push(validacionAdultos.mensaje);
    } else {
        const validacionPositivo = validarPositivo(reserva.NumeroAdultos, 'Número de adultos');
        if (!validacionPositivo.valido) {
            errores.push(validacionPositivo.mensaje);
        }
    }

    return {
        valido: errores.length === 0,
        errores: errores
    };
}

// Validar formulario de habitación
function validarFormularioHabitacion(habitacion) {
    const errores = [];

    // Validar nombre
    const validacionNombre = validarRequerido(habitacion.NombreHabitacion, 'Nombre');
    if (!validacionNombre.valido) {
        errores.push(validacionNombre.mensaje);
    }

    // Validar descripción
    const validacionDescripcion = validarRequerido(habitacion.Descripcion, 'Descripción');
    if (!validacionDescripcion.valido) {
        errores.push(validacionDescripcion.mensaje);
    }

    // ✏️ MODIFICADO: Usar validarPrecio para costo
    const validacionCosto = validarPrecio(habitacion.Costo, 'Costo');
    if (!validacionCosto.valido) {
        errores.push(validacionCosto.mensaje);
    }

    // Validar estado
    const validacionEstado = validarNumerico(habitacion.Estado, 'Estado');
    if (!validacionEstado.valido) {
        errores.push(validacionEstado.mensaje);
    }

    return {
        valido: errores.length === 0,
        errores: errores
    };
}

// Validar formulario de servicio
function validarFormularioServicio(servicio) {
    const errores = [];

    // Validar nombre
    const validacionNombre = validarRequerido(servicio.NombreServicio, 'Nombre');
    if (!validacionNombre.valido) {
        errores.push(validacionNombre.mensaje);
    }

    // Validar descripción
    const validacionDescripcion = validarRequerido(servicio.Descripcion, 'Descripción');
    if (!validacionDescripcion.valido) {
        errores.push(validacionDescripcion.mensaje);
    }

    // ✏️ MODIFICADO: Usar validarNoNegativo para duración (Bug #4)
    const validacionDuracion = validarNumerico(servicio.Duracion, 'Duración');
    if (!validacionDuracion.valido) {
        errores.push(validacionDuracion.mensaje);
    } else {
        const validacionDuracionPositiva = validarNoNegativo(servicio.Duracion, 'Duración');
        if (!validacionDuracionPositiva.valido) {
            errores.push(validacionDuracionPositiva.mensaje);
        }
    }

    // ✏️ MODIFICADO: Usar validarPrecio para costo
    const validacionCosto = validarPrecio(servicio.Costo, 'Costo');
    if (!validacionCosto.valido) {
        errores.push(validacionCosto.mensaje);
    }

    // Validar cantidad máxima de personas
    const validacionCantidad = validarEnteroPositivo(servicio.CantidadMaximaPersonas, 'Cantidad máxima');
    if (!validacionCantidad.valido) {
        errores.push(validacionCantidad.mensaje);
    }

    // Validar estado
    const validacionEstado = validarNumerico(servicio.Estado, 'Estado');
    if (!validacionEstado.valido) {
        errores.push(validacionEstado.mensaje);
    }

    return {
        valido: errores.length === 0,
        errores: errores
    };
}

// ✏️ MODIFICADO: Nueva función — validar formulario de registro
function validarFormularioRegistro(datos) {
    const errores = [];

    const vNombre = validarNombrePersona(datos.nombre, 'Nombre');
    if (!vNombre.valido) errores.push(vNombre.mensaje);

    const vApellido = validarNombrePersona(datos.apellido, 'Apellido');
    if (!vApellido.valido) errores.push(vApellido.mensaje);

    const vEmail = validarEmail(datos.email);
    if (!vEmail.valido) errores.push(vEmail.mensaje);

    const vPass = validarContrasena(datos.contrasena);
    if (!vPass.valido) errores.push(vPass.mensaje);

    const vConfirm = validarConfirmacionContrasena(datos.contrasena, datos.confirmar);
    if (!vConfirm.valido) errores.push(vConfirm.mensaje);

    if (datos.telefono) {
        const vTel = validarTelefono(datos.telefono);
        if (!vTel.valido) errores.push(vTel.mensaje);
    }

    return { valido: errores.length === 0, errores };
}

// ============================================
// FEEDBACK VISUAL EN FORMULARIOS
// ============================================

// ✏️ MODIFICADO: Nueva función — estados visuales de campos
function setFieldState(input, estado, mensaje = '') {
    const wrapper = input.closest('.field-wrapper') || input.parentElement;

    // Limpiar clases anteriores
    input.classList.remove(
        'border-slate-200', 'border-green-400', 'border-red-400',
        'bg-slate-100', 'bg-green-50', 'bg-red-50',
        'ring-2', 'ring-green-500/10', 'ring-red-500/10'
    );

    // Remover mensaje anterior
    const prevMsg = wrapper.querySelector('.field-error-msg');
    if (prevMsg) prevMsg.remove();

    if (estado === 'valido') {
        input.classList.add('border-green-400', 'bg-green-50', 'ring-2', 'ring-green-500/10');
    } else if (estado === 'invalido') {
        input.classList.add('border-red-400', 'bg-red-50', 'ring-2', 'ring-red-500/10');
        if (mensaje) {
            const errorEl = document.createElement('p');
            errorEl.className = 'field-error-msg text-red-500 text-xs mt-1 flex items-center gap-1';
            errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${mensaje}`;
            wrapper.appendChild(errorEl);
        }
    } else {
        // neutro
        input.classList.add('border-slate-200', 'bg-slate-100');
    }
}

// ✏️ MODIFICADO: Nueva función — calcular fortaleza de contraseña
function calcularFortaleza(pass) {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return Math.min(score, 4);
}

// ✏️ MODIFICADO: Nueva función — modal de confirmación Tailwind
function confirmarAccion({ titulo, mensaje, textoConfirmar = 'Eliminar', onConfirmar, tipo = 'danger' }) {
    const colores = {
        danger: {
            btn: 'bg-red-600 hover:bg-red-700 shadow-red-200',
            icon: 'fa-trash text-red-500',
            bg: 'bg-red-50'
        },
        warning: {
            btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
            icon: 'fa-triangle-exclamation text-amber-500',
            bg: 'bg-amber-50'
        }
    };
    const c = colores[tipo] || colores.danger;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
    overlay.style.animation = 'fadeIn 0.2s ease-out';
    overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" style="animation: scaleIn 0.2s ease-out;">
            <div class="w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i class="fa-solid ${c.icon} text-2xl"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 text-center mb-2">${titulo}</h3>
            <p class="text-slate-500 text-sm text-center mb-6">${mensaje}</p>
            <div class="flex gap-3">
                <button id="confirm-cancel-btn"
                    class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200
                           text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer">
                    Cancelar
                </button>
                <button id="confirm-ok-btn"
                    class="flex-1 px-4 py-2.5 rounded-xl ${c.btn} text-white
                           font-semibold text-sm shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
                    ${textoConfirmar}
                </button>
            </div>
        </div>
    `;

    // Inject animations if not present
    if (!document.getElementById('confirm-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'confirm-modal-styles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-cancel-btn').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => {
        overlay.remove();
        onConfirmar();
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// ✏️ MODIFICADO: Nueva función — deshabilitar/habilitar botón según validez
function checkFormValidity(formId, btnId, validators) {
    const form = document.getElementById(formId);
    const btn = document.getElementById(btnId);
    if (!form || !btn) return;

    function updateBtn() {
        const allValid = validators.every(({ fieldId, fn }) => {
            const field = document.getElementById(fieldId);
            if (!field) return true;
            const val = field.value;
            if (!val && !field.required) return true;
            return fn(val).valido;
        });
        btn.disabled = !allValid;
        btn.classList.toggle('opacity-50', !allValid);
        btn.classList.toggle('cursor-not-allowed', !allValid);
    }

    form.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', updateBtn);
        el.addEventListener('change', updateBtn);
    });
    updateBtn();
}

// Mostrar errores de validación
function mostrarErroresValidacion(errores, contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (contenedor) {
        contenedor.innerHTML = errores.map(error =>
            `<p class="error-validacion">${error}</p>`
        ).join('');
        contenedor.style.display = 'block';
    }
}

// Limpiar errores de validación
function limpiarErroresValidacion(contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (contenedor) {
        contenedor.innerHTML = '';
        contenedor.style.display = 'none';
    }
}

// Exportar funciones (para Node.js si se usa en tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validarRequerido,
        validarEmail,
        validarTelefono,
        validarNumerico,
        validarPositivo,
        validarNoNegativo,
        validarFecha,
        validarFechaFutura,
        validarFechaNoAnterior,
        validarRangoFechas,
        validarMinimaNoche,
        validarLongitudMinima,
        validarLongitudMaxima,
        validarDocumento,
        validarContrasena,
        validarConfirmacionContrasena,
        validarNombrePersona,
        validarEnteroPositivo,
        validarPrecio,
        validarFormularioCliente,
        validarFormularioReserva,
        validarFormularioHabitacion,
        validarFormularioServicio,
        validarFormularioRegistro,
        setFieldState,
        calcularFortaleza,
        confirmarAccion,
        checkFormValidity,
        mostrarErroresValidacion,
        limpiarErroresValidacion
    };
}
