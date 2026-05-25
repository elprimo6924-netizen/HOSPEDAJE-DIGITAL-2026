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
const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const HORA_BTN_BASE = "svc-hora-btn py-1 text-[11px] font-semibold border border-stone-200 rounded-lg text-stone-600 bg-white hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 transition-all duration-150";
const HORA_BTN_ACTIVE = "svc-hora-btn py-1 text-[11px] font-semibold border-2 border-amber-500 rounded-lg text-white bg-amber-500 shadow-sm shadow-amber-200";

const SERVICIOS_META = [
    {
        key: "spa",
        match: ["spa", "masaje"],
        icono: "🧖",
        descripcion: "Relajacion y bienestar completo",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
        horarios: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
    },
    {
        key: "restaurante",
        match: ["restaurante"],
        icono: "🍽️",
        descripcion: "Desayuno, almuerzo y cena",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        horarios: ["07:00", "08:00", "12:00", "13:00", "19:00", "20:00", "21:00"],
    },
    {
        key: "piscina",
        match: ["piscina"],
        icono: "🏊",
        descripcion: "Area acuatica climatizada",
        dias: ["Lu", "Mi", "Vi", "Sa", "Do"],
        horarios: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    },
    {
        key: "wifi",
        match: ["wifi"],
        icono: "📶",
        descripcion: "Internet de alta velocidad",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        horarios: [],
    },
    {
        key: "gimnasio",
        match: ["gimnasio"],
        icono: "🏋️",
        descripcion: "Equipos de ultima generacion",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
        horarios: ["06:00", "07:00", "08:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
    },
    {
        key: "habitacion",
        match: ["habitacion", "room"],
        icono: "🛎️",
        descripcion: "Servicio a la habitacion 24h",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        horarios: ["07:00", "08:00", "12:00", "13:00", "19:00", "20:00", "21:00", "22:00"],
    },
    {
        key: "tour",
        match: ["tour"],
        icono: "🗺️",
        descripcion: "Recorridos por la ciudad",
        dias: ["Ma", "Ju", "Sa", "Do"],
        horarios: ["08:00", "10:00", "14:00", "16:00"],
    },
    {
        key: "lavanderia",
        match: ["lavanderia", "lavanderia"],
        icono: "👔",
        descripcion: "Entrega en 24 horas",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi"],
        horarios: ["08:00", "09:00", "10:00", "11:00"],
    },
    {
        key: "transporte",
        match: ["transporte"],
        icono: "🚗",
        descripcion: "Traslados al aeropuerto",
        dias: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        horarios: ["05:00", "06:00", "07:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
    },
    {
        key: "bar",
        match: ["bar", "cocktail"],
        icono: "🍹",
        descripcion: "Cocteleria artesanal premium",
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
        descripcion: "Servicio premium disponible",
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
                ? horarios.map((h) => `
                    <button type="button" class="${HORA_BTN_BASE}" onclick="ServiciosAdicionales.selectHora(this, '${s.IDServicio}', '${h}')">${h}</button>
                `).join('')
                : `<span class="text-xs text-stone-500">Disponible todo el dia</span>`;

            const confirmHtml = horarios.length
                ? `<div class="flex items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-200">
                        <span class="text-base">⏰</span>
                        <span class="text-xs font-semibold text-amber-700 confirmacion-hora">Reservado: --:--</span>
                   </div>`
                : '';

            const div = document.createElement('div');
            div.className = "svc-item-wrapper relative flex flex-col gap-3 p-4 bg-white border-2 border-stone-200 rounded-2xl cursor-pointer hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-250 group";
            div.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="relative mt-0.5 shrink-0">
                        <input type="checkbox" class="peer sr-only"
                               id="svc-${s.IDServicio}" data-id="${s.IDServicio}"
                               data-precio="${s.Costo}" data-nombre="${s.NombreServicio}"
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
                    <span class="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Dias disponibles</span>
                    <div class="flex gap-1 flex-wrap">${diasHtml}</div>
                </div>

                <div class="svc-hora-wrap hidden flex-col gap-2 border-t border-amber-200 pt-3">
                    <span class="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Selecciona tu horario</span>
                    <div class="grid grid-cols-4 gap-1">${horariosHtml}</div>
                    ${confirmHtml}
                    <input type="hidden" class="svc-hora" data-svc-id="${s.IDServicio}">
                </div>
            `;
            c.appendChild(div);
        });
    },

    toggle(chk) {
        const id = chk.dataset.id;
        const wrapper  = chk.closest('.svc-item-wrapper');
        const horaWrap = wrapper?.querySelector('.svc-hora-wrap');
        const horaInput = wrapper?.querySelector('.svc-hora');
        const cantidadWrap = wrapper?.querySelector('.svc-cantidad-wrap');
        const cantidadInput = wrapper?.querySelector(`#cantidad-input-${id}`);

        if (chk.checked) {
            horaWrap?.classList.remove('hidden');
            cantidadWrap?.classList.remove('hidden');
            wrapper?.classList.add('border-amber-500', 'bg-gradient-to-br', 'from-amber-50', 'to-orange-50', 'shadow-lg', 'shadow-amber-200/50');
            State.serviciosExtras.push({ id, nombre: chk.dataset.nombre, precio: Number(chk.dataset.precio), cantidad: 1, hora: '' });
            if (cantidadInput) {
                cantidadInput.value = '1';
                this.syncCantidad(id, 1);
            }
            if (horaInput) {
                horaInput.addEventListener('change', () => {
                    const svc = State.serviciosExtras.find(s => s.id === id);
                    if (svc) svc.hora = horaInput.value;
                });
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

    selectHora(btn, servicioId, hora) {
        const wrapper = btn.closest('.svc-item-wrapper');
        if (!wrapper) return;
        const panel = wrapper.querySelector('.svc-hora-wrap');
        const input = wrapper.querySelector('.svc-hora');
        const confirm = panel?.querySelector('.confirmacion-hora');

        wrapper.querySelectorAll('.svc-hora-btn').forEach((b) => {
            b.className = HORA_BTN_BASE;
        });
        btn.className = HORA_BTN_ACTIVE;

        if (input) {
            input.value = hora;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (confirm) {
            confirm.textContent = `Reservado: ${hora}`;
        }
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
                } else {
                    imgWrap.classList.add('hidden');
                }
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

            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = 'Procesando...';

            const noches = Math.round((State.fechaFin - State.fechaInicio) / 86400000);
            const costoBase = State.modo === 'habitacion'
                ? State.itemSeleccionado.precio * Math.max(1, noches)
                : State.itemSeleccionado.precio;
            const costoSvc  = State.serviciosExtras.reduce((a, s) => a + (s.precio * (s.cantidad || 1)), 0);
            const subtotal  = costoBase + costoSvc - State.descuento;
            const iva       = Math.max(0, subtotal * 0.19);
            const total     = Math.max(0, subtotal + iva);

            const payload = {
                NroDocumentoCliente: State.cliente.documento,
                FechaInicio: State.fechaInicio.toISOString().split('T')[0],
                FechaFinalizacion: State.fechaFin.toISOString().split('T')[0],
                MetodoPago: Number(document.getElementById('metodo-pago').value),
                IdEstadoReserva: Number(document.getElementById('estado-reserva').value),
                Descuento: State.descuento,
                SubTotal: subtotal,
                IVA: iva,
                MontoTotal: total,
                IDHabitacion: State.modo === 'habitacion' ? State.itemSeleccionado.id : null,
                paquetesIds: State.modo === 'paquete' ? [Number(State.itemSeleccionado.id)] : [],
                serviciosIds: State.serviciosExtras.map(s => Number(s.id)),
                serviciosConHorarios: State.serviciosExtras.map(s => ({ id: Number(s.id), hora: s.hora || null })),
            };

            try {
                const result = await requestJson('/reservas', { method: 'POST', body: payload });
                const idEl = document.getElementById('rf-success-id');
                if (idEl && result?.reservaId) idEl.textContent = `#${result.reservaId}`;
                const overlay = document.getElementById('rf-success-overlay');
                if (overlay) {
                    overlay.classList.add('show');
                    document.getElementById('rf-success-btn-ir')?.addEventListener('click', () => {
                        window.location.href = 'pages/reservas.html';
                    });
                } else {
                    UI.showToast("Reserva confirmada con éxito", "success");
                    setTimeout(() => window.location.href = 'pages/reservas.html', 1500);
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
