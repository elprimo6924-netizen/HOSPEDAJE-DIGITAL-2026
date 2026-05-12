// ============================================
// FUNCIONES PARA MOSTRAR DATOS
// ============================================

let habitacionesAdminCargadas = [];
let serviciosCargados = [];
let lastShownApiError = null;
let habitacionesParaReserva = [];

const IMAGENES_POOL_PAQUETES = [
    'http://localhost:3000/img/03habitaciones.jpg',
    'http://localhost:3000/img/04habitacioint.jpg',
    'http://localhost:3000/img/06familiar.jpg',
    'http://localhost:3000/img/05icon2.jpg',
    'http://localhost:3000/img/05icon3.jpg',
    'http://localhost:3000/img/05icon4.jpg',
    'http://localhost:3000/img/05iconlist.jpg',
    'http://localhost:3000/img/02.jpeg',
];

const obtenerImagenPaquete = (paquete, indice = 0) => {
    if (paquete.ImagenURL && paquete.ImagenURL.trim()) return paquete.ImagenURL.trim();
    return IMAGENES_POOL_PAQUETES[indice % IMAGENES_POOL_PAQUETES.length];
};

const paginationState = {
    habitaciones: { page: 1, pageSize: 6 },
    servicios: { page: 1, pageSize: 6 },
    habitacionesAdmin: { page: 1, pageSize: 6 },
    serviciosAdmin: { page: 1, pageSize: 8 },
    reservasAdmin: { page: 1, pageSize: 10 },
    paquetesAdmin: { page: 1, pageSize: 10 }
};

const CLAVE_CONTRASTE_ALTO = 'hospedaje_alto_contraste';

const ensurePaginationState = (key) => {
    if (!paginationState[key]) {
        paginationState[key] = { page: 1, pageSize: 8 };
    }

    return paginationState[key];
};

const resetPagination = (key) => {
    ensurePaginationState(key).page = 1;
};

const getPaginatedItems = (items, key) => {
    const state = ensurePaginationState(key);
    const list = Array.isArray(items) ? items : [];
    const totalItems = list.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));

    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const startIndex = (state.page - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;

    return {
        items: list.slice(startIndex, endIndex),
        totalItems,
        totalPages,
        currentPage: state.page
    };
};

const renderPaginationControls = (key, anchorElement, totalItems, totalPages, currentPage, onPageChange, options = {}) => {
    if (!anchorElement) return;

    const { showSizeSelector = false, pageSizeOptions = [5, 10, 100] } = options;
    const containerId = `pagination-${key}`;
    let controls = document.getElementById(containerId);

    if (!controls) {
        controls = document.createElement('div');
        controls.id = containerId;
        controls.className = 'pagination-controls';
        anchorElement.insertAdjacentElement('afterend', controls);
    }

    if (totalItems === 0) {
        controls.innerHTML = '';
        controls.classList.add('hidden');
        return;
    }

    const state = ensurePaginationState(key);
    const selectorHtml = showSizeSelector ? `
        <label class="pagination-size-label">
            Mostrar
            <select class="pagination-size-select">
                ${pageSizeOptions.map(n => `<option value="${n}" ${state.pageSize === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
            por página
        </label>` : '';

    controls.classList.remove('hidden');
    controls.innerHTML = `
        ${selectorHtml}
        <div class="pagination-nav">
            <button type="button" class="pagination-btn" data-page="1" ${currentPage <= 1 ? 'disabled' : ''} title="Primera página">«</button>
            <button type="button" class="pagination-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>Anterior</button>
            <span class="pagination-info">Página <strong>${currentPage}</strong> de <strong>${totalPages}</strong> &nbsp;·&nbsp; ${totalItems} registros</span>
            <button type="button" class="pagination-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
            <button type="button" class="pagination-btn" data-page="${totalPages}" ${currentPage >= totalPages ? 'disabled' : ''} title="Última página">»</button>
        </div>
    `;

    controls.querySelectorAll('.pagination-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const nextPage = Number(button.dataset.page);
            state.page = Math.min(Math.max(1, nextPage), totalPages);
            onPageChange();
        });
    });

    if (showSizeSelector) {
        const select = controls.querySelector('.pagination-size-select');
        if (select) {
            select.addEventListener('change', () => {
                state.pageSize = Number(select.value);
                state.page = 1;
                onPageChange();
            });
        }
    }
};

const normalizarTexto = (valor) => String(valor ?? '').trim().toLowerCase();

const normalizarFecha = (valor) => {
    if (!valor) return '';

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
        return String(valor).slice(0, 10);
    }

    return fecha.toISOString().slice(0, 10);
};



const notificarErrorBackend = (contexto) => {
    const apiError = typeof getApiLastError === 'function' ? getApiLastError() : null;

    if (!apiError) return;
    if (apiError === lastShownApiError) return;

    lastShownApiError = apiError;

    if (typeof showWarning === 'function') {
        showWarning(`${contexto}. Verifica que el backend esté activo en http://localhost:3000`, 'Conexión backend');
    }
};

// Función para validar y obtener URL de imagen
function obtenerUrlImagen(valor) {
    // Imagen por defecto
    const imagenDefault = 'assets/images/default.svg';
    const baseLocal = 'assets/images/';
    
    // Si no hay valor, retornar imagen por defecto
    if (!valor) return imagenDefault;
    
    // Si es un objeto con tipo Buffer (MySQL Node.js driver)
    if (valor.type === 'Buffer' && valor.data) {
        // Convertir el array de bytes a string manualmente
        let str = '';
        for (let i = 0; i < valor.data.length; i++) {
            str += String.fromCharCode(valor.data[i]);
        }
        valor = str;
    }
    
    // Si ya es un string
    if (typeof valor === 'string') {
        // Normalizar separadores de Windows en rutas
        valor = valor.replace(/\\/g, '/');

        // Validar que sea una URL válida o ruta válida
        if (valor.trim() === '') return imagenDefault;

        // Aceptar data URL (base64) para imágenes subidas desde el formulario CRUD
        if (valor.startsWith('data:image/')) {
            return valor;
        }
        
        // Verificar si es una URL válida
        if (valor.startsWith('http://') || valor.startsWith('https://')) {
            try {
                new URL(valor);
                return valor;
            } catch (e) {
                console.warn('URL de imagen inválida:', valor);
                return imagenDefault;
            }
        }
        
        // Verificar si es una ruta relativa válida
        if (valor.startsWith('/') || valor.startsWith('./') || valor.startsWith('../')) {
            return valor;
        }
        
        // Verificar extensiones de imagen comunes
        const extensionesImagen = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        const tieneExtensionImagen = extensionesImagen.some(ext => 
            valor.toLowerCase().endsWith(ext)
        );
        
        if (tieneExtensionImagen) {
            // Si viene solo el nombre del archivo (ej: "cabana.svg"), resolver contra assets/images/
            const ruta = valor.trim();
            if (!ruta.includes('/')) {
                return `${baseLocal}${ruta}`;
            }

            return ruta;
        }
        
        // Si no cumple ningún criterio, usar imagen por defecto
        console.warn('Formato de imagen no reconocido:', valor);
        return imagenDefault;
    }
    
    // Si es cualquier otro tipo, intentar convertir a string
    try {
        const str = String(valor);
        if (str.trim() === '' || str === 'null' || str === 'undefined') {
            return imagenDefault;
        }
        return str;
    } catch (e) {
        return imagenDefault;
    }
}

// Función para precargar imagen y verificar que existe
function precargarImagen(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => resolve('assets/images/default.svg');
        img.src = url;
    });
}



function mostrarHabitaciones(habitaciones) {
    const contenedor = document.getElementById('habitaciones');
    if (!contenedor) return;
    
    console.log('Habitaciones recibidas:', habitaciones);
    contenedor.innerHTML = '';

    const lista = Array.isArray(habitaciones) ? habitaciones : [];
    const paginacion = getPaginatedItems(lista, 'habitaciones');
    const habitacionesVisibles = paginacion.items;

    if (lista.length === 0) {
        contenedor.innerHTML = '<p class="mensaje-vacio">No hay habitaciones disponibles</p>';
        renderPaginationControls('habitaciones', contenedor, 0, 0, 1, () => mostrarHabitaciones(lista));
        return;
    }

    habitacionesVisibles.forEach(habitacion => {
        const card = document.createElement('div');
        card.className = 'habitacion-card';
        const imagenUrl = obtenerImagenPrincipalHabitacion(habitacion);
        const estadoInfo = normalizarEstadoHabitacion(habitacion.Estado);
        card.innerHTML = `
            <div class="habitacion-imagen">
                <img src="${imagenUrl}" 
                     alt="${habitacion.NombreHabitacion}"
                     onerror="this.src='assets/images/default.svg'">
            </div>
            <div class="habitacion-info">
                <h3>${habitacion.NombreHabitacion}</h3>
                <p class="descripcion">${habitacion.Descripcion || 'Sin descripción'}</p>
                <p class="precio">$${habitacion.Costo} / noche</p>
                <span class="estado ${estadoInfo.clase}">${estadoInfo.texto}</span>
                <button onclick="verDetalles(${habitacion.IDHabitacion})" class="btn-ver">Ver Detalles</button>
            </div>
        `;
        contenedor.appendChild(card);
    });

    renderPaginationControls('habitaciones', contenedor, paginacion.totalItems, paginacion.totalPages, paginacion.currentPage, () => mostrarHabitaciones(lista));
}




function mostrarServicios(servicios) {
    const contenedor = document.getElementById('servicios');
    if (!contenedor) return;
    
    console.log('Servicios recibidos:', servicios);
    contenedor.innerHTML = '';

    const lista = Array.isArray(servicios) ? servicios : [];
    const paginacion = getPaginatedItems(lista, 'servicios');
    const serviciosVisibles = paginacion.items;

    if (lista.length === 0) {
        contenedor.innerHTML = '<p class="mensaje-vacio">No hay servicios disponibles</p>';
        renderPaginationControls('servicios', contenedor, 0, 0, 1, () => mostrarServicios(lista));
        return;
    }

    serviciosVisibles.forEach(servicio => {
        const card = document.createElement('div');
        card.className = 'servicio-card';
        card.innerHTML = `
            <h3>${servicio.NombreServicio}</h3>
            <p>${servicio.Descripcion || 'Sin descripción'}</p>
            <p class="precio">$${servicio.Costo}</p>
        `;
        contenedor.appendChild(card);
    });

    renderPaginationControls('servicios', contenedor, paginacion.totalItems, paginacion.totalPages, paginacion.currentPage, () => mostrarServicios(lista));
}

// ============================================
// FUNCIONES DE CARGA
// ============================================

async function cargarHabitaciones() {
    console.log('Cargando habitaciones...');
    try {
        const habitaciones = await obtenerHabitaciones();
        console.log('Habitaciones obtenidas:', habitaciones);
        resetPagination('habitaciones');
        mostrarHabitaciones(habitaciones);
        return habitaciones;
    } catch (error) {
        console.error('Error al cargar habitaciones:', error);
        notificarErrorBackend('No se pudieron cargar habitaciones');
        resetPagination('habitaciones');
        mostrarHabitaciones([]);
        return [];
    }
}



async function cargarServicios() {
    console.log('Cargando servicios...');
    const servicios = await obtenerServicios();
    console.log('Servicios obtenidos:', servicios);
    notificarErrorBackend('No se pudieron cargar servicios');
    resetPagination('servicios');
    mostrarServicios(servicios);
}

// ============================================
// CRUD DE HABITACIONES
// ============================================

const normalizarEstadoHabitacion = (estado) => {
    if (estado === 1 || estado === '1' || estado === true) {
        return { activo: true, texto: 'Disponible', clase: 'estado-disponible' };
    }

    if (typeof estado === 'string') {
        const valor = normalizarTexto(estado);
        if (['disponible', 'activo', 'activa', 'available', 'true', 'si', 'sí'].includes(valor)) {
            return { activo: true, texto: 'Disponible', clase: 'estado-disponible' };
        }
    }

    return { activo: false, texto: 'No disponible', clase: 'estado-no-disponible' };
};

const formatearCostoHabitacion = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return 'Sin costo';

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(numero);
};

const obtenerIdHabitacion = (habitacion) => habitacion?.IDHabitacion || habitacion?.id || habitacion?.IdHabitacion || '';

const escaparHtml = (valor) => String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
const obtenerIconoAccion = (tipo) => {
    const iconos = {
        ver: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5c5.5 0 9.9 4.1 11 7-1.1 2.9-5.5 7-11 7S2.1 14.9 1 12c1.1-2.9 5.5-7 11-7Zm0 2C7.9 7 4.4 9.7 3.2 12 4.4 14.3 7.9 17 12 17s7.6-2.7 8.8-5C19.6 9.7 16.1 7 12 7Zm0 1.5A3.5 3.5 0 1 1 12 16a3.5 3.5 0 0 1 0-7Zm0 2A1.5 1.5 0 1 0 12 13a1.5 1.5 0 0 0 0-3Z"/></svg>',
        editar: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 17.3V21h3.7L17.9 9.8l-3.7-3.7L3 17.3Zm18-10.6a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7 1.8-1.8Z"/></svg>',
        eliminar: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM6 7h12l-1 14H7L6 7Z"/></svg>'
    };

    return iconos[tipo] || '';
};

const obtenerBotonIcono = (accion, claseExtra, titulo, ariaLabel, atributoAccion, idRegistro) => `
    <button type="button" class="btn-mini btn-mini-icon ${claseExtra}" ${atributoAccion ? `data-${atributoAccion}="${accion}"` : ''} ${idRegistro ? `data-id="${escaparHtml(idRegistro)}"` : ''} title="${escaparHtml(titulo)}" aria-label="${escaparHtml(ariaLabel)}">
        ${obtenerIconoAccion(accion)}
    </button>
`;

const obtenerEstadoTextoHabitacion = (estado) => normalizarEstadoHabitacion(estado).texto;

const obtenerEstadoTextoServicio = (estado) => normalizarEstadoServicio(estado).texto;

const obtenerClaseEstadoServicio = (estado) => normalizarEstadoServicio(estado).clase;

const abrirDetalleAdmin = ({ titulo, contenido, tipo }) => {
    const modal = document.getElementById('modal-detalle-admin');
    const modalTitulo = document.getElementById('detalle-admin-titulo');
    const modalContenido = document.getElementById('detalle-admin-contenido');

    if (!modal || !modalTitulo || !modalContenido) return;

    cerrarModalesCRUD();
    modalTitulo.textContent = titulo;
    modalContenido.innerHTML = contenido;
    modal.dataset.detalleTipo = tipo || '';
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
};

const cerrarDetalleAdmin = () => {
    const modal = document.getElementById('modal-detalle-admin');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.dataset.detalleTipo = '';
    document.body.classList.remove('modal-open');
};

const renderDetalleItem = (etiqueta, valor) => `
    <div class="detalle-admin-item">
        <span>${escaparHtml(etiqueta)}</span>
        <strong>${valor || 'Sin dato'}</strong>
    </div>
`;

const renderDetalleCabecera = (tipo, titulo, estadoTexto, estadoClase, descripcion) => `
    <div class="detalle-admin-header">
        <div class="detalle-admin-header-copy">
            <span class="detalle-admin-kicker">${escaparHtml(tipo)}</span>
            <h4>${escaparHtml(titulo)}</h4>
            <p>${escaparHtml(descripcion)}</p>
        </div>
        <span class="detalle-estado ${escaparHtml(estadoClase)}">${escaparHtml(estadoTexto)}</span>
    </div>
`;

const obtenerImagenesDetalleHabitacion = (valor) => {
    if (!valor) return [];

    if (Array.isArray(valor)) {
        return valor.map((item) => String(item || '').trim()).filter(Boolean);
    }

    if (valor && valor.type === 'Buffer' && Array.isArray(valor.data)) {
        try {
            let textoBuffer = '';
            for (let i = 0; i < valor.data.length; i += 1) {
                textoBuffer += String.fromCharCode(valor.data[i]);
            }
            valor = textoBuffer;
        } catch (error) {
            console.warn('No se pudo convertir la imagen del detalle a string:', error);
            return [];
        }
    }

    const texto = String(valor).trim();
    if (!texto) return [];

    try {
        if (texto.startsWith('[') || texto.startsWith('{')) {
            const parsed = JSON.parse(texto);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item || '').trim()).filter(Boolean);
            }
        }
    } catch {
        // Si no es JSON válido, seguimos con la extracción por patrón.
    }

    const coincidencias = texto.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s"'<>]+|(?:\.\.\/|\.\/|\/)[^\s"'<>]+/g);
    if (coincidencias && coincidencias.length > 0) {
        return coincidencias.map((item) => item.trim()).filter(Boolean);
    }

    return [texto];
};

const obtenerImagenesHabitacionFormulario = () => {
    const campoImagen = document.getElementById('habitacion-admin-imagen');
    const imagenesTexto = obtenerImagenesDetalleHabitacion(campoImagen?.value || '');

    const imagenes = [];
    const vistos = new Set();

    imagenesTexto.forEach((imagen) => {
        const normalizada = String(imagen || '').trim();
        if (!normalizada) return;

        const clave = normalizada.toLowerCase();
        if (vistos.has(clave)) return;

        vistos.add(clave);
        imagenes.push(normalizada);
    });

    return imagenes;
};

const serializarImagenesHabitacion = (imagenes) => {
    const lista = Array.isArray(imagenes)
        ? imagenes.map((imagen) => String(imagen || '').trim()).filter(Boolean)
        : [];

    if (lista.length === 0) {
        return null;
    }

    if (lista.length === 1) {
        return lista[0];
    }

    return JSON.stringify(lista);
};

const obtenerImagenesHabitacionDetalle = (habitacion) => {
    const candidatos = [
        habitacion?.ImagenesHabitacion,
        habitacion?.GaleriaHabitacion,
        habitacion?.FotosHabitacion,
        habitacion?.Fotos,
        habitacion?.ImagenHabitacion
    ].filter((item) => item !== undefined && item !== null && item !== '');

    const imagenes = [];

    candidatos.forEach((valor) => {
        if (Array.isArray(valor)) {
            valor.forEach((item) => {
                const texto = String(item || '').trim();
                if (texto) imagenes.push(texto);
            });
            return;
        }

        if (typeof valor === 'string') {
            const texto = valor.trim();
            if (!texto) return;

            if (texto.startsWith('[')) {
                try {
                    const parsed = JSON.parse(texto);
                    if (Array.isArray(parsed)) {
                        parsed.forEach((item) => {
                            const itemTexto = String(item || '').trim();
                            if (itemTexto) imagenes.push(itemTexto);
                        });
                        return;
                    }
                } catch {
                    // Si no es JSON válido, continúa con el texto crudo.
                }
            }

            const separadas = obtenerImagenesDetalleHabitacion(texto);
            if (separadas.length > 0) {
                imagenes.push(...separadas);
            }
            return;
        }

        const separadas = obtenerImagenesDetalleHabitacion(valor);
        if (separadas.length > 0) {
            imagenes.push(...separadas);
        }
    });

    const unicas = [];
    const vistos = new Set();

    imagenes.forEach((imagen) => {
        const normalizada = String(imagen || '').trim();
        if (!normalizada) return;
        const clave = normalizada.toLowerCase();
        if (vistos.has(clave)) return;
        vistos.add(clave);
        unicas.push(normalizada);
    });

    return unicas;
};

const obtenerImagenPrincipalHabitacion = (habitacion) => {
    const imagenes = obtenerImagenesDetalleHabitacion(habitacion?.ImagenHabitacion);
    return obtenerUrlImagen(imagenes[0] || habitacion?.ImagenHabitacion);
};

const renderGaleriaHabitacionDetalle = (imagenes, nombre) => {
    const lista = Array.isArray(imagenes) ? imagenes.filter(Boolean) : [];

    if (lista.length === 0) {
        return `
            <figure class="detalle-admin-figure detalle-admin-figure-empty">
                <img src="assets/images/default.svg" alt="${escaparHtml(nombre || 'Habitación')}">
            </figure>
        `;
    }

    const principal = lista[0];
    const miniaturas = lista.slice(1);

    return `
        <div class="detalle-admin-gallery">
            <figure class="detalle-admin-figure detalle-admin-figure-main">
                <img src="${escaparHtml(principal)}" alt="${escaparHtml(nombre || 'Habitación')}" onerror="this.src='assets/images/default.svg'">
            </figure>
            ${miniaturas.length > 0 ? `
                <div class="detalle-admin-thumbs">
                    ${miniaturas.map((imagen, indice) => `
                        <figure class="detalle-admin-thumb">
                            <img src="${escaparHtml(imagen)}" alt="${escaparHtml(nombre || 'Habitación')} ${indice + 2}" onerror="this.src='assets/images/default.svg'">
                        </figure>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
};

const abrirDetalleHabitacionAdmin = (habitacion) => {
    if (!habitacion) return;

    const imagenes = obtenerImagenesHabitacionDetalle(habitacion).map((imagen) => obtenerUrlImagen(imagen));
    const estadoHabitacion = normalizarEstadoHabitacion(habitacion.Estado);
    const totalImagenes = imagenes.length;
    const contenido = `
        ${renderDetalleCabecera(
            'Habitación',
            habitacion.NombreHabitacion || 'Sin nombre',
            estadoHabitacion.texto,
            estadoHabitacion.clase,
            'Información completa del registro seleccionado.'
        )}
        <div class="detalle-admin-grid detalle-admin-grid-habitacion">
            ${renderGaleriaHabitacionDetalle(imagenes, habitacion.NombreHabitacion)}
            <div class="detalle-admin-body">
                ${renderDetalleItem('ID', escaparHtml(obtenerIdHabitacion(habitacion)))}
                ${renderDetalleItem('Nombre', escaparHtml(habitacion.NombreHabitacion || 'Sin nombre'))}
                ${renderDetalleItem('Descripción', escaparHtml(habitacion.Descripcion || 'Sin descripción'))}
                ${renderDetalleItem('Costo', escaparHtml(formatearCostoHabitacion(habitacion.Costo)))}
                ${renderDetalleItem('Estado', `<span class="detalle-estado ${estadoHabitacion.clase}">${escaparHtml(estadoHabitacion.texto)}</span>`)}
                ${renderDetalleItem('Imágenes', `<span class="detalle-admin-code">${escaparHtml(totalImagenes > 0 ? `${totalImagenes} imagen${totalImagenes === 1 ? '' : 'es'} cargada${totalImagenes === 1 ? '' : 's'}` : 'Sin imagen')}</span>`)}
            </div>
        </div>
    `;

    abrirDetalleAdmin({
        titulo: `Detalle de habitación #${obtenerIdHabitacion(habitacion)}`,
        contenido,
        tipo: 'habitacion'
    });
};

const abrirDetalleServicioAdmin = (servicio) => {
    if (!servicio) return;

    const estadoServicio = normalizarEstadoServicio(servicio.Estado);

    const contenido = `
        ${renderDetalleCabecera(
            'Servicio',
            servicio.NombreServicio || 'Sin nombre',
            estadoServicio.texto,
            estadoServicio.clase,
            'Información completa del servicio seleccionado.'
        )}
        <div class="detalle-admin-grid detalle-admin-grid-servicio">
            <div class="detalle-admin-body detalle-admin-body-full">
                ${renderDetalleItem('ID', escaparHtml(obtenerIdServicio(servicio)))}
                ${renderDetalleItem('Nombre', escaparHtml(servicio.NombreServicio || 'Sin nombre'))}
                ${renderDetalleItem('Descripción', escaparHtml(servicio.Descripcion || 'Sin descripción'))}
                ${renderDetalleItem('Duración', escaparHtml(servicio.Duracion ? `${servicio.Duracion} min` : 'Sin duración'))}
                ${renderDetalleItem('Personas', escaparHtml(servicio.CantidadMaximaPersonas || 'Sin dato'))}
                ${renderDetalleItem('Costo', escaparHtml(formatearCostoServicio(servicio.Costo)))}
                ${renderDetalleItem('Estado', `<span class="detalle-estado ${estadoServicio.clase}">${escaparHtml(estadoServicio.texto)}</span>`)}
            </div>
        </div>
    `;

    abrirDetalleAdmin({
        titulo: `Detalle de servicio #${obtenerIdServicio(servicio)}`,
        contenido,
        tipo: 'servicio'
    });
};

const obtenerImagenParaPayload = (habitacion) => {
    const valor = habitacion?.ImagenHabitacion;

    if (typeof valor === 'string') {
        return valor;
    }

    if (valor && valor.type === 'Buffer' && Array.isArray(valor.data)) {
        try {
            let str = '';
            for (let i = 0; i < valor.data.length; i += 1) {
                str += String.fromCharCode(valor.data[i]);
            }
            return str || null;
        } catch (error) {
            console.warn('No se pudo convertir ImagenHabitacion Buffer a string:', error);
            return null;
        }
    }

    return null;
};

const mostrarMensajeHabitacionAdmin = (texto, tipo = 'info') => {
    const mensajes = [
        document.getElementById('mensaje-habitacion-admin'),
        document.getElementById('mensaje-habitacion-admin-modal')
    ].filter(Boolean);

    if (!mensajes.length) return;

    mensajes.forEach((mensaje) => {
        mensaje.textContent = texto || '';
        mensaje.className = 'crud-habitaciones-mensaje';
        mensaje.style.color = '';
        mensaje.style.background = '';
        mensaje.style.border = '';
        mensaje.style.fontWeight = '';

        if (tipo === 'ok') {
            mensaje.classList.add('exito');
        } else if (tipo === 'error') {
            mensaje.classList.add('error');
        }

        if (tipo === 'ok' || tipo === 'exito') {
            mensaje.style.setProperty('color', '#14532d', 'important');
            mensaje.style.setProperty('background', 'rgba(20, 83, 45, 0.16)', 'important');
            mensaje.style.setProperty('border', '1px solid rgba(20, 83, 45, 0.45)', 'important');
            mensaje.style.setProperty('font-weight', '700', 'important');
            mensaje.classList.add('exito');
        }
    });
};

const esErrorDuplicadoBackend = (mensaje) => {
    const texto = normalizarTexto(mensaje);
    return /duplicate|duplicad|ya existe|unique|constraint|exists/.test(texto);
};

const obtenerMensajeErrorGuardado = (mensajeDuplicado, mensajeFallback) => {
    const apiError = typeof getApiLastError === 'function' ? getApiLastError() : '';

    if (apiError) {
        if (esErrorDuplicadoBackend(apiError)) {
            return mensajeDuplicado;
        }

        return apiError;
    }

    return mensajeFallback;
};

const cerrarModalesCRUD = () => {
    const modales = [
        document.getElementById('modal-habitacion-admin'),
        document.getElementById('modal-servicio-admin'),
        document.getElementById('modal-reserva-admin'),
        document.getElementById('modal-paquete-admin'),
        document.getElementById('modal-login')
    ].filter(Boolean);

    modales.forEach((modal) => {
        modal.classList.add('hidden');
    });

    document.body.classList.remove('modal-open');
};

const nombresCoinciden = (valorA, valorB) => normalizarTexto(valorA) === normalizarTexto(valorB);

const existeHabitacionConNombre = (nombre, idActual = '') => {
    return habitacionesAdminCargadas.some((habitacion) => {
        const mismoNombre = nombresCoinciden(habitacion.NombreHabitacion, nombre);
        const mismoRegistro = String(obtenerIdHabitacion(habitacion)) === String(idActual);
        return mismoNombre && !mismoRegistro;
    });
};

const existeServicioConNombre = (nombre, idActual = '') => {
    return serviciosCargados.some((servicio) => {
        const mismoNombre = nombresCoinciden(servicio.NombreServicio, nombre);
        const mismoRegistro = String(obtenerIdServicio(servicio)) === String(idActual);
        return mismoNombre && !mismoRegistro;
    });
};

const actualizarValidacionNombreHabitacionAdmin = () => {
    const campoId = document.getElementById('habitacion-admin-id');
    const campoNombre = document.getElementById('habitacion-admin-nombre');
    if (!campoNombre) return;

    const mensaje = document.getElementById('mensaje-habitacion-admin-modal');
    const idActual = campoId?.value?.trim() || '';
    const nombre = campoNombre.value?.trim() || '';
    const duplicado = nombre ? existeHabitacionConNombre(nombre, idActual) : false;

    campoNombre.setCustomValidity(duplicado ? 'Ya existe una habitación con ese nombre.' : '');
    campoNombre.classList.toggle('input-error', duplicado);

    if (duplicado) {
        if (mensaje) {
            mensaje.textContent = 'Ya existe una habitación con ese nombre. Usa otro nombre para poder guardarla.';
            mensaje.className = 'crud-habitaciones-mensaje error';
        }
        return;
    }

    if (mensaje && normalizarTexto(mensaje.textContent).includes('ya existe una habitación con ese nombre')) {
        mensaje.textContent = '';
        mensaje.className = 'crud-habitaciones-mensaje';
    }
};

const actualizarValidacionNombreServicioAdmin = () => {
    const campoId = document.getElementById('servicio-admin-id');
    const campoNombre = document.getElementById('servicio-admin-nombre');
    if (!campoNombre) return;

    const mensaje = document.getElementById('mensaje-servicio-admin-modal');
    const idActual = campoId?.value?.trim() || '';
    const nombre = campoNombre.value?.trim() || '';
    const duplicado = nombre ? existeServicioConNombre(nombre, idActual) : false;

    campoNombre.setCustomValidity(duplicado ? 'Ya existe un servicio con ese nombre.' : '');
    campoNombre.classList.toggle('input-error', duplicado);

    if (duplicado) {
        if (mensaje) {
            mensaje.textContent = 'Ya existe un servicio con ese nombre. Usa otro nombre para poder guardarlo.';
            mensaje.className = 'crud-servicios-mensaje error';
        }
        return;
    }

    if (mensaje && normalizarTexto(mensaje.textContent).includes('ya existe un servicio con ese nombre')) {
        mensaje.textContent = '';
        mensaje.className = 'crud-servicios-mensaje';
    }
};

const abrirModalHabitacionAdmin = () => {
    cerrarModalesCRUD();
    const modal = document.getElementById('modal-habitacion-admin');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
};

const cerrarModalHabitacionAdmin = () => {
    const modal = document.getElementById('modal-habitacion-admin');
    if (!modal) return;
    modal.classList.add('hidden');
    if (document.getElementById('modal-servicio-admin')?.classList.contains('hidden')) {
        document.body.classList.remove('modal-open');
    }
};

const mostrarPreviewHabitacionAdmin = (src) => {
    const wrap = document.getElementById('habitacion-admin-preview-wrap');
    const imagen = document.getElementById('habitacion-admin-preview');

    if (!wrap || !imagen) return;

    if (!src) {
        wrap.classList.add('hidden');
        imagen.removeAttribute('src');
        return;
    }

    imagen.src = src;
    wrap.classList.remove('hidden');
};

const aplicarModoContraste = (activo) => {
    const body = document.body;
    const boton = document.getElementById('toggle-contraste');

    if (!body) return;

    body.classList.toggle('high-contrast', activo);

    if (boton) {
        boton.classList.toggle('activo', activo);
        boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
        boton.textContent = `Alto contraste: ${activo ? 'ON' : 'OFF'}`;
    }
};

function configurarModoContraste() {
    const boton = document.getElementById('toggle-contraste');
    const preferenciaGuardada = localStorage.getItem(CLAVE_CONTRASTE_ALTO) === 'true';

    aplicarModoContraste(preferenciaGuardada);

    if (!boton || boton.dataset.contrasteInicializado) {
        return;
    }

    boton.addEventListener('click', () => {
        const estaActivo = document.body.classList.contains('high-contrast');
        const nuevoEstado = !estaActivo;

        aplicarModoContraste(nuevoEstado);
        localStorage.setItem(CLAVE_CONTRASTE_ALTO, nuevoEstado ? 'true' : 'false');
    });

    boton.dataset.contrasteInicializado = 'true';
}

const actualizarResumenHabitacionesAdmin = (habitaciones) => {
    const total = document.getElementById('habitaciones-admin-total');
    const disponibles = document.getElementById('habitaciones-admin-disponibles');
    const noDisponibles = document.getElementById('habitaciones-admin-no-disponibles');

    const lista = Array.isArray(habitaciones) ? habitaciones : [];
    const totalHabitaciones = lista.length;
    const habitacionesDisponibles = lista.filter((habitacion) => normalizarEstadoHabitacion(habitacion.Estado).activo).length;
    const habitacionesNoDisponibles = totalHabitaciones - habitacionesDisponibles;

    if (total) total.textContent = totalHabitaciones;
    if (disponibles) disponibles.textContent = habitacionesDisponibles;
    if (noDisponibles) noDisponibles.textContent = habitacionesNoDisponibles;
};

const obtenerFiltrosHabitacionesAdmin = () => {
    const busqueda = document.getElementById('busqueda-habitaciones-admin');
    const filtroEstado = document.getElementById('filtro-estado-habitaciones-admin');

    return {
        termino: normalizarTexto(busqueda?.value),
        estado: filtroEstado?.value || 'all'
    };
};

const habitacionesAdminCoinciden = (habitacion, filtros) => {
    const textoBusqueda = [
        habitacion.NombreHabitacion,
        habitacion.Descripcion,
        habitacion.Estado,
        habitacion.Costo,
        obtenerIdHabitacion(habitacion)
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const coincideTexto = !filtros.termino || textoBusqueda.includes(filtros.termino);
    const estadoNormalizado = normalizarEstadoHabitacion(habitacion.Estado);

    if (filtros.estado === 'available' && !estadoNormalizado.activo) return false;
    if (filtros.estado === 'unavailable' && estadoNormalizado.activo) return false;

    return coincideTexto;
};

const renderizarHabitacionesAdmin = () => {
    const contenedor = document.getElementById('habitaciones-admin-tbody');
    if (!contenedor) return;

    const filtros = obtenerFiltrosHabitacionesAdmin();
    const habitacionesFiltradas = habitacionesAdminCargadas.filter((habitacion) => habitacionesAdminCoinciden(habitacion, filtros));
    const paginacion = getPaginatedItems(habitacionesFiltradas, 'habitacionesAdmin');
    const habitacionesVisibles = paginacion.items;

    actualizarResumenHabitacionesAdmin(habitacionesAdminCargadas);

    if (habitacionesFiltradas.length === 0) {
        contenedor.innerHTML = `
            <tr>
                <td colspan="6" class="mensaje-vacio">No hay habitaciones que coincidan con el filtro actual.</td>
            </tr>
        `;
        const tablaWrapVacio = contenedor.closest('.crud-habitaciones-tabla-wrap') || contenedor;
        renderPaginationControls('habitacionesAdmin', tablaWrapVacio, 0, 0, 1, renderizarHabitacionesAdmin);
        return;
    }

    contenedor.innerHTML = habitacionesVisibles.map((habitacion) => {
        const idHabitacion = obtenerIdHabitacion(habitacion);
        const estado = normalizarEstadoHabitacion(habitacion.Estado);
        const imagenUrl = obtenerImagenPrincipalHabitacion(habitacion);
        const switchId = `switch-habitacion-${idHabitacion}`;

        return `
            <tr>
                <td>
                    <div class="crud-habitaciones-imagen">
                        <img src="${imagenUrl}" alt="${escaparHtml(habitacion.NombreHabitacion || 'Habitación')}" onerror="this.src='assets/images/default.svg'">
                    </div>
                </td>
                <td>
                    <div class="crud-habitaciones-nombre">${escaparHtml(habitacion.NombreHabitacion || 'Sin nombre')}</div>
                </td>
                <td><strong>${formatearCostoHabitacion(habitacion.Costo)}</strong></td>
                <td>
                    <div class="crud-estado-control">
                        <label class="switch-estado" for="${escaparHtml(switchId)}">
                            <input
                                id="${escaparHtml(switchId)}"
                                type="checkbox"
                                data-accion-habitacion-estado="toggle"
                                data-id="${escaparHtml(idHabitacion)}"
                                ${estado.activo ? 'checked' : ''}
                                aria-label="Cambiar estado de ${escaparHtml(habitacion.NombreHabitacion || 'habitación')}"
                            >
                            <span class="switch-slider"></span>
                        </label>
                    </div>
                </td>
                <td class="crud-habitaciones-descripcion">${escaparHtml(habitacion.Descripcion || 'Sin descripción')}</td>
                <td>
                    <div class="crud-habitaciones-acciones">
                        ${obtenerBotonIcono('ver', 'btn-mini-ver', 'Ver detalle', `Ver detalle de ${habitacion.NombreHabitacion || 'habitación'}`, 'accion-habitacion', idHabitacion)}
                        ${obtenerBotonIcono('editar', 'btn-mini-editar', 'Editar', `Editar ${habitacion.NombreHabitacion || 'habitación'}`, 'accion-habitacion', idHabitacion)}
                        ${obtenerBotonIcono('eliminar', 'btn-mini-eliminar', 'Eliminar', `Eliminar ${habitacion.NombreHabitacion || 'habitación'}`, 'accion-habitacion', idHabitacion)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const tablaWrap = contenedor.closest('.crud-habitaciones-tabla-wrap') || contenedor;
    renderPaginationControls('habitacionesAdmin', tablaWrap, paginacion.totalItems, paginacion.totalPages, paginacion.currentPage, renderizarHabitacionesAdmin);
};

async function cambiarEstadoHabitacionAdmin(id, nuevoEstado, inputToggle = null) {
    const habitacion = habitacionesAdminCargadas.find((item) => String(obtenerIdHabitacion(item)) === String(id));
    if (!habitacion) {
        if (inputToggle) {
            inputToggle.checked = !nuevoEstado;
            inputToggle.disabled = false;
        }
        mostrarMensajeHabitacionAdmin('No se encontró la habitación para cambiar estado.', 'error');
        return;
    }

    try {
        if (inputToggle) {
            inputToggle.disabled = true;
        }

        const payload = {
            NombreHabitacion: habitacion.NombreHabitacion,
            Descripcion: habitacion.Descripcion,
            Costo: Number(habitacion.Costo),
            Estado: nuevoEstado ? 1 : 0,
            ImagenHabitacion: obtenerImagenParaPayload(habitacion)
        };

        const resultado = await actualizarHabitacion(id, payload);
        if (!resultado) {
            throw new Error('No se pudo actualizar el estado de la habitación');
        }

        habitacion.Estado = nuevoEstado ? 1 : 0;
        renderizarHabitacionesAdmin();
        const msgEstadoHab = `${habitacion.NombreHabitacion} ${nuevoEstado ? 'habilitada' : 'inhabilitada'}.`;
        mostrarMensajeHabitacionAdmin(`Estado actualizado: ${msgEstadoHab}`, 'ok');
        if (typeof showSuccess === 'function') showSuccess(msgEstadoHab, 'Estado actualizado');

        if (typeof cargarHabitaciones === 'function') {
            await cargarHabitaciones();
        }
    } catch (error) {
        console.error('Error al cambiar estado de habitación:', error);
        if (inputToggle) {
            inputToggle.checked = !nuevoEstado;
        }
        mostrarMensajeHabitacionAdmin(error.message || 'No se pudo actualizar el estado', 'error');
    } finally {
        if (inputToggle) {
            inputToggle.disabled = false;
        }
    }
}

const limpiarFormularioHabitacionAdmin = (mostrarMensaje = true) => {
    const formulario = document.getElementById('form-habitacion-admin');
    const campoId = document.getElementById('habitacion-admin-id');
    const campoNombre = document.getElementById('habitacion-admin-nombre');
    const campoDescripcion = document.getElementById('habitacion-admin-descripcion');
    const campoCosto = document.getElementById('habitacion-admin-costo');
    const campoEstado = document.getElementById('habitacion-admin-estado');
    const campoImagen = document.getElementById('habitacion-admin-imagen');
    const titulo = document.getElementById('habitacion-admin-form-title');
    const botonGuardar = document.getElementById('btn-habitacion-admin-guardar');

    if (formulario) formulario.reset();
    if (campoId) campoId.value = '';
    if (campoNombre) campoNombre.value = '';
    if (campoDescripcion) campoDescripcion.value = '';
    if (campoCosto) campoCosto.value = '';
    if (campoEstado) campoEstado.value = '1';
    if (campoImagen) campoImagen.value = '';
    if (titulo) titulo.textContent = 'Crear habitación';
    if (botonGuardar) botonGuardar.textContent = 'Guardar habitación';
    mostrarPreviewHabitacionAdmin('');

    if (mostrarMensaje) {
        mostrarMensajeHabitacionAdmin('Formulario listo para crear una nueva habitación.');
    }
};

const cargarHabitacionEnFormularioAdmin = (habitacion) => {
    const campoId = document.getElementById('habitacion-admin-id');
    const campoNombre = document.getElementById('habitacion-admin-nombre');
    const campoDescripcion = document.getElementById('habitacion-admin-descripcion');
    const campoCosto = document.getElementById('habitacion-admin-costo');
    const campoEstado = document.getElementById('habitacion-admin-estado');
    const campoImagen = document.getElementById('habitacion-admin-imagen');
    const titulo = document.getElementById('habitacion-admin-form-title');
    const botonGuardar = document.getElementById('btn-habitacion-admin-guardar');

    if (!habitacion) return;

    if (campoId) campoId.value = obtenerIdHabitacion(habitacion);
    if (campoNombre) campoNombre.value = habitacion.NombreHabitacion || '';
    if (campoDescripcion) campoDescripcion.value = habitacion.Descripcion || '';
    if (campoCosto) campoCosto.value = habitacion.Costo ?? '';
    if (campoEstado) campoEstado.value = normalizarEstadoHabitacion(habitacion.Estado).activo ? '1' : '0';
    if (campoImagen) {
        const imagenesExistentes = obtenerImagenesDetalleHabitacion(habitacion.ImagenHabitacion);
        campoImagen.value = imagenesExistentes.join('\n');
    }
    mostrarPreviewHabitacionAdmin(campoImagen?.value ? obtenerUrlImagen(obtenerImagenesDetalleHabitacion(campoImagen.value)[0] || campoImagen.value) : '');
    if (titulo) titulo.textContent = `Editar habitación #${obtenerIdHabitacion(habitacion)}`;
    if (botonGuardar) botonGuardar.textContent = 'Actualizar habitación';

    mostrarMensajeHabitacionAdmin(`Editando ${habitacion.NombreHabitacion || 'la habitación seleccionada'}.`, 'ok');
    abrirModalHabitacionAdmin();
    actualizarValidacionNombreHabitacionAdmin();
};

async function cargarHabitacionesAdmin() {
    const contenedor = document.getElementById('habitaciones-admin-tbody');
    if (!contenedor) return;

    try {
        mostrarMensajeHabitacionAdmin('Cargando habitaciones...');
        habitacionesAdminCargadas = await obtenerHabitaciones();
        resetPagination('habitacionesAdmin');
        renderizarHabitacionesAdmin();
        mostrarMensajeHabitacionAdmin(`Se cargaron ${habitacionesAdminCargadas.length} habitaciones.`, 'ok');
    } catch (error) {
        console.error('Error al cargar habitaciones para el CRUD:', error);
        habitacionesAdminCargadas = [];
        contenedor.innerHTML = `
            <tr>
                <td colspan="6" class="mensaje-vacio">Error al cargar habitaciones</td>
            </tr>
        `;
        mostrarMensajeHabitacionAdmin('No se pudieron cargar las habitaciones.', 'error');
    }
}

const limpiarEstadoErrorCampos = (idsCampos = []) => {
    idsCampos.forEach((idCampo) => {
        const campo = document.getElementById(idCampo);
        if (campo) {
            campo.classList.remove('input-error');
        }
    });
};

const validarCamposObligatorios = (definicionesCampos = []) => {
    for (const definicion of definicionesCampos) {
        const { id, nombre } = definicion;
        const campo = document.getElementById(id);
        const valor = campo?.value;
        const valorNormalizado = typeof valor === 'string' ? valor.trim() : valor;

        if (valorNormalizado === '' || valorNormalizado === null || valorNormalizado === undefined) {
            if (campo) {
                campo.classList.add('input-error');
                if (typeof campo.focus === 'function') {
                    campo.focus();
                }
            }
            return `El campo ${nombre} es obligatorio.`;
        }
    }

    return '';
};

async function guardarHabitacionAdmin(event) {
    event.preventDefault();

    const formulario = document.getElementById('form-habitacion-admin');
    const campoId = document.getElementById('habitacion-admin-id');
    const campoNombre = document.getElementById('habitacion-admin-nombre');
    const campoDescripcion = document.getElementById('habitacion-admin-descripcion');
    const campoCosto = document.getElementById('habitacion-admin-costo');
    const campoEstado = document.getElementById('habitacion-admin-estado');
    const botonGuardar = document.getElementById('btn-habitacion-admin-guardar');

    const idHabitacion = campoId?.value?.trim();
    const nombreHabitacion = campoNombre?.value?.trim();
    const descripcion = campoDescripcion?.value?.trim();
    const costo = campoCosto?.value;
    const estado = campoEstado?.value ?? '1';
    const imagenesHabitacion = obtenerImagenesHabitacionFormulario();
    const imagenFinal = serializarImagenesHabitacion(imagenesHabitacion);

    limpiarEstadoErrorCampos([
        'habitacion-admin-nombre',
        'habitacion-admin-descripcion',
        'habitacion-admin-costo',
        'habitacion-admin-estado'
    ]);

    if (formulario && !formulario.checkValidity()) {
        formulario.reportValidity();
        mostrarMensajeHabitacionAdmin('Completa todos los campos obligatorios del formulario.', 'error');
        return;
    }

    const mensajeCamposObligatorios = validarCamposObligatorios([
        { id: 'habitacion-admin-nombre', nombre: 'Nombre de la habitación' },
        { id: 'habitacion-admin-descripcion', nombre: 'Descripción' },
        { id: 'habitacion-admin-costo', nombre: 'Costo' },
        { id: 'habitacion-admin-estado', nombre: 'Estado' }
    ]);

    if (mensajeCamposObligatorios) {
        mostrarMensajeHabitacionAdmin(mensajeCamposObligatorios, 'error');
        return;
    }

    if (!nombreHabitacion || !descripcion || !costo) {
        mostrarMensajeHabitacionAdmin('Nombre, descripción y costo son obligatorios.', 'error');
        return;
    }

    if (existeHabitacionConNombre(nombreHabitacion, idHabitacion)) {
        mostrarMensajeHabitacionAdmin('Ya existe una habitación con ese nombre. Usa otro nombre para poder guardarla.', 'error');
        return;
    }

    try {
        if (botonGuardar) botonGuardar.disabled = true;
        mostrarMensajeHabitacionAdmin(idHabitacion ? 'Actualizando habitación...' : 'Creando habitación...');

        const payload = {
            NombreHabitacion: nombreHabitacion,
            Descripcion: descripcion,
            Costo: Number(costo),
            Estado: Number(estado),
            ImagenHabitacion: imagenFinal
        };

        const resultado = idHabitacion
            ? await actualizarHabitacion(idHabitacion, payload)
            : await crearHabitacion(payload);

        if (!resultado) {
            throw new Error(obtenerMensajeErrorGuardado('Ya existe una habitación con ese nombre. Usa otro nombre para poder guardarla.', 'No se pudo guardar la habitación'));
        }

        limpiarFormularioHabitacionAdmin(false);
        await cargarHabitacionesAdmin();
        const msgHab = idHabitacion ? 'Habitación actualizada correctamente.' : 'Habitación creada correctamente.';
        mostrarMensajeHabitacionAdmin(msgHab, 'ok');
        if (typeof showSuccess === 'function') showSuccess(msgHab, idHabitacion ? 'Habitación editada' : 'Habitación creada');
        cerrarModalHabitacionAdmin();

        if (typeof cargarHabitaciones === 'function') {
            await cargarHabitaciones();
        }
    } catch (error) {
        console.error('Error al guardar habitación:', error);
        mostrarMensajeHabitacionAdmin(error.message || 'Error al guardar la habitación', 'error');
        if (typeof showError === 'function') showError(error.message || 'No se pudo guardar la habitación', 'Error');
    } finally {
        if (botonGuardar) botonGuardar.disabled = false;
    }
}

async function eliminarHabitacionAdmin(id) {
    const habitacion = habitacionesAdminCargadas.find((item) => String(obtenerIdHabitacion(item)) === String(id));
    const nombre = habitacion?.NombreHabitacion || `ID ${id}`;

    if (!await confirmarAccion(`¿Seguro que deseas eliminar la habitación "${nombre}"?`, 'Eliminar habitación')) return;

    try {
        mostrarMensajeHabitacionAdmin(`Eliminando ${nombre}...`);
        const resultado = await eliminarHabitacion(id);

        if (!resultado) {
            throw new Error('No se pudo eliminar la habitación');
        }

        await cargarHabitacionesAdmin();
        mostrarMensajeHabitacionAdmin('Habitación eliminada correctamente.', 'ok');
        if (typeof showSuccess === 'function') showSuccess(`"${nombre}" eliminada correctamente.`, 'Habitación eliminada');

        if (typeof cargarHabitaciones === 'function') {
            await cargarHabitaciones();
        }
    } catch (error) {
        console.error('Error al eliminar habitación:', error);
        mostrarMensajeHabitacionAdmin(error.message || 'Error al eliminar la habitación', 'error');
        if (typeof showError === 'function') showError(error.message || 'No se pudo eliminar la habitación', 'Error');
    }
}

function configurarCRUDHabitaciones() {
    const formulario = document.getElementById('form-habitacion-admin');
    const botonLimpiar = document.getElementById('btn-habitacion-admin-limpiar');
    const botonRecargar = document.getElementById('btn-habitaciones-admin-recargar');
    const botonNueva = document.getElementById('btn-nueva-habitacion-admin');
    const botonCerrarModal = document.getElementById('btn-cerrar-modal-habitacion');
    const modalHabitacion = document.getElementById('modal-habitacion-admin');
    const buscador = document.getElementById('busqueda-habitaciones-admin');
    const filtroEstado = document.getElementById('filtro-estado-habitaciones-admin');
    const campoNombre = document.getElementById('habitacion-admin-nombre');
    const inputImagenTexto = document.getElementById('habitacion-admin-imagen');
    const tabla = document.getElementById('habitaciones-admin-tbody');

    if (formulario && !formulario.dataset.crudHabitacionesInicializado) {
        formulario.addEventListener('submit', guardarHabitacionAdmin);
        formulario.dataset.crudHabitacionesInicializado = 'true';
    }

    if (botonLimpiar && !botonLimpiar.dataset.crudHabitacionesInicializado) {
        botonLimpiar.addEventListener('click', limpiarFormularioHabitacionAdmin);
        botonLimpiar.dataset.crudHabitacionesInicializado = 'true';
    }

    if (botonRecargar && !botonRecargar.dataset.crudHabitacionesInicializado) {
        botonRecargar.addEventListener('click', cargarHabitacionesAdmin);
        botonRecargar.dataset.crudHabitacionesInicializado = 'true';
    }

    if (botonNueva && !botonNueva.dataset.crudHabitacionesInicializado) {
        botonNueva.addEventListener('click', () => {
            limpiarFormularioHabitacionAdmin(false);
            abrirModalHabitacionAdmin();
        });
        botonNueva.dataset.crudHabitacionesInicializado = 'true';
    }

    if (botonCerrarModal && !botonCerrarModal.dataset.crudHabitacionesInicializado) {
        botonCerrarModal.addEventListener('click', cerrarModalHabitacionAdmin);
        botonCerrarModal.dataset.crudHabitacionesInicializado = 'true';
    }

    if (campoNombre && !campoNombre.dataset.crudHabitacionesInicializado) {
        campoNombre.addEventListener('input', actualizarValidacionNombreHabitacionAdmin);
        campoNombre.addEventListener('blur', actualizarValidacionNombreHabitacionAdmin);
        campoNombre.dataset.crudHabitacionesInicializado = 'true';
    }

    if (modalHabitacion && !modalHabitacion.dataset.crudHabitacionesInicializado) {
        modalHabitacion.addEventListener('click', (event) => {
            if (event.target === modalHabitacion) {
                cerrarModalHabitacionAdmin();
            }
        });
        modalHabitacion.dataset.crudHabitacionesInicializado = 'true';
    }

    if (buscador && !buscador.dataset.crudHabitacionesInicializado) {
        buscador.addEventListener('input', () => {
            resetPagination('habitacionesAdmin');
            renderizarHabitacionesAdmin();
        });
        buscador.dataset.crudHabitacionesInicializado = 'true';
    }

    if (filtroEstado && !filtroEstado.dataset.crudHabitacionesInicializado) {
        filtroEstado.addEventListener('change', () => {
            resetPagination('habitacionesAdmin');
            renderizarHabitacionesAdmin();
        });
        filtroEstado.dataset.crudHabitacionesInicializado = 'true';
    }

    if (inputImagenTexto && !inputImagenTexto.dataset.crudHabitacionesInicializado) {
        inputImagenTexto.addEventListener('input', () => {
            const valor = inputImagenTexto.value.trim();
            const vistaPrevia = valor ? obtenerUrlImagen(obtenerImagenesDetalleHabitacion(valor)[0] || valor) : '';

            mostrarPreviewHabitacionAdmin(vistaPrevia);
        });
        inputImagenTexto.dataset.crudHabitacionesInicializado = 'true';
    }


    if (tabla && !tabla.dataset.crudHabitacionesInicializado) {
        tabla.addEventListener('click', (event) => {
            const boton = event.target.closest('button[data-accion-habitacion]');
            if (!boton) return;

            const accion = boton.dataset.accionHabitacion;
            const id = boton.dataset.id;

            if (accion === 'editar') {
                const habitacion = habitacionesAdminCargadas.find((item) => String(obtenerIdHabitacion(item)) === String(id));
                if (habitacion) {
                    cargarHabitacionEnFormularioAdmin(habitacion);
                }
                return;
            }

            if (accion === 'ver') {
                const habitacion = habitacionesAdminCargadas.find((item) => String(obtenerIdHabitacion(item)) === String(id));
                if (habitacion) {
                    abrirDetalleHabitacionAdmin(habitacion);
                }
                return;
            }

            if (accion === 'eliminar') {
                eliminarHabitacionAdmin(id);
            }
        });

        tabla.addEventListener('change', (event) => {
            const switchEstado = event.target.closest('input[data-accion-habitacion-estado="toggle"]');
            if (!switchEstado) return;

            const id = switchEstado.dataset.id;
            const nuevoEstado = switchEstado.checked;
            cambiarEstadoHabitacionAdmin(id, nuevoEstado, switchEstado);
        });

        tabla.dataset.crudHabitacionesInicializado = 'true';
    }

    const detalleModal = document.getElementById('modal-detalle-admin');
    const cerrarDetalle = document.getElementById('btn-cerrar-modal-detalle');

    if (detalleModal && !detalleModal.dataset.detalleInicializado) {
        detalleModal.addEventListener('click', (event) => {
            if (event.target === detalleModal) {
                cerrarDetalleAdmin();
            }
        });
        detalleModal.dataset.detalleInicializado = 'true';
    }

    if (cerrarDetalle && !cerrarDetalle.dataset.detalleInicializado) {
        cerrarDetalle.addEventListener('click', cerrarDetalleAdmin);
        cerrarDetalle.dataset.detalleInicializado = 'true';
    }
}

// ============================================
// FUNCIONES DE INTERACCIÓN
// ============================================

function verDetalles(id) {
    console.log('Ver detalles de habitación:', id);
    // Aquí puedes redirigir a una página de detalles
    // window.location.href = `pages/detalle.html?id=${id}`;
    alert(`Ver detalles de habitación ID: ${id}`);
}

// ============================================
// DASHBOARD
// ============================================

let _dashChartEstados = null;
let _dashChartMeses = null;

function renderizarGraficasDashboard(reservas) {
    const lista = Array.isArray(reservas) ? reservas : [];

    // --- Donut: por estado ---
    const conteos = [0, 0, 0];
    lista.forEach(r => {
        const e = Number(r.IdEstadoReserva);
        if (e === 1) conteos[0]++;
        else if (e === 2) conteos[1]++;
        else if (e === 3) conteos[2]++;
    });

    const ctxE = document.getElementById('dash-chart-estados');
    if (ctxE) {
        if (_dashChartEstados) _dashChartEstados.destroy();
        _dashChartEstados = new Chart(ctxE, {
            type: 'doughnut',
            data: {
                labels: ['Activo', 'Pendiente', 'Cancelado'],
                datasets: [{ data: conteos, backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }

    // --- Barras: últimos 6 meses ---
    const ahora = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - i), 1);
        return {
            label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }),
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            total: 0
        };
    });

    lista.forEach(r => {
        const f = new Date(r.FechaInicio);
        const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
        const m = meses.find(x => x.key === key);
        if (m) m.total++;
    });

    const ctxM = document.getElementById('dash-chart-meses');
    if (ctxM) {
        if (_dashChartMeses) _dashChartMeses.destroy();
        _dashChartMeses = new Chart(ctxM, {
            type: 'bar',
            data: {
                labels: meses.map(m => m.label),
                datasets: [{
                    label: 'Reservas',
                    data: meses.map(m => m.total),
                    backgroundColor: '#2d6a4f',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }
}

async function cargarDashboard() {
    const fechaEl = document.getElementById('dashboard-fecha');
    if (fechaEl) {
        const now = new Date();
        fechaEl.textContent = now.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    try {
        const [stats, habs, servs, reservas] = await Promise.all([
            obtenerEstadisticasDashboard(),
            obtenerHabitaciones(),
            obtenerServicios(),
            obtenerReservas()
        ]);

        const totalReservasEl = document.getElementById('dash-total-reservas');
        if (totalReservasEl) totalReservasEl.textContent = stats?.totalReservas ?? '0';

        const ingresosEl = document.getElementById('dash-ingresos');
        if (ingresosEl) {
            const monto = Number(stats?.ingresosTotales || 0);
            ingresosEl.textContent = `$${monto.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }

        const habEl = document.getElementById('dash-habitaciones');
        if (habEl) habEl.textContent = habs.length;

        const servEl = document.getElementById('dash-servicios');
        if (servEl) servEl.textContent = servs.filter(s => Number(s.Estado) === 1).length;

        const habTop = document.getElementById('dash-habitaciones-top');
        if (habTop) {
            const items = stats?.habitacionesMasReservadas;
            if (items && items.length > 0) {
                habTop.innerHTML = items.map((h, i) => `
                    <li>
                        <span class="ranking-pos">#${i + 1}</span>
                        <span class="ranking-name">${escaparHtml(h.NombreHabitacion || '—')}</span>
                        <span class="ranking-count">${h.total}</span>
                    </li>`).join('');
            } else {
                habTop.innerHTML = '<li class="ranking-empty">Sin reservas registradas aún</li>';
            }
        }

        const servTop = document.getElementById('dash-servicios-top');
        if (servTop) {
            const items = stats?.serviciosMasVendidos;
            if (items && items.length > 0) {
                servTop.innerHTML = items.map((s, i) => `
                    <li>
                        <span class="ranking-pos">#${i + 1}</span>
                        <span class="ranking-name">${escaparHtml(s.NombreServicio || '—')}</span>
                        <span class="ranking-count">${s.total}</span>
                    </li>`).join('');
            } else {
                servTop.innerHTML = '<li class="ranking-empty">Sin servicios vendidos aún</li>';
            }
        }

        renderizarGraficasDashboard(reservas);
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// ============================================
// FUNCIONES DE NAVEGACIÓN ENTRE SECCIONES
// ============================================

function cargarSeccion(seccion, event) {
    if (event) {
        event.preventDefault();
    }

    // Ocultar todas las secciones
    document.querySelectorAll('[id^="seccion-"]').forEach((section) => {
        section.classList.add('hidden');
    });

    // Mostrar la sección seleccionada
    const idSeccion = `seccion-${seccion}`;
    const elementoSeccion = document.getElementById(idSeccion);
    
    if (elementoSeccion) {
        elementoSeccion.classList.remove('hidden');
        
        // Cargar datos según la sección (inicialización perezosa de cada módulo)
        if (seccion === 'administrar-habitaciones') {
            configurarCRUDHabitaciones();
            cargarHabitacionesAdmin();
        } else if (seccion === 'administrar-servicios') {
            if (document.getElementById('form-servicio-admin')) inicializarFormularioServiciosAdmin();
            cargarServiciosAdmin();
        } else if (seccion === 'administrar-reservas') {
            configurarCRUDReservas();
            cargarReservasAdmin();
        } else if (seccion === 'administrar-paquetes') {
            configurarCRUDPaquetes();
            cargarPaquetesAdmin();
        } else if (seccion === 'dashboard') {
            cargarDashboard();
        }
        
        // Cerrar sidebar en móviles
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }
    }
}

// ============================================
// FUNCIONES CRUD SERVICIOS
// ============================================

const normalizarEstadoServicio = (estado) => {
    const activo = Number(estado) === 1;
    return {
        activo,
        clase: activo ? 'activo' : 'inactivo',
        texto: activo ? 'Activo' : 'Inactivo'
    };
};

const obtenerIdServicio = (servicio) => servicio.IDServicio;

const formatearCostoServicio = (costo) => {
    const numero = Number(costo);
    return Number.isNaN(numero) ? '$0' : `$${numero.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const mostrarMensajeServicioAdmin = (mensaje, tipo = 'info') => {
    const elementos = [
        document.getElementById('mensaje-servicio-admin'),
        document.getElementById('mensaje-servicio-admin-modal')
    ].filter(Boolean);

    if (!elementos.length) return;

    elementos.forEach((elemento) => {
        elemento.textContent = mensaje;
        elemento.className = 'crud-servicios-mensaje';
        elemento.style.color = '';
        elemento.style.background = '';
        elemento.style.border = '';
        elemento.style.fontWeight = '';

        if (tipo !== 'info') {
            elemento.classList.add(tipo);
        }

        if (tipo === 'ok' || tipo === 'exito') {
            elemento.style.setProperty('color', '#14532d', 'important');
            elemento.style.setProperty('background', 'rgba(20, 83, 45, 0.16)', 'important');
            elemento.style.setProperty('border', '1px solid rgba(20, 83, 45, 0.45)', 'important');
            elemento.style.setProperty('font-weight', '700', 'important');
            elemento.classList.add('exito');
        }
    });
};

const abrirModalServicioAdmin = () => {
    cerrarModalesCRUD();
    const modal = document.getElementById('modal-servicio-admin');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
};

const cerrarModalServicioAdmin = () => {
    const modal = document.getElementById('modal-servicio-admin');
    if (!modal) return;
    modal.classList.add('hidden');
    if (document.getElementById('modal-habitacion-admin')?.classList.contains('hidden')) {
        document.body.classList.remove('modal-open');
    }
};

async function cargarServiciosAdmin() {
    try {
        serviciosCargados = await obtenerServicios();
        resetPagination('serviciosAdmin');
        renderizarServiciosAdmin();
    } catch (error) {
        console.error('Error cargando servicios:', error);
        serviciosCargados = [];
        mostrarMensajeServicioAdmin('Error al cargar servicios del servidor', 'error');
    }
}

const obtenerFiltrosServiciosAdmin = () => {
    const busqueda = document.getElementById('busqueda-servicios-admin');
    const filtroEstado = document.getElementById('filtro-estado-servicios-admin');

    return {
        termino: normalizarTexto(busqueda?.value),
        estado: filtroEstado?.value || 'all'
    };
};

const serviciosAdminCoinciden = (servicio, filtros) => {
    const textoBusqueda = [
        servicio.NombreServicio,
        servicio.Descripcion,
        servicio.Estado,
        servicio.Costo,
        obtenerIdServicio(servicio)
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const coincideTexto = !filtros.termino || textoBusqueda.includes(filtros.termino);
    const estadoNormalizado = normalizarEstadoServicio(servicio.Estado);

    if (filtros.estado === 'active' && !estadoNormalizado.activo) return false;
    if (filtros.estado === 'inactive' && estadoNormalizado.activo) return false;

    return coincideTexto;
};

const actualizarResumenServiciosAdmin = (servicios) => {
    const total = document.getElementById('servicios-admin-total');
    const activos = document.getElementById('servicios-admin-activos');
    const inactivos = document.getElementById('servicios-admin-inactivos');

    const lista = Array.isArray(servicios) ? servicios : [];
    const totalServicios = lista.length;
    const serviciosActivos = lista.filter((servicio) => normalizarEstadoServicio(servicio.Estado).activo).length;
    const serviciosInactivos = totalServicios - serviciosActivos;

    if (total) total.textContent = totalServicios;
    if (activos) activos.textContent = serviciosActivos;
    if (inactivos) inactivos.textContent = serviciosInactivos;
};

const renderizarServiciosAdmin = () => {
    const contenedor = document.getElementById('servicios-admin-tbody');
    if (!contenedor) return;

    const filtros = obtenerFiltrosServiciosAdmin();
    const serviciosFiltrados = serviciosCargados.filter((servicio) => serviciosAdminCoinciden(servicio, filtros));
    const paginacion = getPaginatedItems(serviciosFiltrados, 'serviciosAdmin');
    const serviciosVisibles = paginacion.items;

    actualizarResumenServiciosAdmin(serviciosCargados);

    if (serviciosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <tr>
                <td colspan="7" class="mensaje-vacio">No hay servicios que coincidan con el filtro actual.</td>
            </tr>
        `;
        const tablaWrapVacio = contenedor.closest('.crud-servicios-tabla-wrap') || contenedor;
        renderPaginationControls('serviciosAdmin', tablaWrapVacio, 0, 0, 1, renderizarServiciosAdmin);
        return;
    }

    contenedor.innerHTML = serviciosVisibles.map((servicio) => {
        const idServicio = obtenerIdServicio(servicio);
        const estado = normalizarEstadoServicio(servicio.Estado);
        const switchId = `switch-servicio-${idServicio}`;

        return `
            <tr>
                <td>
                    <div class="crud-servicios-nombre">${escaparHtml(servicio.NombreServicio || 'Sin nombre')}</div>
                </td>
                <td><strong>${servicio.Duracion || '—'}</strong></td>
                <td>${servicio.CantidadMaximaPersonas || '—'}</td>
                <td><strong>${formatearCostoServicio(servicio.Costo)}</strong></td>
                <td>
                    <div class="crud-estado-control">
                        <label class="switch-estado-servicio" for="${escaparHtml(switchId)}">
                            <input
                                id="${escaparHtml(switchId)}"
                                type="checkbox"
                                data-accion-servicio-estado="toggle"
                                data-id="${escaparHtml(idServicio)}"
                                ${estado.activo ? 'checked' : ''}
                                aria-label="Cambiar estado de ${escaparHtml(servicio.NombreServicio || 'servicio')}"
                            >
                            <span class="switch-slider-servicio"></span>
                        </label>
                    </div>
                </td>
                <td class="crud-servicios-descripcion">${escaparHtml(servicio.Descripcion || 'Sin descripción')}</td>
                <td>
                    <div class="crud-servicios-acciones">
                        ${obtenerBotonIcono('ver', 'btn-mini-ver', 'Ver detalle', `Ver detalle de ${servicio.NombreServicio || 'servicio'}`, 'accion-servicio', idServicio)}
                        ${obtenerBotonIcono('editar', 'btn-mini-editar', 'Editar', `Editar ${servicio.NombreServicio || 'servicio'}`, 'accion-servicio', idServicio)}
                        ${obtenerBotonIcono('eliminar', 'btn-mini-eliminar', 'Eliminar', `Eliminar ${servicio.NombreServicio || 'servicio'}`, 'accion-servicio', idServicio)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const tablaWrap = contenedor.closest('.crud-servicios-tabla-wrap') || contenedor;
    renderPaginationControls('serviciosAdmin', tablaWrap, paginacion.totalItems, paginacion.totalPages, paginacion.currentPage, renderizarServiciosAdmin);
};

async function cambiarEstadoServicioAdmin(id, nuevoEstado, inputToggle = null) {
    const servicio = serviciosCargados.find((item) => String(obtenerIdServicio(item)) === String(id));
    if (!servicio) {
        if (inputToggle) {
            inputToggle.checked = !nuevoEstado;
            inputToggle.disabled = false;
        }
        mostrarMensajeServicioAdmin('No se encontró el servicio para cambiar estado.', 'error');
        return;
    }

    try {
        if (inputToggle) {
            inputToggle.disabled = true;
        }

        const payload = {
            NombreServicio: servicio.NombreServicio,
            Descripcion: servicio.Descripcion,
            Duracion: servicio.Duracion,
            CantidadMaximaPersonas: servicio.CantidadMaximaPersonas,
            Costo: Number(servicio.Costo),
            Estado: nuevoEstado ? 1 : 0
        };

        const resultado = await actualizarServicio(id, payload);
        if (!resultado) {
            throw new Error('No se pudo actualizar el estado del servicio');
        }

        servicio.Estado = nuevoEstado ? 1 : 0;
        renderizarServiciosAdmin();
        mostrarMensajeServicioAdmin(`Estado actualizado: ${servicio.NombreServicio} ${nuevoEstado ? 'activado' : 'desactivado'}.`, 'ok');
    } catch (error) {
        console.error('Error al cambiar estado de servicio:', error);
        if (inputToggle) {
            inputToggle.checked = !nuevoEstado;
        }
        mostrarMensajeServicioAdmin(error.message || 'No se pudo actualizar el estado', 'error');
    } finally {
        if (inputToggle) {
            inputToggle.disabled = false;
        }
    }
}

const limpiarFormularioServicioAdmin = (mostrarMensaje = true) => {
    const formulario = document.getElementById('form-servicio-admin');
    const campoId = document.getElementById('servicio-admin-id');
    const campoNombre = document.getElementById('servicio-admin-nombre');
    const campoDescripcion = document.getElementById('servicio-admin-descripcion');
    const campoDuracion = document.getElementById('servicio-admin-duracion');
    const campoCantidadMaxima = document.getElementById('servicio-admin-cantidad-maxima');
    const campoCosto = document.getElementById('servicio-admin-costo');
    const campoEstado = document.getElementById('servicio-admin-estado');
    const titulo = document.getElementById('servicio-admin-form-title');
    const botonGuardar = document.getElementById('btn-servicio-admin-guardar');

    if (formulario) formulario.reset();
    if (campoId) campoId.value = '';
    if (campoNombre) campoNombre.value = '';
    if (campoDescripcion) campoDescripcion.value = '';
    if (campoDuracion) campoDuracion.value = '';
    if (campoCantidadMaxima) campoCantidadMaxima.value = '';
    if (campoCosto) campoCosto.value = '';
    if (campoEstado) campoEstado.value = '1';
    if (titulo) titulo.textContent = 'Crear servicio';
    if (botonGuardar) botonGuardar.textContent = 'Guardar servicio';

    if (mostrarMensaje) {
        mostrarMensajeServicioAdmin('Formulario listo para crear un nuevo servicio.');
    }
};

const cargarServicioEnFormularioAdmin = (servicio) => {
    const campoId = document.getElementById('servicio-admin-id');
    const campoNombre = document.getElementById('servicio-admin-nombre');
    const campoDescripcion = document.getElementById('servicio-admin-descripcion');
    const campoDuracion = document.getElementById('servicio-admin-duracion');
    const campoCantidadMaxima = document.getElementById('servicio-admin-cantidad-maxima');
    const campoCosto = document.getElementById('servicio-admin-costo');
    const campoEstado = document.getElementById('servicio-admin-estado');
    const titulo = document.getElementById('servicio-admin-form-title');
    const botonGuardar = document.getElementById('btn-servicio-admin-guardar');

    if (!servicio) return;

    const idServicio = obtenerIdServicio(servicio);

    if (campoId) campoId.value = idServicio;
    if (campoNombre) campoNombre.value = servicio.NombreServicio || '';
    if (campoDescripcion) campoDescripcion.value = servicio.Descripcion || '';
    if (campoDuracion) campoDuracion.value = servicio.Duracion || '';
    if (campoCantidadMaxima) campoCantidadMaxima.value = servicio.CantidadMaximaPersonas || '';
    if (campoCosto) campoCosto.value = servicio.Costo || '';
    if (campoEstado) campoEstado.value = servicio.Estado;
    if (titulo) titulo.textContent = `Editar: ${servicio.NombreServicio}`;
    if (botonGuardar) botonGuardar.textContent = 'Actualizar servicio';

    abrirModalServicioAdmin();
    actualizarValidacionNombreServicioAdmin();
};

async function guardarServicioAdmin(evento) {
    evento.preventDefault();

    const campoId = document.getElementById('servicio-admin-id');
    const campoNombre = document.getElementById('servicio-admin-nombre');
    const campoDescripcion = document.getElementById('servicio-admin-descripcion');
    const campoDuracion = document.getElementById('servicio-admin-duracion');
    const campoCantidadMaxima = document.getElementById('servicio-admin-cantidad-maxima');
    const campoCosto = document.getElementById('servicio-admin-costo');
    const campoEstado = document.getElementById('servicio-admin-estado');

    const id = campoId?.value;
    const nombre = campoNombre?.value.trim();
    const descripcion = campoDescripcion?.value.trim();
    const duracion = campoDuracion?.value.trim();
    const cantidadMaxima = campoCantidadMaxima?.value.trim();
    const costo = campoCosto?.value.trim();
    const estado = campoEstado?.value;

    if (!nombre || !descripcion || !duracion || !cantidadMaxima || !costo || estado === undefined) {
        mostrarMensajeServicioAdmin('Por favor completa todos los campos del formulario.', 'error');
        return;
    }

    if (existeServicioConNombre(nombre, id)) {
        mostrarMensajeServicioAdmin('Ya existe un servicio con ese nombre. Usa otro nombre para poder guardarlo.', 'error');
        return;
    }

    const payload = {
        NombreServicio: nombre,
        Descripcion: descripcion,
        Duracion: Number(duracion),
        CantidadMaximaPersonas: Number(cantidadMaxima),
        Costo: Number(costo),
        Estado: Number(estado)
    };

    limpiarEstadoErrorCampos([
        'servicio-admin-nombre',
        'servicio-admin-descripcion',
        'servicio-admin-duracion',
        'servicio-admin-cantidad-maxima',
        'servicio-admin-costo',
        'servicio-admin-estado'
    ]);

    const formulario = document.getElementById('form-servicio-admin');
    if (formulario && !formulario.checkValidity()) {
        formulario.reportValidity();
        mostrarMensajeServicioAdmin('Completa todos los campos obligatorios del formulario.', 'error');
        return;
    }

    const mensajeCamposObligatorios = validarCamposObligatorios([
        { id: 'servicio-admin-nombre', nombre: 'Nombre del servicio' },
        { id: 'servicio-admin-descripcion', nombre: 'Descripción' },
        { id: 'servicio-admin-duracion', nombre: 'Duración' },
        { id: 'servicio-admin-cantidad-maxima', nombre: 'Cantidad máxima de personas' },
        { id: 'servicio-admin-costo', nombre: 'Costo' },
        { id: 'servicio-admin-estado', nombre: 'Estado' }
    ]);

    if (mensajeCamposObligatorios) {
        mostrarMensajeServicioAdmin(mensajeCamposObligatorios, 'error');
        return;
    }

    try {
        if (id) {
            // Actualizar
            const resultado = await actualizarServicio(id, payload);
            if (!resultado) {
                throw new Error('No se pudo actualizar el servicio');
            }
            mostrarMensajeServicioAdmin(`Servicio "${nombre}" actualizado correctamente.`, 'ok');
            if (typeof showSuccess === 'function') showSuccess(`"${nombre}" actualizado correctamente.`, 'Servicio editado');
        } else {
            // Crear
            const resultado = await crearServicio(payload);
            if (!resultado) {
                throw new Error(obtenerMensajeErrorGuardado('Ya existe un servicio con ese nombre. Usa otro nombre para poder guardarlo.', 'No se pudo crear el servicio'));
            }
            mostrarMensajeServicioAdmin(`Servicio "${nombre}" creado correctamente.`, 'ok');
            if (typeof showSuccess === 'function') showSuccess(`"${nombre}" creado correctamente.`, 'Servicio creado');
        }

        limpiarFormularioServicioAdmin(false);
        await cargarServiciosAdmin();
        cerrarModalServicioAdmin();
    } catch (error) {
        console.error('Error al guardar servicio:', error);
        mostrarMensajeServicioAdmin(error.message || 'No se pudo guardar el servicio', 'error');
        if (typeof showError === 'function') showError(error.message || 'No se pudo guardar el servicio', 'Error');
    }
}

async function eliminarServicioAdmin(id) {
    const servicio = serviciosCargados.find((item) => String(obtenerIdServicio(item)) === String(id));
    if (!servicio) {
        mostrarMensajeServicioAdmin('Servicio no encontrado.', 'error');
        return;
    }

    if (!await confirmarAccion(`¿Eliminar el servicio "${servicio.NombreServicio}"? Esta acción no se puede deshacer.`, 'Eliminar servicio')) return;

    try {
        const resultado = await eliminarServicio(id);
        if (!resultado) {
            throw new Error('No se pudo eliminar el servicio');
        }

        mostrarMensajeServicioAdmin(`Servicio "${servicio.NombreServicio}" eliminado correctamente.`, 'ok');
        if (typeof showSuccess === 'function') showSuccess(`"${servicio.NombreServicio}" eliminado correctamente.`, 'Servicio eliminado');
        limpiarFormularioServicioAdmin(false);
        await cargarServiciosAdmin();
    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        mostrarMensajeServicioAdmin(error.message || 'No se pudo eliminar el servicio', 'error');
        if (typeof showError === 'function') showError(error.message || 'No se pudo eliminar el servicio', 'Error');
    }
}

const inicializarFormularioServiciosAdmin = () => {
    const formulario = document.getElementById('form-servicio-admin');
    const botonLimpiar = document.getElementById('btn-servicio-admin-limpiar');
    const botonRecargar = document.getElementById('btn-servicios-admin-recargar');
    const botonNuevo = document.getElementById('btn-nuevo-servicio-admin');
    const botonCerrarModal = document.getElementById('btn-cerrar-modal-servicio');
    const modalServicio = document.getElementById('modal-servicio-admin');
    const buscador = document.getElementById('busqueda-servicios-admin');
    const filtroEstado = document.getElementById('filtro-estado-servicios-admin');
    const campoNombre = document.getElementById('servicio-admin-nombre');
    const tabla = document.getElementById('servicios-admin-tbody')?.closest('table');

    if (formulario && !formulario.dataset.serviciosAdminInicializado) {
        formulario.addEventListener('submit', guardarServicioAdmin);
        formulario.dataset.serviciosAdminInicializado = 'true';
    }

    if (botonLimpiar && !botonLimpiar.dataset.serviciosAdminInicializado) {
        botonLimpiar.addEventListener('click', () => limpiarFormularioServicioAdmin());
        botonLimpiar.dataset.serviciosAdminInicializado = 'true';
    }

    if (botonRecargar && !botonRecargar.dataset.serviciosAdminInicializado) {
        botonRecargar.addEventListener('click', cargarServiciosAdmin);
        botonRecargar.dataset.serviciosAdminInicializado = 'true';
    }

    if (botonNuevo && !botonNuevo.dataset.serviciosAdminInicializado) {
        botonNuevo.addEventListener('click', () => {
            limpiarFormularioServicioAdmin(false);
            abrirModalServicioAdmin();
        });
        botonNuevo.dataset.serviciosAdminInicializado = 'true';
    }

    if (botonCerrarModal && !botonCerrarModal.dataset.serviciosAdminInicializado) {
        botonCerrarModal.addEventListener('click', cerrarModalServicioAdmin);
        botonCerrarModal.dataset.serviciosAdminInicializado = 'true';
    }

    if (campoNombre && !campoNombre.dataset.serviciosAdminInicializado) {
        campoNombre.addEventListener('input', actualizarValidacionNombreServicioAdmin);
        campoNombre.addEventListener('blur', actualizarValidacionNombreServicioAdmin);
        campoNombre.dataset.serviciosAdminInicializado = 'true';
    }

    if (modalServicio && !modalServicio.dataset.serviciosAdminInicializado) {
        modalServicio.addEventListener('click', (event) => {
            if (event.target === modalServicio) {
                cerrarModalServicioAdmin();
            }
        });
        modalServicio.dataset.serviciosAdminInicializado = 'true';
    }


    if (buscador && !buscador.dataset.serviciosAdminInicializado) {
        buscador.addEventListener('input', () => {
            renderizarServiciosAdmin();
        });
        buscador.dataset.serviciosAdminInicializado = 'true';
    }

    if (filtroEstado && !filtroEstado.dataset.serviciosAdminInicializado) {
        filtroEstado.addEventListener('change', () => {
            resetPagination('serviciosAdmin');
            renderizarServiciosAdmin();
        });
        filtroEstado.dataset.serviciosAdminInicializado = 'true';
    }

    if (tabla && !tabla.dataset.serviciosAdminInicializado) {
        tabla.addEventListener('click', (event) => {
            const boton = event.target.closest('button[data-accion-servicio]');
            if (!boton) return;

            const accion = boton.dataset.accionServicio;
            const id = boton.dataset.id;

            if (accion === 'editar') {
                const servicio = serviciosCargados.find((item) => String(obtenerIdServicio(item)) === String(id));
                if (servicio) {
                    cargarServicioEnFormularioAdmin(servicio);
                }
                return;
            }

            if (accion === 'ver') {
                const servicio = serviciosCargados.find((item) => String(obtenerIdServicio(item)) === String(id));
                if (servicio) {
                    abrirDetalleServicioAdmin(servicio);
                }
                return;
            }

            if (accion === 'eliminar') {
                eliminarServicioAdmin(id);
            }
        });

        tabla.addEventListener('change', (event) => {
            const switchEstado = event.target.closest('input[data-accion-servicio-estado="toggle"]');
            if (!switchEstado) return;

            const id = switchEstado.dataset.id;
            const nuevoEstado = switchEstado.checked;
            cambiarEstadoServicioAdmin(id, nuevoEstado, switchEstado);
        });

        tabla.dataset.serviciosAdminInicializado = 'true';
    }

    const detalleModal = document.getElementById('modal-detalle-admin');
    const cerrarDetalle = document.getElementById('btn-cerrar-modal-detalle');

    if (detalleModal && !detalleModal.dataset.detalleInicializado) {
        detalleModal.addEventListener('click', (event) => {
            if (event.target === detalleModal) {
                cerrarDetalleAdmin();
            }
        });
        detalleModal.dataset.detalleInicializado = 'true';
    }

    if (cerrarDetalle && !cerrarDetalle.dataset.detalleInicializado) {
        cerrarDetalle.addEventListener('click', cerrarDetalleAdmin);
        cerrarDetalle.dataset.detalleInicializado = 'true';
    }
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página cargada, conectando con backend...');
    console.log('Backend URL:', 'http://localhost:3000/api');
    configurarModoContraste();
    configurarModalLogin();
    actualizarBotonSesion();

    // Botón iniciar/cerrar sesión en el header
    const btnSesion = document.getElementById('btn-sesion');
    if (btnSesion) {
        btnSesion.addEventListener('click', () => {
            if (getAuthToken()) {
                clearAuthToken();
                actualizarBotonSesion();
                if (typeof showSuccess === 'function') showSuccess('Sesión cerrada', 'Hasta luego');
            } else {
                mostrarModalLogin();
            }
        });
    }

    // Si volvemos desde reserva-form.html, abrir el módulo de reservas
    const volverA = sessionStorage.getItem('volver_a_seccion');
    if (volverA) {
        sessionStorage.removeItem('volver_a_seccion');
        cargarSeccion(volverA);
    } else if (document.getElementById('seccion-dashboard')) {
        cargarDashboard();
    }
});





// ============================================
// FUNCIONES GLOBALES PARA EVENTOS ONCLICK
// ============================================

// Hacer funciones disponibles globalmente para los eventos onclick
window.cargarHabitacionesAdmin = cargarHabitacionesAdmin;
window.guardarHabitacionAdmin = guardarHabitacionAdmin;
window.eliminarHabitacionAdmin = eliminarHabitacionAdmin;
window.limpiarFormularioHabitacionAdmin = limpiarFormularioHabitacionAdmin;

window.cargarReservasAdmin = cargarReservasAdmin;
window.cancelarReservaAdmin = cancelarReservaAdmin;
window.abrirModalReservaAdmin = abrirModalReservaAdmin;

window.cargarPaquetesAdmin = cargarPaquetesAdmin;
window.eliminarPaqueteAdmin = eliminarPaqueteAdmin;
window.abrirModalPaqueteAdmin = abrirModalPaqueteAdmin;

window.mostrarModalLogin = mostrarModalLogin;
window.cerrarModalLogin = cerrarModalLogin;
window.cargarDashboard = cargarDashboard;

// ============================================
// LOGIN MODAL
// ============================================

function mostrarModalLogin() {
    const modal = document.getElementById('modal-login');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => document.getElementById('login-email')?.focus(), 50);
}

function cerrarModalLogin() {
    const modal = document.getElementById('modal-login');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

function configurarModalLogin() {
    const modal = document.getElementById('modal-login');
    const form = document.getElementById('form-login');
    const btnCerrar = document.getElementById('btn-cerrar-login');
    if (!modal || !form) return;

    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalLogin);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalLogin();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email')?.value?.trim();
        const contrasena = document.getElementById('login-contrasena')?.value;
        const mensajeEl = document.getElementById('login-mensaje');

        if (!email || !contrasena) {
            if (mensajeEl) { mensajeEl.textContent = 'Completa todos los campos.'; mensajeEl.className = 'login-mensaje error'; }
            return;
        }

        const btnGuardar = form.querySelector('button[type="submit"]');
        if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Iniciando...'; }

        try {
            const resultado = await loginUsuario(email, contrasena);
            if (resultado?.token) {
                setAuthToken(resultado.token);
                cerrarModalLogin();
                form.reset();
                if (mensajeEl) mensajeEl.textContent = '';
                if (typeof showSuccess === 'function') showSuccess(`Bienvenido, ${resultado.usuario?.nombre || 'usuario'}`, 'Sesión iniciada');
                actualizarBotonSesion(resultado.usuario?.nombre);

                // Recargar el módulo que estaba activo si es reservas o paquetes
                if (!document.getElementById('seccion-administrar-reservas')?.classList.contains('hidden')) {
                    cargarReservasAdmin();
                } else if (!document.getElementById('seccion-administrar-paquetes')?.classList.contains('hidden')) {
                    cargarPaquetesAdmin();
                }
            } else {
                throw new Error('Respuesta inesperada del servidor');
            }
        } catch (err) {
            if (mensajeEl) { mensajeEl.textContent = err.message || 'Error al iniciar sesión'; mensajeEl.className = 'login-mensaje error'; }
        } finally {
            if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Iniciar sesión'; }
        }
    });
}

function actualizarBotonSesion(nombreUsuario) {
    const btn = document.getElementById('btn-sesion');
    if (!btn) return;
    const token = getAuthToken();
    if (token && nombreUsuario) {
        btn.textContent = `Cerrar sesión (${nombreUsuario})`;
        btn.dataset.loggedIn = 'true';
    } else if (token) {
        btn.textContent = 'Cerrar sesión';
        btn.dataset.loggedIn = 'true';
    } else {
        btn.textContent = 'Iniciar sesión';
        btn.dataset.loggedIn = 'false';
    }
}

// ============================================
// MÓDULO RESERVAS - CRUD ADMIN
// ============================================

let reservasCargadas = [];

const ESTADOS_RESERVA = {
    1: { label: 'Activo',     clase: 'badge-activa' },
    2: { label: 'Pendiente',  clase: 'badge-pendiente' },
    3: { label: 'Cancelado',  clase: 'badge-cancelada' }
};

const METODOS_PAGO_LABEL = {
    1: 'Efectivo',
    2: 'Tarjeta',
    3: 'Transferencia',
    4: 'PSE'
};

async function cargarReservasAdmin() {
    const tbody = document.getElementById('reservas-admin-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="mensaje-vacio">Cargando reservas...</td></tr>';

    reservasCargadas = await obtenerReservas();

    actualizarResumenReservas();
    renderTablaReservasAdmin(reservasCargadas);
}

function actualizarResumenReservas() {
    const total = reservasCargadas.length;
    const activas = reservasCargadas.filter(r => Number(r.IdEstadoReserva) === 1).length;
    const canceladas = reservasCargadas.filter(r => Number(r.IdEstadoReserva) === 3).length;

    const elTotal = document.getElementById('reservas-admin-total');
    const elActivas = document.getElementById('reservas-admin-activas');
    const elCanceladas = document.getElementById('reservas-admin-canceladas');

    if (elTotal) elTotal.textContent = total;
    if (elActivas) elActivas.textContent = activas;
    if (elCanceladas) elCanceladas.textContent = canceladas;
}

function renderTablaReservasAdmin(lista) {
    const tbody = document.getElementById('reservas-admin-tbody');
    if (!tbody) return;

    const busqueda = document.getElementById('busqueda-reservas-admin')?.value?.toLowerCase() || '';
    const filtroEstado = document.getElementById('filtro-estado-reservas-admin')?.value || 'all';

    const filtradas = lista.filter(r => {
        const cliente = `${r.Nombre || ''} ${r.Apellido || ''} ${r.NroDocumento || ''}`.toLowerCase();
        const habitacion = (r.NombreHabitacion || '').toLowerCase();
        const coincide = !busqueda || cliente.includes(busqueda) || habitacion.includes(busqueda);
        const estado = filtroEstado === 'all' || String(r.IdEstadoReserva) === filtroEstado;
        return coincide && estado;
    });

    const tablaWrap = tbody.closest('.crud-reservas-tabla-wrap') || tbody;
    const paginacion = getPaginatedItems(filtradas, 'reservasAdmin');

    if (filtradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="mensaje-vacio">No hay reservas que coincidan.</td></tr>';
        renderPaginationControls('reservasAdmin', tablaWrap, 0, 0, 1, () => renderTablaReservasAdmin(lista), { showSizeSelector: true });
        return;
    }

    tbody.innerHTML = paginacion.items.map(r => {
        const cliente = `${r.Nombre || ''} ${r.Apellido || ''}`.trim() || 'Sin cliente';
        const fechaInicio = r.FechaInicio ? new Date(r.FechaInicio).toLocaleDateString('es-CO') : '-';
        const fechaFin = r.FechaFinalizacion ? new Date(r.FechaFinalizacion).toLocaleDateString('es-CO') : '-';
        const total = r.MontoTotal != null ? `$${Number(r.MontoTotal).toLocaleString('es-CO')}` : '-';
        const estado = Number(r.IdEstadoReserva);
        const esActiva = estado === 1;
        const esCompletada = estado === 2;
        const switchId = `switch-reserva-${r.IDReserva}`;
        const switchLabel = esActiva ? 'Activo' : esCompletada ? 'Pendiente' : 'Cancelado';

        return `
        <tr>
            <td>${escaparHtml(String(r.IDReserva || ''))}</td>
            <td>
                <div class="reserva-cliente-info">
                    <span class="reserva-cliente-nombre">${escaparHtml(cliente)}</span>
                    <small class="reserva-cliente-doc">${escaparHtml(r.NroDocumento || '')}</small>
                </div>
            </td>
            <td>${escaparHtml(r.NombreHabitacion || '-')}</td>
            <td>
                <div class="reserva-fechas">
                    <span>${fechaInicio}</span>
                    <small>→ ${fechaFin}</small>
                </div>
            </td>
            <td><strong>${total}</strong></td>
            <td>
                <div class="reserva-estado-toggle">
                    <label class="switch-estado" for="${escaparHtml(switchId)}" title="${switchLabel}">
                        <input
                            id="${escaparHtml(switchId)}"
                            type="checkbox"
                            data-accion-reserva-estado="toggle"
                            data-id="${escaparHtml(String(r.IDReserva))}"
                            data-estado="${estado}"
                            ${esActiva || esCompletada ? 'checked' : ''}
                            ${esCompletada ? 'disabled' : ''}
                            aria-label="Estado de reserva: ${switchLabel}"
                        >
                        <span class="switch-slider"></span>
                    </label>
                    <span class="reserva-estado-label">${switchLabel}</span>
                </div>
            </td>
            <td>
                <div class="crud-servicios-acciones">
                    ${obtenerBotonIcono('ver', 'btn-mini-ver', 'Ver detalle', `Ver reserva #${r.IDReserva}`, 'accion-reserva', String(r.IDReserva))}
                    ${obtenerBotonIcono('editar', 'btn-mini-editar', 'Editar', `Editar reserva #${r.IDReserva}`, 'accion-reserva', String(r.IDReserva))}
                    ${obtenerBotonIcono('eliminar', 'btn-mini-eliminar', 'Eliminar', `Eliminar reserva #${r.IDReserva}`, 'accion-reserva', String(r.IDReserva))}
                </div>
            </td>
        </tr>`;
    }).join('');

    renderPaginationControls(
        'reservasAdmin', tablaWrap,
        paginacion.totalItems, paginacion.totalPages, paginacion.currentPage,
        () => renderTablaReservasAdmin(lista),
        { showSizeSelector: true }
    );
}

function abrirModalReservaAdmin(reserva = null) {
    if (reserva) {
        sessionStorage.setItem('reserva_form_data', JSON.stringify(reserva));
    } else {
        sessionStorage.removeItem('reserva_form_data');
    }
    window.location.href = 'reserva-form.html';
}

async function cargarSelectsReserva(paquetesSeleccionados = [], serviciosSeleccionados = []) {
    const [habitaciones, servicios, paquetes] = await Promise.all([
        obtenerHabitaciones(),
        obtenerServicios(),
        obtenerPaquetes()
    ]);

    habitacionesParaReserva = habitaciones;

    // Habitaciones — muestra precio por noche en el option
    const selectHab = document.getElementById('reserva-admin-habitacion');
    if (selectHab && habitaciones.length > 0) {
        const valorActual = selectHab.value;
        selectHab.innerHTML = '<option value="">-- Selecciona habitación --</option>' +
            habitaciones.map(h => `<option value="${h.IDHabitacion}" data-costo="${h.Costo || 0}">${escaparHtml(h.NombreHabitacion || '')} — $${Number(h.Costo || 0).toLocaleString('es-CO')}/noche</option>`).join('');
        if (valorActual) selectHab.value = valorActual;
    }

    // Paquetes — solo activos — tarjetas con imagen, descripción y data-precio
    const gridPaquetes = document.getElementById('reserva-admin-paquetes-grid');
    if (gridPaquetes) {
        const activos = paquetes.filter(p => Number(p.Estado) === 1);
        if (activos.length === 0) {
            gridPaquetes.innerHTML = '<p class="cargando-opciones">No hay paquetes activos.</p>';
        } else {
            gridPaquetes.innerHTML = activos.map((p, idx) => {
                const seleccionado = paquetesSeleccionados.includes(String(p.IDPaquete));
                const imgSrc = obtenerImagenPaquete(p, idx);
                const imgHtml = `<div class="paquete-card-img-wrap"><img src="${escaparHtml(imgSrc)}" class="paquete-card-img" alt="${escaparHtml(p.NombrePaquete || '')}" onerror="this.src='assets/images/default.svg'"></div>`;
                return `
                <div class="paquete-card ${seleccionado ? 'seleccionado' : ''}"
                     data-id="${p.IDPaquete}" data-precio="${Number(p.Precio || 0)}"
                     role="checkbox" aria-checked="${seleccionado}" tabindex="0">
                    ${imgHtml}
                    <div class="paquete-card-header">
                        <span class="paquete-card-nombre">${escaparHtml(p.NombrePaquete || '')}</span>
                        <span class="paquete-card-precio">$${Number(p.Precio || 0).toLocaleString('es-CO')}</span>
                    </div>
                    <p class="paquete-card-desc">${escaparHtml(p.Descripcion || '')}</p>
                    <div class="paquete-card-detalle">
                        <span><i class="fa-solid fa-bed"></i> ${escaparHtml(p.NombreHabitacion || '')}</span>
                        <span><i class="fa-solid fa-concierge-bell"></i> ${escaparHtml(p.NombreServicio || '')}</span>
                    </div>
                    <div class="paquete-card-check"><i class="fa-solid fa-check"></i> Seleccionado</div>
                </div>`;
            }).join('');

            gridPaquetes.querySelectorAll('.paquete-card').forEach(card => {
                const toggle = () => {
                    card.classList.toggle('seleccionado');
                    card.setAttribute('aria-checked', card.classList.contains('seleccionado'));
                    recalcularPrecio();
                };
                card.addEventListener('click', toggle);
                card.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
            });
        }
    }

    // Servicios — solo activos — tarjetas expandibles con detalle
    const SERVICIO_META = {
        spa:             { icon: 'fa-spa',             dias: 'Lun – Dom', horario: '8:00am – 9:00pm',  ubicacion: 'Piso 2 · Ala Bienestar',       incluye: 'Jacuzzi · Sauna · Sala de vapor · Aromaterapia' },
        masajes:         { icon: 'fa-hand-sparkles',   dias: 'Lun – Dom', horario: '9:00am – 8:00pm',  ubicacion: 'Piso 2 · Ala Bienestar',       incluye: 'Relajante · Deportivo · Piedras calientes · Aceites' },
        masaje:          { icon: 'fa-hand-sparkles',   dias: 'Lun – Dom', horario: '9:00am – 8:00pm',  ubicacion: 'Piso 2 · Ala Bienestar',       incluye: 'Relajante · Deportivo · Piedras calientes · Aceites' },
        sala:            { icon: 'fa-hand-sparkles',   dias: 'Lun – Dom', horario: '9:00am – 8:00pm',  ubicacion: 'Piso 2 · Ala Bienestar',       incluye: 'Relajante · Deportivo · Piedras calientes · Aceites' },
        desayuno:        { icon: 'fa-mug-hot',          dias: 'Lun – Dom', horario: '7:00am – 10:30am', ubicacion: 'Restaurante principal',         incluye: 'Buffet caliente · Jugos naturales · Frutas de temporada' },
        cena:            { icon: 'fa-wine-glass',       dias: 'Mié – Dom', horario: '7:00pm – 11:00pm', ubicacion: 'Restaurante gourmet · Piso 1',  incluye: 'Menú 3 tiempos · Vino de la casa · Mesa con vista' },
        gourmet:         { icon: 'fa-wine-glass',       dias: 'Mié – Dom', horario: '7:00pm – 11:00pm', ubicacion: 'Restaurante gourmet · Piso 1',  incluye: 'Menú 3 tiempos · Vino de la casa · Mesa con vista' },
        piscina:         { icon: 'fa-person-swimming',  dias: 'Mar – Dom', horario: '6:00am – 10:00pm', ubicacion: 'Área exterior · Piso 1',        incluye: 'Acceso ilimitado · Toallas · Tumbonas' },
        gimnasio:        { icon: 'fa-dumbbell',         dias: 'Lun – Dom', horario: '5:30am – 11:00pm', ubicacion: 'Piso 3',                        incluye: 'Equipos modernos · Instructor disponible · Duchas' },
        restaurante:     { icon: 'fa-utensils',         dias: 'Lun – Dom', horario: '12:00pm – 10:00pm',ubicacion: 'Planta baja',                   incluye: 'Carta variada · Menú del día · Bar abierto' },
        wifi:            { icon: 'fa-wifi',             dias: 'Lun – Dom', horario: '24 horas',          ubicacion: 'Todo el establecimiento',       incluye: 'Fibra óptica · Hasta 300 Mbps · Sin límite' },
        estacionamiento: { icon: 'fa-car',              dias: 'Lun – Dom', horario: '24 horas',          ubicacion: 'Sótano y área exterior',        incluye: 'Vigilancia · Espacio cubierto y descubierto' },
        lavanderia:      { icon: 'fa-shirt',            dias: 'Lun – Sáb', horario: '8:00am – 6:00pm',  ubicacion: 'Piso 1 · Sala de servicio',     incluye: 'Lavado · Secado · Planchado · Entrega en 24h' },
        tours:           { icon: 'fa-map-location-dot', dias: 'Mar – Dom', horario: '8:00am – 5:00pm',  ubicacion: 'Recepción principal',           incluye: 'Guía bilingüe · Transporte · Seguro incluido' },
        default:         { icon: 'fa-concierge-bell',   dias: 'Lun – Dom', horario: '8:00am – 8:00pm',  ubicacion: 'Recepción principal',           incluye: 'Consulte disponibilidad en recepción' }
    };

    function obtenerMetaSvc(nombre) {
        const n = (nombre || '').toLowerCase();
        for (const [clave, meta] of Object.entries(SERVICIO_META)) {
            if (clave !== 'default' && n.includes(clave)) return meta;
        }
        return SERVICIO_META.default;
    }

    const gridServicios = document.getElementById('reserva-admin-servicios-grid');
    if (gridServicios) {
        const activos = servicios.filter(s => Number(s.Estado) === 1);
        if (activos.length === 0) {
            gridServicios.innerHTML = '<p class="cargando-opciones">No hay servicios activos.</p>';
        } else {
            gridServicios.innerHTML = activos.map(s => {
                const seleccionado = serviciosSeleccionados.includes(String(s.IDServicio));
                const costo = Number(s.Costo || 0);
                const precioTexto = costo > 0 ? `$${costo.toLocaleString('es-CO')}` : 'Incluido';
                const meta = obtenerMetaSvc(s.NombreServicio);
                return `
                <div class="servicio-toggle-btn ${seleccionado ? 'seleccionado' : ''}"
                     role="button" tabindex="0"
                     data-id="${s.IDServicio}" data-costo="${costo}" aria-pressed="${seleccionado}">
                    <div class="svc-main">
                        <span class="svc-icon"><i class="fa-solid ${meta.icon}"></i></span>
                        <div class="svc-info">
                            <span class="svc-nombre">${escaparHtml(s.NombreServicio || '')}</span>
                            <span class="svc-desc">${escaparHtml(s.Descripcion || '')}</span>
                        </div>
                        <span class="svc-precio">${precioTexto}</span>
                    </div>
                    <div class="svc-detalle">
                        <div class="svc-det-item"><i class="fa-solid fa-calendar-days"></i><span>${meta.dias}</span></div>
                        <div class="svc-det-item"><i class="fa-solid fa-clock"></i><span>${meta.horario}</span></div>
                        <div class="svc-det-item"><i class="fa-solid fa-location-dot"></i><span>${meta.ubicacion}</span></div>
                        <div class="svc-det-item svc-det-incluye"><i class="fa-solid fa-circle-check"></i><span>${meta.incluye}</span></div>
                    </div>
                    <div class="svc-check-badge"><i class="fa-solid fa-check-circle"></i> Seleccionado</div>
                </div>`;
            }).join('');

            gridServicios.querySelectorAll('.servicio-toggle-btn').forEach(btn => {
                const toggle = () => {
                    btn.classList.toggle('seleccionado');
                    btn.setAttribute('aria-pressed', btn.classList.contains('seleccionado'));
                    recalcularPrecio();
                };
                btn.addEventListener('click', toggle);
                btn.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
            });
        }
    }

    configurarCalculoPrecio();
    recalcularPrecio();
}

function recalcularPrecio() {
    const selectHab = document.getElementById('reserva-admin-habitacion');
    const fechaInicioVal = document.getElementById('reserva-admin-fecha-inicio')?.value;
    const fechaFinVal = document.getElementById('reserva-admin-fecha-fin')?.value;
    const descuento = Number(document.getElementById('reserva-admin-descuento')?.value || 0);

    let costoHab = 0;
    if (selectHab?.value && fechaInicioVal && fechaFinVal) {
        const hab = habitacionesParaReserva.find(h => String(h.IDHabitacion) === String(selectHab.value));
        if (hab) {
            const inicio = new Date(fechaInicioVal + 'T00:00:00');
            const fin = new Date(fechaFinVal + 'T00:00:00');
            const noches = Math.max(1, Math.round((fin - inicio) / 86400000));
            costoHab = Number(hab.Costo || 0) * noches;
        }
    }

    const sumaPaquetes = Array.from(
        document.querySelectorAll('#reserva-admin-paquetes-grid .paquete-card.seleccionado')
    ).reduce((sum, el) => sum + Number(el.dataset.precio || 0), 0);

    const sumaServicios = Array.from(
        document.querySelectorAll('#reserva-admin-servicios-grid .servicio-toggle-btn.seleccionado')
    ).reduce((sum, el) => sum + Number(el.dataset.costo || 0), 0);

    const subtotal = costoHab + sumaPaquetes + sumaServicios;
    const total = Math.max(0, subtotal - Math.max(0, descuento));

    const elSub = document.getElementById('reserva-admin-subtotal');
    const elTot = document.getElementById('reserva-admin-total');
    if (elSub) elSub.value = subtotal;
    if (elTot) elTot.value = total;
}

function configurarCalculoPrecio() {
    const ids = ['reserva-admin-habitacion', 'reserva-admin-fecha-inicio', 'reserva-admin-fecha-fin'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.dataset.precioListener) {
            el.addEventListener('change', recalcularPrecio);
            el.dataset.precioListener = 'true';
        }
    });
    const desc = document.getElementById('reserva-admin-descuento');
    if (desc && !desc.dataset.precioListener) {
        desc.addEventListener('input', recalcularPrecio);
        desc.dataset.precioListener = 'true';
    }
}

function cerrarModalReservaAdmin() {
    const modal = document.getElementById('modal-reserva-admin');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

function limpiarFormularioReservaAdmin() {
    const form = document.getElementById('form-reserva-admin');
    if (form) form.reset();
    const idField = document.getElementById('reserva-admin-id');
    if (idField) idField.value = '';
    const clienteId = document.getElementById('reserva-admin-cliente-id');
    if (clienteId) clienteId.value = '';
    const clienteBuscar = document.getElementById('reserva-admin-cliente-buscar');
    if (clienteBuscar) { clienteBuscar.value = ''; clienteBuscar.dataset.documentoSeleccionado = ''; }
    const lista = document.getElementById('reserva-admin-cliente-lista');
    if (lista) lista.classList.add('hidden');
    const mensaje = document.getElementById('mensaje-reserva-admin-modal');
    if (mensaje) mensaje.textContent = '';
    const elSub = document.getElementById('reserva-admin-subtotal');
    const elTot = document.getElementById('reserva-admin-total');
    if (elSub) elSub.value = 0;
    if (elTot) elTot.value = 0;

    const today = new Date().toISOString().split('T')[0];
    const fechaInicio = document.getElementById('reserva-admin-fecha-inicio');
    const fechaFin = document.getElementById('reserva-admin-fecha-fin');
    if (fechaInicio) fechaInicio.min = today;
    if (fechaFin) fechaFin.min = today;
}

async function guardarReservaAdmin(e) {
    e.preventDefault();
    const mensajeEl = document.getElementById('mensaje-reserva-admin-modal');
    const id = document.getElementById('reserva-admin-id')?.value;

    const documento = document.getElementById('reserva-admin-cliente-id')?.value?.trim()
        || document.getElementById('reserva-admin-cliente-buscar')?.dataset?.documentoSeleccionado?.trim();
    const idHabitacion = document.getElementById('reserva-admin-habitacion')?.value;
    const fechaInicio = document.getElementById('reserva-admin-fecha-inicio')?.value;
    const fechaFin = document.getElementById('reserva-admin-fecha-fin')?.value;

    if (!documento) {
        if (mensajeEl) { mensajeEl.textContent = 'Selecciona un cliente de la lista.'; mensajeEl.className = 'crud-reservas-mensaje error'; }
        return;
    }
    if (!idHabitacion || !fechaInicio || !fechaFin) {
        if (mensajeEl) { mensajeEl.textContent = 'Habitación y fechas son obligatorios.'; mensajeEl.className = 'crud-reservas-mensaje error'; }
        return;
    }

    const paquetesIds = Array.from(
        document.querySelectorAll('#reserva-admin-paquetes-grid .paquete-card.seleccionado[data-id]')
    ).map(el => Number(el.dataset.id));

    const serviciosIds = Array.from(
        document.querySelectorAll('#reserva-admin-servicios-grid .servicio-toggle-btn.seleccionado[data-id]')
    ).map(el => Number(el.dataset.id));

    const payload = {
        NroDocumento: documento,
        IDHabitacion: Number(idHabitacion),
        FechaInicio: fechaInicio,
        FechaFinalizacion: fechaFin,
        SubTotal: Number(document.getElementById('reserva-admin-subtotal')?.value || 0),
        Descuento: Number(document.getElementById('reserva-admin-descuento')?.value || 0),
        IVA: Number(document.getElementById('reserva-admin-iva')?.value || 0),
        MontoTotal: Number(document.getElementById('reserva-admin-total')?.value || 0),
        MetodoPago: Number(document.getElementById('reserva-admin-metodo-pago')?.value || 1),
        IdEstadoReserva: Number(document.getElementById('reserva-admin-estado')?.value || 1),
        paquetesIds,
        serviciosIds
    };

    const btnGuardar = document.getElementById('btn-reserva-admin-guardar');
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Guardando...'; }

    try {
        if (id) {
            await actualizarReserva(id, payload);
            if (mensajeEl) { mensajeEl.textContent = 'Reserva actualizada correctamente.'; mensajeEl.className = 'crud-reservas-mensaje exito'; }
            if (typeof showSuccess === 'function') showSuccess('Reserva actualizada correctamente.', 'Reserva editada');
        } else {
            await crearReserva(payload);
            if (mensajeEl) { mensajeEl.textContent = 'Reserva creada correctamente.'; mensajeEl.className = 'crud-reservas-mensaje exito'; }
            if (typeof showSuccess === 'function') showSuccess('Reserva creada correctamente.', 'Reserva creada');
        }
        // Si venimos de reserva-form.html, regresar al módulo de reservas
        if (window.location.pathname.includes('reserva-form')) {
            sessionStorage.setItem('volver_a_seccion', 'administrar-reservas');
            setTimeout(() => { window.location.href = 'index.html'; }, 900);
        } else {
            await cargarReservasAdmin();
            setTimeout(cerrarModalReservaAdmin, 900);
        }
    } catch (err) {
        if (mensajeEl) { mensajeEl.textContent = err.message || 'Error al guardar la reserva.'; mensajeEl.className = 'crud-reservas-mensaje error'; }
        if (typeof showError === 'function') showError(err.message || 'No se pudo guardar la reserva.', 'Error');
    } finally {
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Guardar reserva'; }
    }
}

async function cancelarReservaAdmin(id) {
    if (!await confirmarAccion('¿Cancelar esta reserva? Esta acción no se puede deshacer.', 'Cancelar reserva')) return;
    try {
        await cancelarReserva(id);
        if (typeof showSuccess === 'function') showSuccess('Reserva cancelada', 'Operación exitosa');
        await cargarReservasAdmin();
    } catch (err) {
        if (typeof showError === 'function') showError(err.message || 'Error al cancelar la reserva', 'Error');
    }
}

async function toggleEstadoReservaAdmin(id, activar, inputToggle) {
    const reserva = reservasCargadas.find(r => String(r.IDReserva) === String(id));
    if (!reserva) return;

    if (activar) {
        // Reactivar reserva cancelada
        inputToggle.disabled = true;
        try {
            const payload = {
                NroDocumento: reserva.NroDocumento,
                IDHabitacion: reserva.IDHabitacion,
                FechaInicio: reserva.FechaInicio ? reserva.FechaInicio.split('T')[0] : '',
                FechaFinalizacion: reserva.FechaFinalizacion ? reserva.FechaFinalizacion.split('T')[0] : '',
                MetodoPago: reserva.MetodoPago || 1,
                IdEstadoReserva: 1,
                SubTotal: reserva.SubTotal || 0,
                Descuento: reserva.Descuento || 0,
                IVA: reserva.IVA || 0,
                MontoTotal: reserva.MontoTotal || 0
            };
            await actualizarReserva(id, payload);
            if (typeof showSuccess === 'function') showSuccess(`Reserva #${id} reactivada correctamente.`, 'Reserva activada');
            await cargarReservasAdmin();
        } catch (err) {
            inputToggle.checked = false;
            inputToggle.disabled = false;
            if (typeof showError === 'function') showError(err.message || 'No se pudo reactivar la reserva.', 'Error');
            console.error('Error al reactivar reserva:', err.message);
        }
    } else {
        // Cancelar reserva activa con confirmación
        if (!await confirmarAccion('¿Cancelar esta reserva?', 'Cambiar estado')) {
            inputToggle.checked = true;
            return;
        }
        inputToggle.disabled = true;
        try {
            await cancelarReserva(id);
            if (typeof showSuccess === 'function') showSuccess(`Reserva #${id} cancelada.`, 'Reserva cancelada');
            await cargarReservasAdmin();
        } catch (err) {
            inputToggle.checked = true;
            inputToggle.disabled = false;
            if (typeof showError === 'function') showError(err.message || 'No se pudo cancelar la reserva.', 'Error');
            console.error('Error al cancelar reserva:', err.message);
        }
    }
}

function configurarBuscadorCliente() {
    const input = document.getElementById('reserva-admin-cliente-buscar');
    const lista = document.getElementById('reserva-admin-cliente-lista');
    const hiddenId = document.getElementById('reserva-admin-cliente-id');
    if (!input || !lista || input.dataset.inicializado) return;

    let clientesCache = [];

    const cerrarLista = () => lista.classList.add('hidden');

    const mostrarSugerencias = (texto) => {
        const q = texto.trim().toLowerCase();
        if (!q) { cerrarLista(); return; }

        const coincidencias = clientesCache.filter(c => {
            const nombreCompleto = `${c.Nombre || ''} ${c.Apellido || ''}`.toLowerCase();
            const doc = (c.NroDocumento || '').toLowerCase();
            return nombreCompleto.includes(q) || doc.includes(q);
        }).slice(0, 8);

        if (coincidencias.length === 0) {
            lista.innerHTML = '<li class="autocomplete-sin-resultados">Sin resultados</li>';
        } else {
            lista.innerHTML = coincidencias.map(c => `
                <li class="autocomplete-item" data-id="${escaparHtml(String(c.IDCliente || c.NroDocumento))}"
                    data-doc="${escaparHtml(c.NroDocumento || '')}"
                    data-nombre="${escaparHtml(`${c.Nombre || ''} ${c.Apellido || ''}`.trim())}">
                    <span class="autocomplete-nombre">${escaparHtml(`${c.Nombre || ''} ${c.Apellido || ''}`.trim())}</span>
                    <span class="autocomplete-doc">${escaparHtml(c.NroDocumento || '')}</span>
                </li>`).join('');
        }
        lista.classList.remove('hidden');
    };

    input.addEventListener('focus', async () => {
        if (clientesCache.length === 0) clientesCache = await obtenerClientes();
        if (input.value.trim()) mostrarSugerencias(input.value);
    });

    input.addEventListener('input', async () => {
        if (clientesCache.length === 0) clientesCache = await obtenerClientes();
        hiddenId.value = '';
        input.dataset.documentoSeleccionado = '';
        mostrarSugerencias(input.value);
    });

    lista.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (!item) return;
        const nombre = item.dataset.nombre;
        const doc = item.dataset.doc;
        input.value = `${nombre} — ${doc}`;
        hiddenId.value = doc;
        input.dataset.documentoSeleccionado = doc;
        cerrarLista();
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.cliente-search-wrap')) cerrarLista();
    });

    input.dataset.inicializado = 'true';
}

async function eliminarReservaAdmin(id) {
    if (!await confirmarAccion(`¿Eliminar la reserva #${id}? Esta acción no se puede deshacer.`, 'Eliminar reserva')) return;
    try {
        await requestJson(`/reservas/${id}`, { method: 'DELETE', allowNoContent: true });
        if (typeof showSuccess === 'function') showSuccess('Reserva eliminada correctamente', 'Eliminado');
        await cargarReservasAdmin();
    } catch (err) {
        if (typeof showError === 'function') showError(err.message || 'Error al eliminar la reserva', 'Error');
    }
}

function configurarCRUDReservas() {
    const btnNueva = document.getElementById('btn-nueva-reserva-admin');
    if (btnNueva && !btnNueva.dataset.inicializado) {
        btnNueva.addEventListener('click', () => abrirModalReservaAdmin());
        btnNueva.dataset.inicializado = 'true';
    }

    const btnCerrarModal = document.getElementById('btn-cerrar-modal-reserva');
    if (btnCerrarModal && !btnCerrarModal.dataset.inicializado) {
        btnCerrarModal.addEventListener('click', cerrarModalReservaAdmin);
        btnCerrarModal.dataset.inicializado = 'true';
    }

    const modal = document.getElementById('modal-reserva-admin');
    if (modal && !modal.dataset.inicializado) {
        modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModalReservaAdmin(); });
        modal.dataset.inicializado = 'true';
    }

    const form = document.getElementById('form-reserva-admin');
    if (form && !form.dataset.inicializado) {
        form.addEventListener('submit', guardarReservaAdmin);
        form.dataset.inicializado = 'true';
    }

    configurarBuscadorCliente();

    const btnLimpiar = document.getElementById('btn-reserva-admin-limpiar');
    if (btnLimpiar && !btnLimpiar.dataset.inicializado) {
        btnLimpiar.addEventListener('click', limpiarFormularioReservaAdmin);
        btnLimpiar.dataset.inicializado = 'true';
    }

    const tabla = document.getElementById('reservas-admin-tbody');
    if (tabla && !tabla.dataset.inicializado) {
        tabla.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-accion-reserva]');
            if (!btn) return;
            const accion = btn.dataset.accionReserva;
            const id = btn.dataset.id;
            const reserva = reservasCargadas.find(r => String(r.IDReserva) === String(id));

            if (accion === 'ver' && reserva) mostrarDetalleReserva(reserva);
            if (accion === 'editar' && reserva) abrirModalReservaAdmin(reserva);
            if (accion === 'eliminar') await eliminarReservaAdmin(id);
        });

        tabla.addEventListener('change', async (e) => {
            const toggle = e.target.closest('input[data-accion-reserva-estado="toggle"]');
            if (!toggle) return;
            await toggleEstadoReservaAdmin(toggle.dataset.id, toggle.checked, toggle);
        });

        tabla.dataset.inicializado = 'true';
    }

    const busqueda = document.getElementById('busqueda-reservas-admin');
    if (busqueda && !busqueda.dataset.inicializado) {
        busqueda.addEventListener('input', () => {
            resetPagination('reservasAdmin');
            renderTablaReservasAdmin(reservasCargadas);
        });
        busqueda.dataset.inicializado = 'true';
    }

    const filtroEstado = document.getElementById('filtro-estado-reservas-admin');
    if (filtroEstado && !filtroEstado.dataset.inicializado) {
        filtroEstado.addEventListener('change', () => {
            resetPagination('reservasAdmin');
            renderTablaReservasAdmin(reservasCargadas);
        });
        filtroEstado.dataset.inicializado = 'true';
    }
}

function mostrarDetalleReserva(reserva) {
    const modal = document.getElementById('modal-detalle-admin');
    const titulo = document.getElementById('detalle-admin-titulo');
    const contenido = document.getElementById('detalle-admin-contenido');
    if (!modal || !contenido) return;

    if (titulo) titulo.textContent = `Reserva #${reserva.IDReserva}`;

    const estadoInfo = ESTADOS_RESERVA[reserva.IdEstadoReserva] || { label: 'Desconocido', clase: '' };
    const cliente = `${reserva.Nombre || ''} ${reserva.Apellido || ''}`.trim();
    const metodoPago = METODOS_PAGO_LABEL[reserva.MetodoPago] || reserva.MetodoPago || '-';

    contenido.innerHTML = `
        <div class="detalle-reserva-grid">
            <div class="detalle-reserva-grupo">
                <h5>Cliente</h5>
                <p><strong>${escaparHtml(cliente || '-')}</strong></p>
                <p>Doc: ${escaparHtml(reserva.NroDocumento || '-')}</p>
            </div>
            <div class="detalle-reserva-grupo">
                <h5>Habitación</h5>
                <p>${escaparHtml(reserva.NombreHabitacion || '-')}</p>
            </div>
            <div class="detalle-reserva-grupo">
                <h5>Fechas</h5>
                <p>Inicio: ${reserva.FechaInicio ? new Date(reserva.FechaInicio).toLocaleDateString('es-CO') : '-'}</p>
                <p>Fin: ${reserva.FechaFinalizacion ? new Date(reserva.FechaFinalizacion).toLocaleDateString('es-CO') : '-'}</p>
            </div>
            <div class="detalle-reserva-grupo">
                <h5>Financiero</h5>
                <p>Subtotal: $${Number(reserva.SubTotal || 0).toLocaleString('es-CO')}</p>
                <p>Descuento: $${Number(reserva.Descuento || 0).toLocaleString('es-CO')}</p>
                <p>IVA: $${Number(reserva.IVA || 0).toLocaleString('es-CO')}</p>
                <p><strong>Total: $${Number(reserva.MontoTotal || 0).toLocaleString('es-CO')}</strong></p>
            </div>
            <div class="detalle-reserva-grupo">
                <h5>Pago y estado</h5>
                <p>Método: ${escaparHtml(metodoPago)}</p>
                <p>Estado: <span class="badge-estado ${estadoInfo.clase}">${estadoInfo.label}</span></p>
            </div>
            ${reserva.Paquetes ? `<div class="detalle-reserva-grupo"><h5>Paquetes</h5><p>${escaparHtml(reserva.Paquetes)}</p></div>` : ''}
            ${reserva.Servicios ? `<div class="detalle-reserva-grupo"><h5>Servicios adicionales</h5><p>${escaparHtml(reserva.Servicios)}</p></div>` : ''}
        </div>`;

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

// ============================================
// MÓDULO PAQUETES - CRUD ADMIN
// ============================================

let paquetesCargados = [];

async function cargarPaquetesAdmin() {
    const tbody = document.getElementById('paquetes-admin-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="mensaje-vacio">Cargando paquetes...</td></tr>';

    const [paquetes, servicios] = await Promise.all([obtenerPaquetes(), obtenerServicios()]);
    paquetesCargados = paquetes;

    actualizarResumenPaquetes();
    renderTablaPaquetesAdmin(paquetesCargados);
    renderServiciosEstadoAdmin(servicios);
}

function actualizarResumenPaquetes() {
    const total = paquetesCargados.length;
    const activos = paquetesCargados.filter(p => Number(p.Estado) === 1).length;
    const inactivos = total - activos;

    const elTotal = document.getElementById('paquetes-admin-total');
    const elActivos = document.getElementById('paquetes-admin-activos');
    const elInactivos = document.getElementById('paquetes-admin-inactivos');

    if (elTotal) elTotal.textContent = total;
    if (elActivos) elActivos.textContent = activos;
    if (elInactivos) elInactivos.textContent = inactivos;
}

function renderTablaPaquetesAdmin(lista) {
    const tbody = document.getElementById('paquetes-admin-tbody');
    if (!tbody) return;

    const busqueda = document.getElementById('busqueda-paquetes-admin')?.value?.toLowerCase() || '';
    const filtroEstado = document.getElementById('filtro-estado-paquetes-admin')?.value || 'all';

    const filtrados = lista.filter(p => {
        const texto = `${p.NombrePaquete || ''} ${p.Descripcion || ''} ${p.NombreHabitacion || ''} ${p.NombreServicio || ''}`.toLowerCase();
        const coincide = !busqueda || texto.includes(busqueda);
        const estado = filtroEstado === 'all'
            || (filtroEstado === 'active' && Number(p.Estado) === 1)
            || (filtroEstado === 'inactive' && Number(p.Estado) !== 1);
        return coincide && estado;
    });

    const tablaWrap = tbody.closest('.crud-paquetes-tabla-wrap') || tbody;
    const paginacion = getPaginatedItems(filtrados, 'paquetesAdmin');

    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="mensaje-vacio">No hay paquetes que coincidan.</td></tr>';
        renderPaginationControls('paquetesAdmin', tablaWrap, 0, 0, 1, () => renderTablaPaquetesAdmin(lista), { showSizeSelector: true });
        return;
    }

    tbody.innerHTML = paginacion.items.map((p, idx) => {
        const activo = Number(p.Estado) === 1;
        const cliente = p.NombreCliente ? `${p.NombreCliente} ${p.ApellidoCliente || ''}`.trim() : '-';
        const precio = p.Precio != null ? `$${Number(p.Precio).toLocaleString('es-CO')}` : '-';
        const imgSrc = obtenerImagenPaquete(p, idx);

        return `
        <tr>
            <td>${escaparHtml(String(p.IDPaquete || ''))}</td>
            <td>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <img src="${escaparHtml(imgSrc)}" alt="${escaparHtml(p.NombrePaquete || '')}"
                         style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;"
                         onerror="this.style.display='none'">
                    <strong>${escaparHtml(p.NombrePaquete || '-')}</strong>
                </div>
            </td>
            <td>${escaparHtml(p.NombreHabitacion || '-')}</td>
            <td>${escaparHtml(p.NombreServicio || '-')}</td>
            <td>${escaparHtml(cliente)}</td>
            <td><strong>${precio}</strong></td>
            <td>
                <label class="switch-estado" style="margin:0;" title="${activo ? 'Desactivar paquete' : 'Activar paquete'}">
                    <input type="checkbox"
                        data-accion-paquete="toggle-estado"
                        data-id="${escaparHtml(String(p.IDPaquete))}"
                        data-estado="${p.Estado}"
                        ${activo ? 'checked' : ''}
                        aria-label="Estado del paquete">
                    <span class="switch-slider"></span>
                </label>
            </td>
            <td>
                <div class="crud-servicios-acciones">
                    ${obtenerBotonIcono('ver', 'btn-mini-ver', 'Ver detalle', `Ver ${escaparHtml(p.NombrePaquete || 'paquete')}`, 'accion-paquete', String(p.IDPaquete))}
                    ${obtenerBotonIcono('editar', 'btn-mini-editar', 'Editar', `Editar ${escaparHtml(p.NombrePaquete || 'paquete')}`, 'accion-paquete', String(p.IDPaquete))}
                    ${obtenerBotonIcono('eliminar', 'btn-mini-eliminar', 'Eliminar', `Eliminar ${escaparHtml(p.NombrePaquete || 'paquete')}`, 'accion-paquete', String(p.IDPaquete))}
                </div>
            </td>
        </tr>`;
    }).join('');

    renderPaginationControls(
        'paquetesAdmin', tablaWrap,
        paginacion.totalItems, paginacion.totalPages, paginacion.currentPage,
        () => renderTablaPaquetesAdmin(lista),
        { showSizeSelector: true }
    );
}

function renderServiciosEstadoAdmin(servicios) {
    const grid = document.getElementById('servicios-estado-grid');
    if (!grid) return;

    if (!servicios || servicios.length === 0) {
        grid.innerHTML = '<p class="cargando-opciones">No hay servicios registrados.</p>';
        return;
    }

    grid.innerHTML = servicios.map(s => {
        const activo = Number(s.Estado) === 1;
        const costo = Number(s.Costo || 0);
        const precioTexto = costo > 0 ? `$${costo.toLocaleString('es-CO')}` : 'Incluido';
        return `
        <div class="servicio-estado-card ${activo ? 'activo' : 'inactivo'}">
            <span class="servicio-estado-nombre">${escaparHtml(s.NombreServicio || '')}</span>
            <span class="servicio-estado-desc">${escaparHtml(s.Descripcion || '')}</span>
            <span class="servicio-estado-precio">${precioTexto}</span>
            <button type="button"
                class="btn-toggle-estado-servicio ${activo ? 'activo' : 'inactivo'}"
                data-id="${s.IDServicio}" data-estado="${s.Estado}">
                <i class="fa-solid ${activo ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                ${activo ? 'Activo' : 'Inactivo'}
            </button>
        </div>`;
    }).join('');

    grid.querySelectorAll('.btn-toggle-estado-servicio').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const estadoActual = Number(btn.dataset.estado);
            btn.disabled = true;
            await toggleEstadoServicioAdmin(id, estadoActual);
        });
    });
}

async function toggleEstadoServicioAdmin(id, estadoActual) {
    try {
        const nuevoEstado = estadoActual === 1 ? 0 : 1;
        await toggleEstadoServicio(id, nuevoEstado);
        const servicios = await obtenerServicios();
        renderServiciosEstadoAdmin(servicios);
    } catch (err) {
        console.error('Error al cambiar estado del servicio:', err.message);
    }
}

async function toggleEstadoPaqueteAdmin(id, estadoActual) {
    const paquete = paquetesCargados.find(p => String(p.IDPaquete) === String(id));
    if (!paquete) return;
    try {
        await actualizarPaquete(id, {
            NombrePaquete: paquete.NombrePaquete,
            Descripcion: paquete.Descripcion,
            IDHabitacion: paquete.IDHabitacion,
            IDServicio: paquete.IDServicio,
            Precio: paquete.Precio,
            Estado: estadoActual === 1 ? 0 : 1,
            IDCliente: paquete.IDCliente || null,
            ImagenURL: paquete.ImagenURL || null
        });
        await cargarPaquetesAdmin();
    } catch (err) {
        console.error('Error al cambiar estado del paquete:', err.message);
    }
}

function abrirModalPaqueteAdmin(paquete = null) {
    const modal = document.getElementById('modal-paquete-admin');
    const titulo = document.getElementById('paquete-admin-form-title');
    if (!modal) return;

    limpiarFormularioPaqueteAdmin();
    cargarSelectsPaquete(paquete);

    if (paquete) {
        if (titulo) titulo.textContent = 'Editar paquete';
        document.getElementById('paquete-admin-id').value = paquete.IDPaquete || '';
        document.getElementById('paquete-admin-nombre').value = paquete.NombrePaquete || '';
        document.getElementById('paquete-admin-descripcion').value = paquete.Descripcion || '';
        document.getElementById('paquete-admin-precio').value = paquete.Precio || '';
        document.getElementById('paquete-admin-estado').value = paquete.Estado ?? 1;
        const imgField = document.getElementById('paquete-admin-imagen-url');
        if (imgField) imgField.value = paquete.ImagenURL || '';
    } else {
        if (titulo) titulo.textContent = 'Nuevo paquete';
    }

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

async function cargarSelectsPaquete(paquete = null) {
    const [habitaciones, servicios, clientes] = await Promise.all([
        obtenerHabitaciones(),
        obtenerServicios(),
        obtenerClientes()
    ]);

    const selectHab = document.getElementById('paquete-admin-habitacion');
    if (selectHab) {
        selectHab.innerHTML = '<option value="">-- Selecciona habitación --</option>' +
            habitaciones.map(h => `<option value="${h.IDHabitacion}">${escaparHtml(h.NombreHabitacion || '')}</option>`).join('');
        if (paquete?.IDHabitacion) selectHab.value = paquete.IDHabitacion;
    }

    const selectServ = document.getElementById('paquete-admin-servicio');
    if (selectServ) {
        selectServ.innerHTML = '<option value="">-- Selecciona servicio --</option>' +
            servicios.map(s => `<option value="${s.IDServicio}">${escaparHtml(s.NombreServicio || '')}</option>`).join('');
        if (paquete?.IDServicio) selectServ.value = paquete.IDServicio;
    }

    const selectCli = document.getElementById('paquete-admin-cliente');
    if (selectCli) {
        selectCli.innerHTML = '<option value="">-- Sin cliente asignado --</option>' +
            clientes.map(c => `<option value="${c.IDCliente}">${escaparHtml(`${c.Nombre || ''} ${c.Apellido || ''}`.trim())} — ${escaparHtml(c.NroDocumento || '')}</option>`).join('');
        if (paquete?.IDCliente) selectCli.value = paquete.IDCliente;
    }
}

function cerrarModalPaqueteAdmin() {
    const modal = document.getElementById('modal-paquete-admin');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

function limpiarFormularioPaqueteAdmin() {
    const form = document.getElementById('form-paquete-admin');
    if (form) form.reset();
    const idField = document.getElementById('paquete-admin-id');
    if (idField) idField.value = '';
    const mensaje = document.getElementById('mensaje-paquete-admin-modal');
    if (mensaje) mensaje.textContent = '';
}

async function guardarPaqueteAdmin(e) {
    e.preventDefault();
    const mensajeEl = document.getElementById('mensaje-paquete-admin-modal');
    const id = document.getElementById('paquete-admin-id')?.value;

    const nombre = document.getElementById('paquete-admin-nombre')?.value?.trim();
    const idHabitacion = document.getElementById('paquete-admin-habitacion')?.value;
    const idServicio = document.getElementById('paquete-admin-servicio')?.value;
    const precio = document.getElementById('paquete-admin-precio')?.value;

    if (!nombre || !idHabitacion || !idServicio || !precio) {
        if (mensajeEl) { mensajeEl.textContent = 'Nombre, habitación, servicio y precio son obligatorios.'; mensajeEl.className = 'crud-paquetes-mensaje error'; }
        return;
    }

    const payload = {
        NombrePaquete: nombre,
        Descripcion: document.getElementById('paquete-admin-descripcion')?.value?.trim() || '',
        IDHabitacion: Number(idHabitacion),
        IDServicio: Number(idServicio),
        Precio: Number(precio),
        Estado: Number(document.getElementById('paquete-admin-estado')?.value ?? 1),
        IDCliente: document.getElementById('paquete-admin-cliente')?.value || null,
        ImagenURL: document.getElementById('paquete-admin-imagen-url')?.value?.trim() || null
    };

    const btnGuardar = document.getElementById('btn-paquete-admin-guardar');
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Guardando...'; }

    try {
        if (id) {
            await actualizarPaquete(id, payload);
            if (mensajeEl) { mensajeEl.textContent = 'Paquete actualizado correctamente.'; mensajeEl.className = 'crud-paquetes-mensaje exito'; }
            if (typeof showSuccess === 'function') showSuccess(`"${nombre}" actualizado correctamente.`, 'Paquete editado');
        } else {
            await crearPaquete(payload);
            if (mensajeEl) { mensajeEl.textContent = 'Paquete creado correctamente.'; mensajeEl.className = 'crud-paquetes-mensaje exito'; }
            if (typeof showSuccess === 'function') showSuccess(`"${nombre}" creado correctamente.`, 'Paquete creado');
        }
        await cargarPaquetesAdmin();
        setTimeout(cerrarModalPaqueteAdmin, 900);
    } catch (err) {
        if (mensajeEl) { mensajeEl.textContent = err.message || 'Error al guardar el paquete.'; mensajeEl.className = 'crud-paquetes-mensaje error'; }
        if (typeof showError === 'function') showError(err.message || 'No se pudo guardar el paquete.', 'Error');
    } finally {
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Guardar paquete'; }
    }
}

async function eliminarPaqueteAdmin(id) {
    if (!await confirmarAccion('¿Eliminar este paquete? Esta acción no se puede deshacer.', 'Eliminar paquete')) return;
    try {
        await eliminarPaquete(id);
        if (typeof showSuccess === 'function') showSuccess('Paquete eliminado', 'Operación exitosa');
        await cargarPaquetesAdmin();
    } catch (err) {
        if (typeof showError === 'function') showError(err.message || 'Error al eliminar el paquete', 'Error');
    }
}

function configurarCRUDPaquetes() {
    const btnNuevo = document.getElementById('btn-nuevo-paquete-admin');
    if (btnNuevo && !btnNuevo.dataset.inicializado) {
        btnNuevo.addEventListener('click', () => abrirModalPaqueteAdmin());
        btnNuevo.dataset.inicializado = 'true';
    }

    const btnCerrarModal = document.getElementById('btn-cerrar-modal-paquete');
    if (btnCerrarModal && !btnCerrarModal.dataset.inicializado) {
        btnCerrarModal.addEventListener('click', cerrarModalPaqueteAdmin);
        btnCerrarModal.dataset.inicializado = 'true';
    }

    const modal = document.getElementById('modal-paquete-admin');
    if (modal && !modal.dataset.inicializado) {
        modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModalPaqueteAdmin(); });
        modal.dataset.inicializado = 'true';
    }

    const form = document.getElementById('form-paquete-admin');
    if (form && !form.dataset.inicializado) {
        form.addEventListener('submit', guardarPaqueteAdmin);
        form.dataset.inicializado = 'true';
    }

    const btnLimpiar = document.getElementById('btn-paquete-admin-limpiar');
    if (btnLimpiar && !btnLimpiar.dataset.inicializado) {
        btnLimpiar.addEventListener('click', limpiarFormularioPaqueteAdmin);
        btnLimpiar.dataset.inicializado = 'true';
    }

    const tabla = document.getElementById('paquetes-admin-tbody');
    if (tabla && !tabla.dataset.inicializado) {
        tabla.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-accion-paquete]');
            if (!btn) return;
            const accion = btn.dataset.accionPaquete;
            const id = btn.dataset.id;
            const paquete = paquetesCargados.find(p => String(p.IDPaquete) === String(id));

            if ((accion === 'ver' || accion === 'editar') && paquete) abrirModalPaqueteAdmin(paquete);
            if (accion === 'eliminar') await eliminarPaqueteAdmin(id);
        });
        tabla.addEventListener('change', async (e) => {
            const chk = e.target.closest('input[data-accion-paquete="toggle-estado"]');
            if (!chk) return;
            await toggleEstadoPaqueteAdmin(chk.dataset.id, Number(chk.dataset.estado));
        });
        tabla.dataset.inicializado = 'true';
    }

    const busqueda = document.getElementById('busqueda-paquetes-admin');
    if (busqueda && !busqueda.dataset.inicializado) {
        busqueda.addEventListener('input', () => {
            resetPagination('paquetesAdmin');
            renderTablaPaquetesAdmin(paquetesCargados);
        });
        busqueda.dataset.inicializado = 'true';
    }

    const filtroEstado = document.getElementById('filtro-estado-paquetes-admin');
    if (filtroEstado && !filtroEstado.dataset.inicializado) {
        filtroEstado.addEventListener('change', () => {
            resetPagination('paquetesAdmin');
            renderTablaPaquetesAdmin(paquetesCargados);
        });
        filtroEstado.dataset.inicializado = 'true';
    }
}
