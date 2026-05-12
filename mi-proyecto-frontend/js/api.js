// ============================================
// FUNCIONES DE API - SOLO BACKEND REAL
// ============================================

const API_BASE_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
    ? CONFIG.API_URL
    : 'http://localhost:3000/api';

const API_TIMEOUT_MS = (typeof CONFIG !== 'undefined' && CONFIG.FETCH_TIMEOUT)
    ? CONFIG.FETCH_TIMEOUT
    : 10000;

const apiLogger = {
    log: (...args) => {
        if (typeof CONFIG !== 'undefined' && CONFIG.ENABLE_LOGS) {
            console.log('[API]', ...args);
        }
    },
    error: (...args) => {
        console.error('[API ERROR]', ...args);
    }
};

const apiRuntimeState = {
    lastError: null
};

function setApiLastError(message) {
    apiRuntimeState.lastError = message;
}

function clearApiLastError() {
    apiRuntimeState.lastError = null;
}

function getApiLastError() {
    return apiRuntimeState.lastError;
}

async function extraerMensajeErrorRespuesta(response) {
    const contentType = response.headers.get('content-type') || '';

    try {
        if (contentType.includes('application/json')) {
            const data = await response.json();

            if (typeof data === 'string' && data.trim()) {
                return data.trim();
            }

            if (data && typeof data === 'object') {
                return data.message || data.mensaje || data.error || data.detail || null;
            }
        }

        const text = await response.text();
        return text?.trim() || null;
    } catch {
        return null;
    }
}

if (typeof window !== 'undefined') {
    window.getApiLastError = getApiLastError;
}

async function requestJson(endpoint, options = {}) {
    const {
        method = 'GET',
        body,
        allowNoContent = false
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            signal: controller.signal,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const mensajeBackend = await extraerMensajeErrorRespuesta(response);
            const mensajeError = mensajeBackend
                ? mensajeBackend
                : `${method} ${endpoint} -> ${response.status} ${response.statusText}`;

            throw new Error(mensajeError);
        }

        if (allowNoContent && response.status === 204) {
            return { success: true };
        }

        try {
            const data = await response.json();
            clearApiLastError();
            return data;
        } catch {
            clearApiLastError();
            return allowNoContent ? { success: true } : null;
        }
    } catch (error) {
        setApiLastError(error.message || 'Error de conexión con el backend');
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function obtenerHabitaciones() {
    apiLogger.log('Obteniendo habitaciones...');
    try {
        const data = await requestJson('/habitaciones');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener habitaciones:', error.message);
        return [];
    }
}

async function obtenerHabitacionPorId(id) {
    apiLogger.log('Obteniendo habitaci�n por ID:', id);
    try {
        return await requestJson(`/habitaciones/${id}`);
    } catch (error) {
        apiLogger.error('Error al obtener habitaci�n:', error.message);
        return null;
    }
}

async function crearHabitacion(habitacion) {
    apiLogger.log('Creando habitaci�n:', habitacion);
    try {
        return await requestJson('/habitaciones', { method: 'POST', body: habitacion });
    } catch (error) {
        apiLogger.error('Error al crear habitaci�n:', error.message);
        return null;
    }
}

async function actualizarHabitacion(id, habitacion) {
    apiLogger.log('Actualizando habitaci�n:', id, habitacion);
    try {
        return await requestJson(`/habitaciones/${id}`, { method: 'PUT', body: habitacion });
    } catch (error) {
        apiLogger.error('Error al actualizar habitaci�n:', error.message);
        return null;
    }
}

async function eliminarHabitacion(id) {
    apiLogger.log('Eliminando habitaci�n:', id);
    try {
        return await requestJson(`/habitaciones/${id}`, { method: 'DELETE', allowNoContent: true });
    } catch (error) {
        apiLogger.error('Error al eliminar habitaci�n:', error.message);
        return null;
    }
}




async function obtenerServicios() {
    apiLogger.log('Obteniendo servicios...');
    try {
        const data = await requestJson('/servicios');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener servicios:', error.message);
        return [];
    }
}

async function obtenerServicioPorId(id) {
    apiLogger.log('Obteniendo servicio por ID:', id);
    try {
        return await requestJson(`/servicios/${id}`);
    } catch (error) {
        apiLogger.error('Error al obtener servicio:', error.message);
        return null;
    }
}

async function crearServicio(servicio) {
    apiLogger.log('Creando servicio:', servicio);
    try {
        return await requestJson('/servicios', { method: 'POST', body: servicio });
    } catch (error) {
        apiLogger.error('Error al crear servicio:', error.message);
        return null;
    }
}

async function actualizarServicio(id, servicio) {
    apiLogger.log('Actualizando servicio:', id, servicio);
    try {
        return await requestJson(`/servicios/${id}`, { method: 'PUT', body: servicio });
    } catch (error) {
        apiLogger.error('Error al actualizar servicio:', error.message);
        return null;
    }
}

async function eliminarServicio(id) {
    apiLogger.log('Eliminando servicio:', id);
    try {
        return await requestJson(`/servicios/${id}`, { method: 'DELETE', allowNoContent: true });
    } catch (error) {
        apiLogger.error('Error al eliminar servicio:', error.message);
        return null;
    }
}

// ============================================
// AUTH
// ============================================

function getAuthToken() {
    return localStorage.getItem('hospedaje_token');
}

function setAuthToken(token) {
    localStorage.setItem('hospedaje_token', token);
}

function clearAuthToken() {
    localStorage.removeItem('hospedaje_token');
}

async function requestJsonAuth(endpoint, options = {}) {
    const { method = 'GET', body, allowNoContent = false } = options;
    const token = getAuthToken();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            signal: controller.signal,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (response.status === 401 || response.status === 403) {
            clearAuthToken();
            if (typeof mostrarModalLogin === 'function') mostrarModalLogin();
            throw new Error('Sesión expirada. Por favor inicia sesión.');
        }

        if (!response.ok) {
            const mensajeBackend = await extraerMensajeErrorRespuesta(response);
            throw new Error(mensajeBackend || `${method} ${endpoint} -> ${response.status} ${response.statusText}`);
        }

        if (allowNoContent && response.status === 204) return { success: true };

        try {
            const data = await response.json();
            clearApiLastError();
            return data;
        } catch {
            clearApiLastError();
            return allowNoContent ? { success: true } : null;
        }
    } catch (error) {
        setApiLastError(error.message || 'Error de conexión con el backend');
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function loginUsuario(email, contrasena) {
    apiLogger.log('Iniciando sesión...');
    return await requestJson('/auth/login', {
        method: 'POST',
        body: { Email: email, Contrasena: contrasena }
    });
}

// ============================================
// RESERVAS
// ============================================

async function obtenerReservas() {
    apiLogger.log('Obteniendo reservas...');
    try {
        const data = await requestJson('/reservas');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener reservas:', error.message);
        return [];
    }
}

async function crearReserva(reserva) {
    apiLogger.log('Creando reserva:', reserva);
    try {
        return await requestJson('/reservas', { method: 'POST', body: reserva });
    } catch (error) {
        apiLogger.error('Error al crear reserva:', error.message);
        throw error;
    }
}

async function actualizarReserva(id, reserva) {
    apiLogger.log('Actualizando reserva:', id);
    try {
        return await requestJson(`/reservas/${id}`, { method: 'PUT', body: reserva });
    } catch (error) {
        apiLogger.error('Error al actualizar reserva:', error.message);
        throw error;
    }
}

async function cancelarReserva(id) {
    apiLogger.log('Cancelando reserva:', id);
    try {
        return await requestJson(`/reservas/${id}/cancelar`, { method: 'PUT', body: {} });
    } catch (error) {
        apiLogger.error('Error al cancelar reserva:', error.message);
        throw error;
    }
}

// ============================================
// PAQUETES
// ============================================

async function obtenerPaquetes() {
    apiLogger.log('Obteniendo paquetes...');
    try {
        const data = await requestJson('/paquetes');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener paquetes:', error.message);
        return [];
    }
}

async function obtenerPaquetePorId(id) {
    apiLogger.log('Obteniendo paquete por ID:', id);
    try {
        return await requestJson(`/paquetes/${id}`);
    } catch (error) {
        apiLogger.error('Error al obtener paquete:', error.message);
        return null;
    }
}

async function crearPaquete(paquete) {
    apiLogger.log('Creando paquete:', paquete);
    try {
        return await requestJson('/paquetes', { method: 'POST', body: paquete });
    } catch (error) {
        apiLogger.error('Error al crear paquete:', error.message);
        throw error;
    }
}

async function actualizarPaquete(id, paquete) {
    apiLogger.log('Actualizando paquete:', id);
    try {
        return await requestJson(`/paquetes/${id}`, { method: 'PUT', body: paquete });
    } catch (error) {
        apiLogger.error('Error al actualizar paquete:', error.message);
        throw error;
    }
}

async function eliminarPaquete(id) {
    apiLogger.log('Eliminando paquete:', id);
    try {
        return await requestJson(`/paquetes/${id}`, { method: 'DELETE', allowNoContent: true });
    } catch (error) {
        apiLogger.error('Error al eliminar paquete:', error.message);
        throw error;
    }
}

// ============================================
// CLIENTES
// ============================================

async function obtenerClientes() {
    apiLogger.log('Obteniendo clientes...');
    try {
        const data = await requestJson('/clientes');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener clientes:', error.message);
        return [];
    }
}

async function obtenerEstadisticasDashboard() {
    try {
        return await requestJsonAuth('/dashboard/estadisticas');
    } catch (error) {
        apiLogger.error('Error al obtener estadísticas del dashboard:', error.message);
        return null;
    }
}

async function toggleEstadoServicio(id, estado) {
    apiLogger.log('Cambiando estado de servicio:', id, '->', estado);
    try {
        return await requestJson(`/servicios/${id}/estado`, { method: 'PATCH', body: { Estado: estado } });
    } catch (error) {
        apiLogger.error('Error al cambiar estado del servicio:', error.message);
        throw error;
    }
}

