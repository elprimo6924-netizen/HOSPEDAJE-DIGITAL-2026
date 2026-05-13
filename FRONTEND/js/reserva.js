/**
 * reserva.js
 * Arquitectura modular para el formulario de Nueva Reserva
 */

const API_BASE = '/api'; // Ajustar segn el puerto si es necesario
const FORMATTER = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmt = val => FORMATTER.format(val || 0);

const State = {
    fechaInicio: null,
    fechaFin: null,
    modo: 'habitacion', // 'habitacion' | 'paquete'
    itemSeleccionado: null, // { id, nombre, precio, imagen, tipo }
    cliente: null,
    serviciosExtras: [], // [{ id, nombre, precio }]
    blockedDates: [],
    mesOffset: 0,
    descuento: 0,
    metodoPago: 1,
    estadoReserva: 1
};

// Utils: Fetch
async function fetchJson(endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (err) {
        console.error(err);
        return null;
    }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
const UI = {
    showToast(msg, type = 'info') {
        const t = document.createElement('div');
        t.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all transform translate-y-10 opacity-0 z-50 ${type === 'error' ? 'bg-red-600' : 'bg-green-800'}`;
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => {
            t.classList.remove('translate-y-10', 'opacity-0');
        });
        setTimeout(() => {
            t.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => t.remove(), 300);
        }, 3000);
    }
};

// ==========================================
// CALENDARIO PICKER
// ==========================================
const CalendarioPicker = {
    meses: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    
    init() {
        this.render();
        // Botones de navegacin
        document.getElementById('cal-prev').addEventListener('click', () => { State.mesOffset--; this.render(); });
        document.getElementById('cal-next').addEventListener('click', () => { State.mesOffset++; this.render(); });
    },

    isBlocked(d) {
        // TODO: Implementar validacin con State.blockedDates
        return false;
    },

    renderMes(año, mes, containerId) {
        const c = document.getElementById(containerId);
        if(!c) return;

        const primerDia = new Date(año, mes, 1).getDay();
        const diasMes = new Date(año, mes + 1, 0).getDate();
        const hoy = new Date();
        hoy.setHours(0,0,0,0);

        let html = `<div class="font-bold text-center mb-4 text-gray-800">${this.meses[mes]} ${año}</div>`;
        html += `<div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">`;
        ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].forEach(d => html += `<div>${d}</div>`);
        html += `</div><div class="grid grid-cols-7 gap-1 text-center" id="grid-${containerId}">`;

        for (let i = 0; i < primerDia; i++) html += `<div></div>`;

        for (let i = 1; i <= diasMes; i++) {
            const fechaActual = new Date(año, mes, i);
            const strFecha = `${año}-${String(mes+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const isPasado = fechaActual < hoy;
            const isBlocked = this.isBlocked(fechaActual);

            let clases = "w-9 h-9 rounded-full text-sm transition-colors cursor-pointer ";

            if (isPasado) {
                clases += "text-gray-300 cursor-not-allowed pointer-events-none";
            } else if (isBlocked) {
                clases += "bg-red-50 text-red-300 cursor-not-allowed pointer-events-none relative";
                html += `<div class="relative"><button type="button" class="${clases}" disabled>${i}</button><span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400"></span></div>`;
                continue;
            } else {
                clases += "hover:bg-amber-100 hover:text-amber-800 day-btn";
            }

            html += `<button type="button" data-date="${strFecha}" class="${clases}">${i}</button>`;
        }
        html += `</div>`;
        c.innerHTML = html;

        // Listeners
        c.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleClick(new Date(e.target.dataset.date + 'T00:00:00')));
            btn.addEventListener('mouseenter', (e) => this.handleHover(new Date(e.target.dataset.date + 'T00:00:00')));
        });
    },

    handleClick(fecha) {
        if (!State.fechaInicio || (State.fechaInicio && State.fechaFin)) {
            State.fechaInicio = fecha;
            State.fechaFin = null;
        } else if (fecha < State.fechaInicio) {
            State.fechaInicio = fecha;
        } else {
            State.fechaFin = fecha;
        }
        this.updateSelectionClasses();
        ResumenLateral.actualizar();
    },

    handleHover(fecha) {
        if (State.fechaInicio && !State.fechaFin) {
            this.updateSelectionClasses(fecha);
        }
    },

    updateSelectionClasses(hoverDate = null) {
        const btns = document.querySelectorAll('.day-btn');
        btns.forEach(btn => {
            const fd = new Date(btn.dataset.date + 'T00:00:00');
            btn.className = "w-9 h-9 rounded-full text-sm transition-colors cursor-pointer day-btn hover:bg-amber-100 hover:text-amber-800";
            
            const isStart = State.fechaInicio && fd.getTime() === State.fechaInicio.getTime();
            const isEnd = State.fechaFin && fd.getTime() === State.fechaFin.getTime();
            const inRange = State.fechaInicio && State.fechaFin && fd > State.fechaInicio && fd < State.fechaFin;
            const inHoverRange = State.fechaInicio && !State.fechaFin && hoverDate && fd > State.fechaInicio && fd <= hoverDate;

            if (isStart || isEnd) {
                btn.className = "w-9 h-9 rounded-full text-sm bg-green-800 text-white font-semibold day-btn";
            } else if (inRange || inHoverRange) {
                btn.className = "w-9 h-9 text-sm bg-amber-50 text-amber-900 day-btn";
            }
        });
    },

    render() {
        const baseDate = new Date();
        baseDate.setMonth(baseDate.getMonth() + State.mesOffset);
        
        const nextMonthDate = new Date(baseDate);
        nextMonthDate.setMonth(baseDate.getMonth() + 1);

        this.renderMes(baseDate.getFullYear(), baseDate.getMonth(), 'mes-actual');
        this.renderMes(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 'mes-siguiente');
        this.updateSelectionClasses();
    }
};

// ==========================================
// MODO RESERVA (TOGGLE HABITACIN / PAQUETE)
// ==========================================
const ModoReserva = {
    async init() {
        document.getElementById('btn-habitacion').addEventListener('click', () => this.setModo('habitacion'));
        document.getElementById('btn-paquete').addEventListener('click', () => this.setModo('paquete'));
        
        // Setup initial selects
        document.getElementById('select-habitacion').addEventListener('change', (e) => this.handleHabitacionChange(e.target));
        
        await this.setModo('habitacion');
    },

    async setModo(modo) {
        State.modo = modo;
        State.itemSeleccionado = null;
        State.serviciosExtras = []; // Reset extras
        
        const btnHab = document.getElementById('btn-habitacion');
        const btnPaq = document.getElementById('btn-paquete');
        
        if (modo === 'habitacion') {
            btnHab.className = "px-6 py-3 text-sm font-medium flex items-center gap-2 transition-all duration-200 bg-green-800 text-white";
            btnPaq.className = "px-6 py-3 text-sm font-medium flex items-center gap-2 transition-all duration-200 bg-white text-gray-500 hover:bg-gray-50";
            
            document.getElementById('seccion-habitacion').classList.remove('hidden');
            document.getElementById('seccion-paquetes').classList.add('hidden');
            document.getElementById('seccion-servicios-adicionales').classList.remove('hidden');
            
            await this.loadHabitaciones();
        } else {
            btnPaq.className = "px-6 py-3 text-sm font-medium flex items-center gap-2 transition-all duration-200 bg-green-800 text-white";
            btnHab.className = "px-6 py-3 text-sm font-medium flex items-center gap-2 transition-all duration-200 bg-white text-gray-500 hover:bg-gray-50";
            
            document.getElementById('seccion-paquetes').classList.remove('hidden');
            document.getElementById('seccion-habitacion').classList.add('hidden');
            document.getElementById('seccion-servicios-adicionales').classList.add('hidden');
            
            await this.loadPaquetes();
        }
        UI.showToast("Seleccin anterior eliminada", "info");
        ResumenLateral.actualizar();
        ServiciosAdicionales.render();
    },

    async loadHabitaciones() {
        const sel = document.getElementById('select-habitacion');
        sel.innerHTML = '<option value="">Cargando habitaciones...</option>';
        const data = await fetchJson('/habitaciones');
        if (!data) return;
        
        sel.innerHTML = '<option value="">— Selecciona una habitacin —</option>';
        data.filter(h => h.Estado === 1).forEach(h => {
            const opt = document.createElement('option');
            opt.value = h.IDHabitacion;
            opt.dataset.precio = h.Costo;
            opt.dataset.nombre = h.NombreHabitacion;
            opt.textContent = `${h.NombreHabitacion} — ${fmt(h.Costo)}/noche`;
            sel.appendChild(opt);
        });
    },

    handleHabitacionChange(selectEl) {
        const opt = selectEl.options[selectEl.selectedIndex];
        if (opt.value) {
            State.itemSeleccionado = {
                id: opt.value,
                nombre: opt.dataset.nombre,
                precio: Number(opt.dataset.precio),
                tipo: 'habitacion'
            };
        } else {
            State.itemSeleccionado = null;
        }
        ResumenLateral.actualizar();
    },

    async loadPaquetes() {
        const grid = document.getElementById('grid-paquetes');
        grid.innerHTML = '<p class="text-gray-500">Cargando paquetes...</p>';
        const data = await fetchJson('/paquetes');
        if (!data) return;

        grid.innerHTML = '';
        data.filter(p => p.Estado === 1).forEach(p => {
            const div = document.createElement('div');
            div.className = "border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-amber-400 hover:shadow-md bg-white paquete-card";
            div.dataset.id = p.IDPaquete;
            div.onclick = () => this.selectPaquete(div, p);

            div.innerHTML = `
              <img src="/img/${p.ImagenPaquete}" class="w-full h-32 object-cover rounded-xl mb-3 bg-gray-100" onerror="this.style.display='none'">
              <h3 class="font-semibold text-green-900">${p.NombrePaquete}</h3>
              <p class="text-xs text-gray-500 mb-2 truncate">${p.Descripcion || 'Sin descripcin'}</p>
              <div class="flex items-center justify-between mt-3">
                <span class="text-lg font-bold text-green-800">${fmt(p.Precio)}</span>
              </div>
            `;
            grid.appendChild(div);
        });
    },

    selectPaquete(cardEl, data) {
        document.querySelectorAll('.paquete-card').forEach(c => c.className = "border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-amber-400 hover:shadow-md bg-white paquete-card");
        cardEl.className = "border-green-700 bg-green-50 ring-2 ring-green-700 rounded-2xl p-5 cursor-pointer transition-all duration-200 paquete-card";
        
        State.itemSeleccionado = {
            id: data.IDPaquete,
            nombre: data.NombrePaquete,
            precio: Number(data.Precio),
            imagen: `/img/${data.ImagenPaquete}`,
            tipo: 'paquete'
        };
        ResumenLateral.actualizar();
    }
};

// ==========================================
// BUSCADOR DE CLIENTES
// ==========================================
const BuscadorCliente = {
    clientes: [],
    timeout: null,

    async init() {
        const input = document.getElementById('buscador-cliente');
        const dropdown = document.getElementById('dropdown-clientes');

        input.addEventListener('input', (e) => {
            clearTimeout(this.timeout);
            const val = e.target.value.trim().toLowerCase();
            if (val.length < 2) {
                dropdown.classList.add('hidden');
                return;
            }
            this.timeout = setTimeout(() => this.buscar(val), 300);
        });
    },

    async buscar(termino) {
        if (this.clientes.length === 0) {
            const data = await fetchJson('/clientes');
            if (data) this.clientes = data;
        }

        const res = this.clientes.filter(c => 
            String(c.NroDocumento || '').toLowerCase().includes(termino) ||
            String(c.Nombre || '').toLowerCase().includes(termino) ||
            String(c.Apellido || '').toLowerCase().includes(termino)
        ).slice(0, 5);

        this.renderDropdown(res, termino);
    },

    renderDropdown(resultados, termino) {
        const dropdown = document.getElementById('dropdown-clientes');
        if (resultados.length === 0) {
            dropdown.innerHTML = `<div class="p-4 text-sm text-gray-500 text-center">No se encontraron clientes. <button type="button" class="text-green-700 font-semibold underline ml-1">Crear nuevo</button></div>`;
            dropdown.classList.remove('hidden');
            return;
        }

        let html = '';
        resultados.forEach(c => {
            html += `<div class="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 transition-colors" onclick="BuscadorCliente.seleccionar('${c.NroDocumento}', '${c.Nombre} ${c.Apellido}')">
                <p class="font-medium text-gray-900">${c.Nombre} ${c.Apellido}</p>
                <p class="text-xs text-gray-500">Documento: ${c.NroDocumento}</p>
            </div>`;
        });
        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');
    },

    seleccionar(doc, nombre) {
        State.cliente = { documento: doc, nombre: nombre };
        document.getElementById('dropdown-clientes').classList.add('hidden');
        document.getElementById('buscador-cliente').value = '';
        document.getElementById('buscador-cliente').classList.add('hidden');
        
        const card = document.getElementById('cliente-seleccionado');
        card.classList.remove('hidden');
        const iniciales = nombre.substring(0, 2).toUpperCase();
        
        card.innerHTML = `
          <div class="w-10 h-10 rounded-full bg-green-800 text-white flex items-center justify-center font-semibold text-sm">
            ${iniciales}
          </div>
          <div>
            <p class="font-medium text-green-900">${nombre}</p>
            <p class="text-xs text-gray-500">CC ${doc}</p>
          </div>
          <button type="button" onclick="BuscadorCliente.limpiar()" class="ml-auto text-xs text-gray-400 hover:text-red-500 underline transition-colors">
            Cambiar
          </button>
        `;
    },

    limpiar() {
        State.cliente = null;
        document.getElementById('cliente-seleccionado').classList.add('hidden');
        document.getElementById('buscador-cliente').classList.remove('hidden');
        document.getElementById('buscador-cliente').focus();
    }
};

// ==========================================
// SERVICIOS ADICIONALES
// ==========================================
const ServiciosAdicionales = {
    async render() {
        const c = document.getElementById('servicios-container');
        if(State.modo !== 'habitacion') {
            c.innerHTML = '';
            return;
        }

        c.innerHTML = '<p class="text-gray-500 text-sm">Cargando servicios...</p>';
        const data = await fetchJson('/servicios');
        if(!data) return;

        c.innerHTML = '';
        data.filter(s => s.Estado === 1).forEach(s => {
            const lbl = document.createElement('label');
            lbl.className = "flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group bg-white";
            lbl.innerHTML = `
                <div class="flex items-center gap-3">
                  <input type="checkbox" class="accent-green-700 w-4 h-4" data-id="${s.IDServicio}" data-precio="${s.Costo}" data-nombre="${s.NombreServicio}" onchange="ServiciosAdicionales.toggle(this)">
                  <span class="text-sm text-gray-700 group-hover:text-gray-900">${s.NombreServicio}</span>
                </div>
                <span class="text-sm font-medium text-green-800">+${fmt(s.Costo)}</span>
            `;
            c.appendChild(lbl);
        });
    },

    toggle(chk) {
        const id = chk.dataset.id;
        if (chk.checked) {
            State.serviciosExtras.push({ id, nombre: chk.dataset.nombre, precio: Number(chk.dataset.precio) });
        } else {
            State.serviciosExtras = State.serviciosExtras.filter(s => s.id !== id);
        }
        ResumenLateral.actualizar();
    }
};

// ==========================================
// RESUMEN LATERAL
// ==========================================
const ResumenLateral = {
    actualizar() {
        // Calcular das
        let noches = 0;
        if (State.fechaInicio && State.fechaFin) {
            noches = Math.round((State.fechaFin - State.fechaInicio) / 86400000);
        }

        // Base y Ttulo
        const titleEl = document.getElementById('resumen-title');
        const imgWrap = document.getElementById('resumen-img-wrap');
        const imgEl = document.getElementById('resumen-img');
        const fechasEl = document.getElementById('resumen-fechas');
        
        let precioBase = 0;
        if (State.itemSeleccionado) {
            titleEl.textContent = State.itemSeleccionado.nombre;
            if (State.modo === 'habitacion') {
                precioBase = State.itemSeleccionado.precio * Math.max(1, noches);
                imgWrap.classList.add('hidden');
            } else {
                precioBase = State.itemSeleccionado.precio;
                if (State.itemSeleccionado.imagen) {
                    imgEl.src = State.itemSeleccionado.imagen;
                    imgWrap.classList.remove('hidden');
                }
            }
        } else {
            titleEl.textContent = 'Sin seleccin';
            imgWrap.classList.add('hidden');
        }

        if (State.fechaInicio) {
            fechasEl.textContent = `${State.fechaInicio.toLocaleDateString()}  ${State.fechaFin ? State.fechaFin.toLocaleDateString() : '?'}  ${noches} noche(s)`;
        } else {
            fechasEl.textContent = 'Fechas no seleccionadas';
        }

        // Servicios extras
        const costoServicios = State.serviciosExtras.reduce((acc, s) => acc + s.precio, 0);

        // Subtotal y Descuento
        const subtotalBruto = precioBase + costoServicios;
        const descInput = document.getElementById('descuento');
        const descuento = Number(descInput ? descInput.value : 0);
        State.descuento = descuento;

        const subtotal = subtotalBruto - descuento;
        const iva = Math.max(0, subtotal * 0.19);
        const total = Math.max(0, subtotal + iva);

        // Update DOM
        document.getElementById('resumen-habitacion').textContent = fmt(precioBase);
        document.getElementById('resumen-servicios').textContent = fmt(costoServicios);
        document.getElementById('resumen-descuento').textContent = `-${fmt(descuento)}`;
        document.getElementById('resumen-subtotal').textContent = fmt(subtotal);
        document.getElementById('resumen-iva').textContent = fmt(iva);
        document.getElementById('resumen-total').textContent = fmt(total);
    }
};

// ==========================================
// GUARDAR RESERVA
// ==========================================
const FormValidator = {
    validar() {
        if (!State.fechaInicio || !State.fechaFin) {
            UI.showToast("Selecciona las fechas de estancia completas", "error");
            return false;
        }
        if (!State.itemSeleccionado) {
            UI.showToast(`Selecciona un ${State.modo === 'habitacion' ? 'habitación' : 'paquete'}`, "error");
            return false;
        }
        if (!State.cliente) {
            UI.showToast("Debes seleccionar un cliente", "error");
            return false;
        }
        return true;
    }
};

const ReservaForm = {
    init() {
        CalendarioPicker.init();
        ModoReserva.init();
        BuscadorCliente.init();
        
        document.getElementById('descuento')?.addEventListener('input', () => ResumenLateral.actualizar());
        
        document.getElementById('btn-confirmar-reserva')?.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!FormValidator.validar()) return;
            
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Procesando...';

            const payload = {
                NroDocumentoCliente: State.cliente.documento,
                FechaInicio: State.fechaInicio.toISOString().split('T')[0],
                FechaFinalizacion: State.fechaFin.toISOString().split('T')[0],
                MetodoPago: document.getElementById('metodo-pago').value,
                IdEstadoReserva: document.getElementById('estado-reserva').value,
                Descuento: State.descuento,
                // Logica condicional para IDs
                IDHabitacion: State.modo === 'habitacion' ? State.itemSeleccionado.id : null,
                paquetesIds: State.modo === 'paquete' ? [State.itemSeleccionado.id] : [],
                serviciosIds: State.serviciosExtras.map(s => s.id)
            };

            try {
                const res = await fetch(`${API_BASE}/reservas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    UI.showToast("Reserva confirmada con xito", "success");
                    setTimeout(() => window.location.href = 'reservas.html', 1500);
                } else {
                    const err = await res.json();
                    UI.showToast(err.message || "Error al guardar la reserva", "error");
                    btn.disabled = false;
                    btn.textContent = 'Confirmar Reserva';
                }
            } catch (error) {
                UI.showToast("Error de conexión", "error");
                btn.disabled = false;
                btn.textContent = 'Confirmar Reserva';
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ReservaForm.init();
});
