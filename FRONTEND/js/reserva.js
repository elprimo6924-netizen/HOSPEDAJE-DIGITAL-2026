/**
 * reserva.js
 * Arquitectura modular para el formulario de Nueva Reserva
 */

const API_BASE = '/api'; // Ajustar según el puerto si es necesario
const FORMATTER = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmt = val => FORMATTER.format(val || 0);

const State = {
    fechaInicio: null,
    fechaFin: null,
    modo: 'habitacion', // 'habitacion' | 'paquete'
    itemSeleccionado: null, // { id, nombre, precio, imagen, tipo }
    cliente: null,
    serviciosExtras: [], // [{ id, nombre, precio, cantidad, hora }]
    blockedDates: [],
    mesOffset: 0,
    descuento: 0,
    metodoPago: 1,
    estadoReserva: 1
};

// Utils: Fetch — delegates to requestJson from api.js (absolute URL + Bearer token)
async function fetchJson(endpoint) {
    try {
        return await requestJson(endpoint);
    } catch (err) {
        console.error('[reserva.js fetchJson]', err);
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
        if (!State.blockedDates.length) return false;
        return State.blockedDates.some(r => {
            const inicio = new Date(r.FechaInicio + 'T00:00:00');
            const fin    = new Date(r.FechaFinalizacion + 'T00:00:00');
            return d >= inicio && d <= fin;
        });
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
        html += `</div><div class="grid grid-cols-7 gap-1 justify-items-center" id="grid-${containerId}">`;

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
        UI.showToast("Selección anterior eliminada", "info");
        ResumenLateral.actualizar();
        ServiciosAdicionales.render();
    },

    async loadHabitaciones() {
        const sel = document.getElementById('select-habitacion');
        sel.innerHTML = '<option value="">Cargando habitaciones...</option>';
        const data = await fetchJson('/habitaciones');
        if (!data) return;
        
        sel.innerHTML = '<option value="">— Selecciona una habitación —</option>';
        data.filter(h => h.Estado == 1).forEach(h => {
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
            this.loadBlockedDates({ IDHabitacion: opt.value });
        } else {
            State.itemSeleccionado = null;
            State.blockedDates = [];
            CalendarioPicker.render();
        }
        ResumenLateral.actualizar();
    },

    async loadBlockedDates({ IDHabitacion, IDPaquete } = {}) {
        const param = IDHabitacion
            ? `IDHabitacion=${IDHabitacion}`
            : `IDPaquete=${IDPaquete}`;
        const data = await fetchJson(`/reservas/disponibilidad?${param}`);
        State.blockedDates = Array.isArray(data) ? data : [];
        CalendarioPicker.render();
    },

    async loadPaquetes() {
        const grid = document.getElementById('grid-paquetes');
        grid.innerHTML = '<p class="text-gray-500">Cargando paquetes...</p>';
        const data = await fetchJson('/paquetes');
        if (!data) return;

        grid.innerHTML = '';
        data.filter(p => p.Estado == 1).forEach(p => {
            const div = document.createElement('div');
            div.className = "border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-amber-400 hover:shadow-md bg-white paquete-card";
            div.dataset.id = p.IDPaquete;
            div.onclick = () => this.selectPaquete(div, p);

            const extraInfo = [
                p.NombreHabitacion ? `<div class="flex items-center gap-1.5 mt-1 text-xs text-slate-500"><i class="fa-solid fa-bed text-green-600 text-[10px]"></i><span>${p.NombreHabitacion}</span></div>` : '',
                p.NombreServicio   ? `<div class="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500"><i class="fa-solid fa-bell-concierge text-amber-500 text-[10px]"></i><span>Incluye: ${p.NombreServicio}</span></div>` : '',
            ].join('');

            div.innerHTML = `
              <img src="/img/${p.ImagenPaquete}" class="w-full h-32 object-cover rounded-xl mb-3 bg-gray-100" onerror="this.style.display='none'">
              <h3 class="font-semibold text-green-900">${p.NombrePaquete}</h3>
              <div class="paquete-desc overflow-hidden transition-all duration-300 max-h-0 opacity-0">
                  <p class="text-xs text-gray-600 mt-1 mb-1.5 leading-relaxed">${p.Descripcion || 'Sin descripción'}</p>
                  ${extraInfo}
              </div>
              <div class="flex items-center justify-between mt-3">
                <span class="text-lg font-bold text-green-800">${fmt(p.Precio)}</span>
                <span class="paq-sel-hint text-xs text-gray-400 italic">Clic para seleccionar</span>
              </div>
            `;
            grid.appendChild(div);
        });
    },

    selectPaquete(cardEl, data) {
        document.querySelectorAll('.paquete-card').forEach(c => {
            c.className = "border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-amber-400 hover:shadow-md bg-white paquete-card";
            const desc = c.querySelector('.paquete-desc');
            if (desc) { desc.classList.remove('max-h-56', 'opacity-100'); desc.classList.add('max-h-0', 'opacity-0'); }
            const hint = c.querySelector('.paq-sel-hint');
            if (hint) hint.textContent = 'Clic para seleccionar';
        });

        cardEl.className = "border-green-700 bg-green-50 ring-2 ring-green-700 rounded-2xl p-5 cursor-pointer transition-all duration-200 paquete-card shadow-md";
        const desc = cardEl.querySelector('.paquete-desc');
        if (desc) { desc.classList.remove('max-h-0', 'opacity-0'); desc.classList.add('max-h-56', 'opacity-100'); }
        const hint = cardEl.querySelector('.paq-sel-hint');
        if (hint) hint.textContent = '✓ Seleccionado';

        State.itemSeleccionado = {
            id: data.IDPaquete,
            nombre: data.NombrePaquete,
            precio: Number(data.Precio),
            imagen: data.ImagenPaquete ? `/img/${data.ImagenPaquete}` : null,
            habitacion: data.NombreHabitacion || null,
            servicio: data.NombreServicio || null,
            tipo: 'paquete'
        };
        // Cargar fechas bloqueadas para la habitación del paquete
        this.loadBlockedDates({ IDPaquete: data.IDPaquete });
        ResumenLateral.actualizar();
    }
};

// ==========================================
// BUSCADOR DE CLIENTES
// ==========================================
const BuscadorCliente = {
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

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    },

    async buscar(termino) {
        try {
            const data = await fetchJson(`/clientes/search?q=${encodeURIComponent(termino)}`);
            this.renderDropdown(Array.isArray(data) ? data : [], termino);
        } catch (e) {
            console.warn('[BuscadorCliente] Error buscando:', e.message);
            this.renderDropdown([], termino);
        }
    },

    renderDropdown(resultados, termino) {
        const dropdown = document.getElementById('dropdown-clientes');
        if (resultados.length === 0) {
            dropdown.innerHTML = `<div class="p-4 text-sm text-gray-500 text-center">No se encontraron clientes</div>`;
            dropdown.classList.remove('hidden');
            return;
        }

        const esc = s => String(s || '').replace(/'/g, "\\'");
        let html = '';
        resultados.forEach(c => {
            const doc   = esc(c.documento);
            const nom   = esc(c.Nombre);
            const ape   = esc(c.Apellido);
            const email = c.Email || '';
            html += `<div class="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 transition-colors" onclick="BuscadorCliente.seleccionar('${doc}', '${nom} ${ape}')">
                <p class="font-medium text-gray-900">${c.Nombre} ${c.Apellido}</p>
                <p class="text-xs text-gray-500">${c.TipoDocumento || 'CC'}: ${c.documento} · ${email}</p>
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
const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const HORA_CHIP = "py-1 text-[11px] font-semibold border border-stone-200 rounded-lg text-stone-600 bg-white";

const IMAGENES_SERVICIOS = {
    "Spa y Masajes": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80",
    "Restaurante": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
    "Piscina": "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=400&q=80",
    "WiFi": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
    "WiFi Premium": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
    "Gimnasio": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
    "Servicio a la Habitación": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80",
    "Servicio a la Habitacion": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80",
    "Room Service": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80",
    "Tour Guiado": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",
    "Lavandería": "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&q=80",
    "Lavanderia": "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&q=80",
    "Transporte": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80",
    "Bar y Cocktails": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80",
    "Bar y Cocteles": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80",
    "Bar & Cocktails": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80",
    "default": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80"
};

const getImagenServicio = (nombre = "") => IMAGENES_SERVICIOS[nombre] || IMAGENES_SERVICIOS.default;

const SERVICIOS_META = [
    {
        key: "spa",
        match: ["spa", "masaje"],
        icono: "🧖",
        descripcion: "Ritual termal guiado para renovar energia y equilibrio.",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
        horarios: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
    },
    {
        key: "restaurante",
        match: ["restaurante"],
        icono: "🍽️",
        descripcion: "Cocina de autor con productos locales y maridajes.",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        horarios: ["07:00", "08:00", "12:00", "13:00", "19:00", "20:00", "21:00"],
    },
    {
        key: "piscina",
        match: ["piscina"],
        icono: "🏊",
        descripcion: "Piscina climatizada con zona lounge y reposo.",
        dias: ["Lu", "Mi", "Vi", "Sa", "Do"],
        horarios: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    },
    {
        key: "wifi",
        match: ["wifi"],
        icono: "📶",
        descripcion: "Conexion segura de alta velocidad en todo el hotel.",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        horarios: [],
    },
    {
        key: "gimnasio",
        match: ["gimnasio"],
        icono: "🏋️",
        descripcion: "Sala fitness equipada y asistencia profesional.",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
        horarios: ["06:00", "07:00", "08:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
    },
    {
        key: "habitacion",
        match: ["habitacion", "room"],
        icono: "🛎️",
        descripcion: "Atencion 24/7 con montaje personalizado en tu suite.",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        horarios: ["07:00", "08:00", "12:00", "13:00", "19:00", "20:00", "21:00", "22:00"],
    },
    {
        key: "tour",
        match: ["tour"],
        icono: "🗺️",
        descripcion: "Rutas curadas por expertos en cultura y naturaleza.",
        dias: ["Ma", "Ju", "Sa", "Do"],
        horarios: ["08:00", "10:00", "14:00", "16:00"],
    },
    {
        key: "lavanderia",
        match: ["lavanderia", "lavanderia"],
        icono: "👔",
        descripcion: "Cuidado premium con entrega express en 24 horas.",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi"],
        horarios: ["08:00", "09:00", "10:00", "11:00"],
    },
    {
        key: "transporte",
        match: ["transporte"],
        icono: "🚗",
        descripcion: "Traslados puntuales con chofer certificado.",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        horarios: ["05:00", "06:00", "07:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
    },
    {
        key: "bar",
        match: ["bar", "cocktail"],
        icono: "🍹",
        descripcion: "Mixologia de autor con destilados selectos.",
        dias: ["Mi", "Ju", "Vi", "Sa"],
        horarios: ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
    },
];

const getServicioMeta = (nombre = "") => {
    const norm = nombre.toLowerCase();
    const meta = SERVICIOS_META.find((item) => item.match.some((m) => norm.includes(m)));
    return meta || {
        key: "servicio",
        icono: "✨",
        descripcion: "Servicio premium con atencion dedicada.",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        horarios: [],
    };
};

const ServiciosAdicionales = {
    async render() {
        const c = document.getElementById('servicios-container');
        if (State.modo !== 'habitacion') { c.innerHTML = ''; return; }

        c.innerHTML = '<p class="text-gray-500 text-sm">Cargando servicios...</p>';
        const data = await fetchJson('/servicios');
        if (!data) return;

        c.innerHTML = '';
        data.filter(s => s.Estado == 1).forEach(s => {
            const meta = getServicioMeta(s.NombreServicio || '');
            const diasSet = new Set(meta.dias || []);
            const diasHtml = DIAS_SEMANA.map((d) => {
                const activo = diasSet.has(d);
                const base = activo
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-stone-100 text-stone-400 border-stone-200 line-through';
                return `<span class="px-1.5 py-0.5 text-[10px] font-bold rounded-md border ${base}">${d}</span>`;
            }).join('');

            const horarios = Array.isArray(meta.horarios) ? meta.horarios : [];
            const horariosHtml = horarios.length
                ? horarios.map((h) => `<span class="${HORA_CHIP}">${h}</span>`).join('')
                : `<span class="text-xs text-stone-500">Disponible todo el dia</span>`;

            const div = document.createElement('div');
            div.className = "svc-item-wrapper relative flex flex-col gap-3 p-4 bg-white border-2 border-stone-200 rounded-2xl cursor-pointer hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-250 group";
            div.innerHTML = `
                <div class="w-full h-28 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
                    <img src="${getImagenServicio(s.NombreServicio)}" alt="${s.NombreServicio}" loading="lazy"
                         class="w-full h-full object-cover"
                         onerror="this.parentElement.style.background='#e2e8f0';this.remove()">
                </div>
                <div class="flex items-start gap-3">
                    <div class="relative mt-0.5 shrink-0">
                        <input type="checkbox" class="peer sr-only"
                               id="svc-${s.IDServicio}" data-id="${s.IDServicio}"
                               data-precio="${s.Costo}" data-nombre="${s.NombreServicio}"
                               data-hora-fija="${horarios[0] || ''}"
                               onchange="ServiciosAdicionales.toggle(this)">
                        <label for="svc-${s.IDServicio}" class="w-5 h-5 flex items-center justify-center border-2 border-stone-300 rounded-md peer-checked:bg-amber-500 peer-checked:border-amber-500 cursor-pointer transition-all duration-200 hover:border-amber-400">
                            <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                        </label>
                    </div>
                    <span class="text-2xl leading-none mt-0.5 group-hover:scale-110 transition-transform duration-200">${meta.icono}</span>
                    <div class="flex flex-col min-w-0">
                        <span class="text-sm font-bold text-stone-800 leading-tight whitespace-nowrap">${s.NombreServicio}</span>
                        <span class="text-xs text-stone-500 leading-tight mt-0.5">${meta.descripcion}</span>
                    </div>
                </div>

                <div class="flex items-center justify-between px-0.5">
                    <span class="text-xs text-stone-400 font-medium">Por persona</span>
                    <span class="text-base font-black text-amber-600">+${fmt(s.Costo)}</span>
                </div>

                <div class="svc-cantidad-wrap hidden flex flex-col gap-2 border-t border-amber-200 pt-3 mt-1" data-svc-id="${s.IDServicio}">
                    <div class="flex items-center gap-1.5">
                        <span class="text-base">👥</span>
                        <span class="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Cantidad de personas</span>
                    </div>

                    <div class="flex items-center gap-2">
                        <button type="button"
                            onclick="ServiciosAdicionales.cambiarCantidad('${s.IDServicio}', -1)"
                            class="w-8 h-8 flex items-center justify-center border-2 border-stone-200 rounded-lg text-stone-500 font-bold text-base hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                            id="btn-menos-${s.IDServicio}"
                            aria-label="Reducir cantidad">
                            −
                        </button>

                        <input type="number"
                            id="cantidad-input-${s.IDServicio}"
                            value="1"
                            min="1"
                            max="20"
                            inputmode="numeric"
                            pattern="[0-9]*"
                            oninput="ServiciosAdicionales.validarCantidad(this, '${s.IDServicio}')"
                            onkeydown="ServiciosAdicionales.bloquearNoNumericos(event)"
                            class="w-14 h-8 text-center text-sm font-black text-stone-800 bg-white border-2 border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label="Número de personas">

                        <button type="button"
                            onclick="ServiciosAdicionales.cambiarCantidad('${s.IDServicio}', 1)"
                            class="w-8 h-8 flex items-center justify-center border-2 border-stone-200 rounded-lg text-stone-500 font-bold text-base hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600 active:scale-95 transition-all duration-150"
                            id="btn-mas-${s.IDServicio}"
                            aria-label="Aumentar cantidad">
                            +
                        </button>

                        <span class="text-[10px] text-stone-400 leading-tight ml-1">máx.<br>20 pers.</span>
                    </div>

                    <div class="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span class="text-xs text-stone-500 font-medium">Subtotal servicio:</span>
                        <span class="text-sm font-black text-amber-700 subtotal-servicio" data-precio="${s.Costo}">${fmt(s.Costo)}</span>
                    </div>
                </div>

                <div class="flex flex-col gap-1.5">
                    <span class="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Dias fijos</span>
                    <div class="flex gap-1 flex-wrap">${diasHtml}</div>
                </div>

                <div class="svc-hora-wrap hidden flex-col gap-2 border-t border-amber-200 pt-3">
                    <span class="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Horario fijo</span>
                    <div class="grid grid-cols-4 gap-1">${horariosHtml}</div>
                </div>
            `;
            c.appendChild(div);
        });
    },

    toggle(chk) {
        const id = chk.dataset.id;
        const wrapper  = chk.closest('.svc-item-wrapper');
        const horaWrap = wrapper?.querySelector('.svc-hora-wrap');
        const cantidadWrap = wrapper?.querySelector('.svc-cantidad-wrap');
        const cantidadInput = wrapper?.querySelector(`#cantidad-input-${id}`);

        if (chk.checked) {
            horaWrap?.classList.remove('hidden');
            cantidadWrap?.classList.remove('hidden');
            wrapper?.classList.add('border-amber-500', 'bg-gradient-to-br', 'from-amber-50', 'to-orange-50', 'shadow-lg', 'shadow-amber-200/50');
            State.serviciosExtras.push({
                id,
                nombre: chk.dataset.nombre,
                precio: Number(chk.dataset.precio),
                cantidad: 1,
                hora: chk.dataset.horaFija || ''
            });
            if (cantidadInput) {
                cantidadInput.value = '1';
                this.syncCantidad(id, 1);
            }
        } else {
            horaWrap?.classList.add('hidden');
            cantidadWrap?.classList.add('hidden');
            wrapper?.classList.remove('border-amber-500', 'bg-gradient-to-br', 'from-amber-50', 'to-orange-50', 'shadow-lg', 'shadow-amber-200/50');
            State.serviciosExtras = State.serviciosExtras.filter(s => s.id !== id);
            if (cantidadInput) cantidadInput.value = '1';
            this.syncCantidad(id, 1);
        }
        ResumenLateral.actualizar();
    },

    cambiarCantidad(servicioId, delta) {
        const input = document.getElementById(`cantidad-input-${servicioId}`);
        if (!input) return;
        const current = parseInt(input.value, 10) || 1;
        let next = current + delta;
        if (next < 1) next = 1;
        if (next > 20) next = 20;
        input.value = String(next);
        this.syncCantidad(servicioId, next);
    },

    validarCantidad(input, servicioId) {
        const raw = String(input.value || '').replace(/[^0-9]/g, '');
        let val = parseInt(raw, 10);
        if (!val || val < 1) val = 1;
        if (val > 20) val = 20;
        input.value = String(val);
        this.syncCantidad(servicioId, val);
    },

    bloquearNoNumericos(event) {
        const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (allowed.includes(event.key)) return;
        if (/^[0-9]$/.test(event.key)) return;
        event.preventDefault();
    },

    syncCantidad(servicioId, cantidad) {
        const wrapper = document.getElementById(`svc-${servicioId}`)?.closest('.svc-item-wrapper');
        const subtotalEl = wrapper?.querySelector('.subtotal-servicio');
        const btnMenos = wrapper?.querySelector(`#btn-menos-${servicioId}`);
        const btnMas = wrapper?.querySelector(`#btn-mas-${servicioId}`);

        const svc = State.serviciosExtras.find(s => s.id === servicioId);
        if (svc) svc.cantidad = cantidad;

        const base = svc ? svc.precio : Number(subtotalEl?.dataset.precio || 0);
        if (subtotalEl) subtotalEl.textContent = fmt(base * cantidad);

        if (btnMenos) btnMenos.disabled = cantidad <= 1;
        if (btnMas) btnMas.disabled = cantidad >= 20;

        ResumenLateral.actualizar();
    },

    
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
                imgWrap.classList.add('hidden'); // sin imagen en resumen para paquetes
                // RES1: Show package included room/service in summary
                let detailEl = document.getElementById('resumen-paq-detail');
                if (!detailEl) {
                    detailEl = document.createElement('div');
                    detailEl.id = 'resumen-paq-detail';
                    detailEl.className = 'text-xs text-gray-500 mb-4 space-y-0.5';
                    titleEl.insertAdjacentElement('afterend', detailEl);
                }
                const hab = State.itemSeleccionado.habitacion;
                const svc = State.itemSeleccionado.servicio;
                detailEl.innerHTML = [
                    hab ? `<div class="flex items-center gap-1.5"><i class="fa-solid fa-bed text-green-600 text-[10px]"></i>${hab}</div>` : '',
                    svc ? `<div class="flex items-center gap-1.5"><i class="fa-solid fa-bell-concierge text-amber-500 text-[10px]"></i>Incluye: ${svc}</div>` : '',
                ].join('');
            }
        } else {
            titleEl.textContent = 'Sin selección';
            imgWrap.classList.add('hidden');
            const detailEl = document.getElementById('resumen-paq-detail');
            if (detailEl) detailEl.innerHTML = '';
        }

        if (State.fechaInicio) {
            fechasEl.textContent = `${State.fechaInicio.toLocaleDateString()}  ${State.fechaFin ? State.fechaFin.toLocaleDateString() : '?'}  ${noches} noche(s)`;
        } else {
            fechasEl.textContent = 'Fechas no seleccionadas';
        }

        // Servicios extras
        const costoServicios = State.serviciosExtras.reduce((acc, s) => acc + (s.precio * (s.cantidad || 1)), 0);

        // IVA INCLUIDO: los precios del catálogo ya contienen el 19%
        const descInput = document.getElementById('descuento');
        const descuento = Number(descInput ? descInput.value : 0);
        State.descuento = descuento;

        const totalConIva  = Math.max(0, precioBase + costoServicios - descuento);
        const baseGravable = totalConIva / 1.19;
        const ivaDesglose  = totalConIva - baseGravable;

        // Update DOM
        document.getElementById('resumen-habitacion').textContent = fmt(precioBase);
        document.getElementById('resumen-servicios').textContent = fmt(costoServicios);
        document.getElementById('resumen-descuento').textContent = `-${fmt(descuento)}`;
        document.getElementById('resumen-subtotal').textContent = fmt(baseGravable);
        document.getElementById('resumen-iva').textContent = fmt(ivaDesglose);
        document.getElementById('resumen-total').textContent = fmt(totalConIva);
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

// Modal de política de cancelación — sin devolución de dinero
function mostrarAvisoNoDevolucion() {
    return new Promise((resolve) => {
        document.getElementById('modal-politica-cancelacion')?.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-politica-cancelacion';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(5px);padding:16px;';
        modal.innerHTML = `
            <div style="background:#fff;border-radius:18px;padding:32px;max-width:460px;width:100%;
                        box-shadow:0 30px 80px rgba(0,0,0,0.35);animation:ndUp .25s ease;">
                <style>@keyframes ndUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}</style>

                <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
                    <div style="width:52px;height:52px;border-radius:14px;background:#fef2f2;
                                display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;font-size:1.5rem;"></i>
                    </div>
                    <div>
                        <h2 style="margin:0;font-size:1.05rem;font-weight:800;color:#0f172a;">Política de Cancelación</h2>
                        <p style="margin:4px 0 0;font-size:0.78rem;color:#64748b;">Lee antes de confirmar tu reserva</p>
                    </div>
                </div>

                <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:14px 18px;margin-bottom:12px;">
                    <p style="margin:0;color:#7f1d1d;font-size:0.875rem;font-weight:700;line-height:1.65;">
                        <i class="fa-solid fa-ban" style="margin-right:7px;"></i>
                        En caso de cancelación de la reserva,
                        <span style="text-decoration:underline;text-decoration-color:#dc2626;">NO se realizará devolución del dinero</span>.
                    </p>
                </div>

                <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:18px;">
                    <p style="margin:0;color:#78350f;font-size:0.875rem;font-weight:700;line-height:1.65;">
                        <i class="fa-solid fa-clock" style="margin-right:7px;"></i>
                        Para cancelar tu reserva, debes notificarlo
                        <span style="text-decoration:underline;text-decoration-color:#b45309;">mínimo 3 días antes</span>
                        de la fecha de inicio.
                    </p>
                </div>

                <p style="margin:0 0 22px;color:#475569;font-size:0.855rem;line-height:1.65;">
                    Solo el <strong>administrador</strong> puede anular reservas una vez confirmadas.
                    Al continuar, declaras que leíste y aceptas estas condiciones.
                </p>

                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button id="nd-volver"
                        style="padding:10px 22px;border-radius:10px;border:1.5px solid #e2e8f0;
                               background:#f8fafc;color:#475569;font-weight:600;font-size:0.85rem;cursor:pointer;">
                        Volver
                    </button>
                    <button id="nd-aceptar"
                        style="padding:10px 24px;border-radius:10px;border:none;
                               background:#ff8a3d;color:#fff;font-weight:700;font-size:0.85rem;cursor:pointer;
                               box-shadow:0 4px 14px rgba(255,138,61,0.4);">
                        <i class="fa-solid fa-check" style="margin-right:7px;"></i>Entendido, confirmar
                    </button>
                </div>
            </div>`;

        document.body.appendChild(modal);

        document.getElementById('nd-aceptar').onclick = () => { modal.remove(); resolve(true);  };
        document.getElementById('nd-volver').onclick  = () => { modal.remove(); resolve(false); };
    });
}

// ── Modal de subida de comprobante de pago ─────────────────────────────────
function mostrarModalComprobante(reservaId) {
    document.getElementById('modal-comprobante-pago')?.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-comprobante-pago';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Subir comprobante de pago');
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);padding:16px;';

    modal.innerHTML = `
        <div id="mc-box" style="background:#fff;border-radius:20px;padding:0;max-width:500px;width:100%;
                    box-shadow:0 32px 80px rgba(0,0,0,0.35);animation:cpUp .25s ease;
                    max-height:95vh;display:flex;flex-direction:column;overflow:hidden;">
            <style>@keyframes cpUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}</style>

            <!-- Header -->
            <div style="padding:22px 24px 16px;border-bottom:1px solid #f1f5f9;flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#d97706);
                                display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fa-solid fa-receipt" style="color:#fff;font-size:1.2rem;"></i>
                    </div>
                    <div>
                        <h2 style="margin:0;font-size:1.05rem;font-weight:800;color:#0f172a;">Sube tu comprobante de pago</h2>
                        <p style="margin:3px 0 0;font-size:0.78rem;color:#64748b;">
                            Reserva <strong>#${reservaId}</strong> — Estado: <span style="color:#d97706;font-weight:700;">Pendiente Verificación</span>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Body -->
            <div style="overflow-y:auto;flex:1;padding:20px 24px;">
                <p style="margin:0 0 16px;font-size:0.855rem;color:#475569;line-height:1.65;">
                    Tu reserva quedó registrada. Para confirmarla, sube el comprobante de tu pago
                    (transferencia, depósito, etc.). Un administrador lo revisará y aprobará.
                </p>

                <!-- Zona drag & drop -->
                <div id="cp-drop-zone"
                    style="border:2px dashed #d1d5db;border-radius:14px;padding:28px 20px;text-align:center;
                           cursor:pointer;transition:border-color .2s,background .2s;background:#f8fafc;margin-bottom:14px;">
                    <i class="fa-solid fa-cloud-arrow-up" style="font-size:2rem;color:#94a3b8;margin-bottom:8px;display:block;"></i>
                    <p style="margin:0 0 4px;font-size:0.875rem;font-weight:600;color:#475569;">
                        Arrastra tu archivo aquí
                    </p>
                    <p style="margin:0;font-size:0.78rem;color:#94a3b8;">JPG, PNG o PDF — máx. 5 MB</p>
                    <input type="file" id="cp-file-input" accept=".jpg,.jpeg,.png,.pdf"
                           style="display:none;">
                </div>

                <!-- Preview -->
                <div id="cp-preview" style="display:none;margin-bottom:14px;"></div>

                <!-- Mensaje de validación -->
                <div id="cp-error" style="display:none;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;
                     border-radius:8px;font-size:0.82rem;color:#7f1d1d;font-weight:600;margin-bottom:14px;"></div>
                <div id="cp-success" style="display:none;padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;
                     border-radius:8px;font-size:0.82rem;color:#166534;font-weight:600;margin-bottom:14px;"></div>
            </div>

            <!-- Footer -->
            <div style="padding:14px 24px 20px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:space-between;flex-shrink:0;">
                <button id="cp-skip"
                    style="padding:10px 18px;border-radius:10px;border:1.5px solid #e2e8f0;
                           background:#f8fafc;color:#64748b;font-weight:600;font-size:0.84rem;cursor:pointer;flex-shrink:0;">
                    <i class="fa-solid fa-clock" style="margin-right:6px;"></i>Subir más tarde
                </button>
                <button id="cp-send" disabled
                    style="padding:10px 22px;border-radius:10px;border:none;
                           background:#f59e0b;color:#fff;font-weight:700;font-size:0.84rem;cursor:pointer;
                           opacity:.5;transition:opacity .2s,transform .15s;">
                    <i class="fa-solid fa-paper-plane" style="margin-right:7px;"></i>Enviar comprobante
                </button>
            </div>
        </div>`;

    document.body.appendChild(modal);

    let selectedFile = null;

    const dropZone   = document.getElementById('cp-drop-zone');
    const fileInput  = document.getElementById('cp-file-input');
    const preview    = document.getElementById('cp-preview');
    const errEl      = document.getElementById('cp-error');
    const successEl  = document.getElementById('cp-success');
    const sendBtn    = document.getElementById('cp-send');
    const skipBtn    = document.getElementById('cp-skip');

    const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];
    const MAX_MB  = 5;

    const showErr = (msg) => {
        errEl.textContent  = msg;
        errEl.style.display = 'block';
        successEl.style.display = 'none';
    };
    const clearMsg = () => {
        errEl.style.display  = 'none';
        successEl.style.display = 'none';
    };

    const renderPreview = (file) => {
        clearMsg();
        if (!ALLOWED.includes(file.type)) {
            showErr('Tipo no permitido. Solo JPG, PNG o PDF.');
            selectedFile = null;
            sendBtn.disabled = true;
            sendBtn.style.opacity = '.5';
            preview.style.display = 'none';
            return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            showErr(`El archivo supera ${MAX_MB} MB. Elige uno más pequeño.`);
            selectedFile = null;
            sendBtn.disabled = true;
            sendBtn.style.opacity = '.5';
            preview.style.display = 'none';
            return;
        }
        selectedFile = file;
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';

        const sizeMB = (file.size / 1048576).toFixed(2);
        if (file.type === 'application/pdf') {
            preview.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;
                            background:#f1f5f9;border-radius:10px;border:1px solid #e2e8f0;">
                    <i class="fa-solid fa-file-pdf" style="color:#dc2626;font-size:1.8rem;flex-shrink:0;"></i>
                    <div>
                        <div style="font-size:0.84rem;font-weight:600;color:#0f172a;word-break:break-all;">${file.name}</div>
                        <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${sizeMB} MB</div>
                    </div>
                </div>`;
        } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
                preview.innerHTML = `
                    <div style="text-align:center;">
                        <img src="${ev.target.result}" alt="Preview"
                             style="max-height:180px;max-width:100%;border-radius:10px;border:1px solid #e2e8f0;object-fit:contain;">
                        <p style="margin:6px 0 0;font-size:0.75rem;color:#64748b;">${file.name} · ${sizeMB} MB</p>
                    </div>`;
            };
            reader.readAsDataURL(file);
        }
        preview.style.display = 'block';
        dropZone.style.borderColor = '#f59e0b';
        dropZone.style.background  = '#fffbeb';
    };

    // Click en zona drag&drop abre el input
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) renderPreview(fileInput.files[0]);
    });

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#f59e0b';
        dropZone.style.background  = '#fffbeb';
    });
    dropZone.addEventListener('dragleave', () => {
        if (!selectedFile) {
            dropZone.style.borderColor = '#d1d5db';
            dropZone.style.background  = '#f8fafc';
        }
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) renderPreview(file);
    });

    // ESC cierra
    const escHandler = (e) => { if (e.key === 'Escape') skipBtn.click(); };
    document.addEventListener('keydown', escHandler);

    // Subir más tarde
    skipBtn.onclick = () => {
        document.removeEventListener('keydown', escHandler);
        modal.remove();
        UI.showToast('Reserva guardada. Recuerda subir el comprobante pronto.', 'info');
        setTimeout(() => window.location.href = 'pages/reservas.html', 1600);
    };

    // Enviar comprobante
    sendBtn.onclick = async () => {
        if (!selectedFile) return;
        sendBtn.disabled  = true;
        sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:7px;"></i>Enviando...';

        const formData = new FormData();
        formData.append('comprobante', selectedFile);
        const apiUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'http://localhost:3000/api';

        try {
            const res = await fetch(`${apiUrl}/reservas/${reservaId}/comprobante`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al subir el archivo.');

            successEl.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right:6px;"></i>¡Comprobante enviado! El administrador lo revisará pronto.';
            successEl.style.display = 'block';
            errEl.style.display = 'none';
            sendBtn.style.display = 'none';
            skipBtn.innerHTML = '<i class="fa-solid fa-list" style="margin-right:6px;"></i>Ver mis reservas';
            skipBtn.style.background = '#16a34a';
            skipBtn.style.color = '#fff';
            skipBtn.style.border = 'none';
            document.removeEventListener('keydown', escHandler);
            setTimeout(() => {
                modal.remove();
                window.location.href = 'pages/reservas.html';
            }, 2200);
        } catch (err) {
            showErr(err.message || 'No se pudo subir el comprobante. Intenta de nuevo.');
            sendBtn.disabled  = false;
            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-right:7px;"></i>Enviar comprobante';
        }
    };

    // Focus al abrir
    setTimeout(() => document.getElementById('cp-skip')?.focus(), 100);
}

const ReservaForm = {
    init() {
        CalendarioPicker.init();
        ModoReserva.init();
        BuscadorCliente.init();

        document.getElementById('descuento')?.addEventListener('input', () => ResumenLateral.actualizar());

        // Sincronizar estado oculto con método de pago
        document.getElementById('metodo-pago')?.addEventListener('change', function () {
            const estadoEl = document.getElementById('estado-reserva');
            if (estadoEl) estadoEl.value = this.value === '1' ? '2' : '5';
        });

        document.getElementById('btn-confirmar-reserva')?.addEventListener('click', async (e) => {
            e.preventDefault();
            const btn = e.currentTarget; // capturar ANTES de cualquier await

            if (!FormValidator.validar()) return;

            // Mostrar aviso de política de cancelación antes de procesar
            const aceptado = await mostrarAvisoNoDevolucion();
            if (!aceptado) return;

            btn.disabled = true;
            btn.textContent = 'Procesando...';

            const noches = Math.max(1, Math.round((State.fechaFin - State.fechaInicio) / 86400000));
            const costoBase = State.modo === 'habitacion'
                ? State.itemSeleccionado.precio * noches
                : State.itemSeleccionado.precio;
            const costoSvc     = State.serviciosExtras.reduce((a, s) => a + (s.precio * (s.cantidad || 1)), 0);
            // IVA INCLUIDO: el backend recalculará estos valores; los enviamos como referencia
            const totalConIva  = Math.max(0, costoBase + costoSvc - State.descuento);
            const baseGravable = totalConIva / 1.19;
            const ivaDesglose  = totalConIva - baseGravable;

            const payload = {
                NroDocumentoCliente: State.cliente.documento,
                FechaInicio: State.fechaInicio.toISOString().split('T')[0],
                FechaFinalizacion: State.fechaFin.toISOString().split('T')[0],
                MetodoPago: Number(document.getElementById('metodo-pago').value),
                IdEstadoReserva: Number(document.getElementById('estado-reserva').value),
                Descuento: State.descuento,
                SubTotal: baseGravable,
                IVA: ivaDesglose,
                MontoTotal: totalConIva,
                IDHabitacion: State.modo === 'habitacion' ? State.itemSeleccionado.id : null,
                paquetesIds: State.modo === 'paquete' ? [Number(State.itemSeleccionado.id)] : [],
                serviciosIds: State.serviciosExtras.map(s => Number(s.id)),
                serviciosConHorarios: State.serviciosExtras.map(s => ({ id: Number(s.id), hora: s.hora || null })),
            };

            try {
                const result = await requestJson('/reservas', { method: 'POST', body: payload });
                const reservaId = result?.reservaId;

                // Determinar si es cliente (mostrar modal comprobante) o admin (overlay clásico)
                const _sess  = window.getStoredSession ? window.getStoredSession() : null;
                let _role    = Number(_sess?.usuario?.IDRol ?? _sess?.user?.rol ?? 0);
                if (!_role) {
                    try { _role = Number(JSON.parse(localStorage.getItem('user') || '{}').IDRol || 0); } catch(_) {}
                }
                const _isCliente = _role === 2 || _role === 3 || _role === 0; // 0 = sin sesión admin → mostrar modal

                if (_isCliente && reservaId) {
                    mostrarModalComprobante(reservaId);
                } else {
                    const idEl = document.getElementById('rf-success-id');
                    if (idEl && reservaId) idEl.textContent = `#${reservaId}`;
                    const overlay = document.getElementById('rf-success-overlay');
                    if (overlay) {
                        overlay.classList.add('show');
                        document.getElementById('rf-success-btn-ir')?.addEventListener('click', () => {
                            window.location.href = 'pages/reservas.html';
                        });
                    } else {
                        UI.showToast("Reserva guardada correctamente.", "success");
                        setTimeout(() => window.location.href = 'pages/reservas.html', 1500);
                    }
                }
            } catch (error) {
                UI.showToast(error.message || "Error al guardar la reserva", "error");
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Confirmar Reserva';
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ReservaForm.init();
});
