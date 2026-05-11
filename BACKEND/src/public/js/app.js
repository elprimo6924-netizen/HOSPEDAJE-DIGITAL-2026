/* ==========================================
   VARIABLES GLOBALES Y CARGA INICIAL
   ========================================== */
let editandoID = null; 
let editandoHabitacionID = null;

const API_BASE = "http://localhost:3306/api";

// Helper para obtener headers con token
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
};

document.addEventListener("DOMContentLoaded", () => {
    cargarClientes();
    cargarHabitaciones(); 
    cargarPaquetes();
});

/* ==========================================
   GESTIÓN DE CLIENTES
   ========================================== */

async function cargarClientes() {
    try {
        const res = await fetch(`${API_BASE}/clientes`, {
            headers: getAuthHeaders()
        });
        const clientes = await res.json();
        const tabla = document.getElementById("tablaClientes");
        if (!tabla) return;
        tabla.innerHTML = ""; 

        clientes.forEach(c => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${c.IDCliente}</td>
                <td>${c.NroDocumento}</td>
                <td>${c.Nombre} ${c.Apellido || ''}</td>
                <td>${c.Email}</td>
                <td>${c.Telefono}</td>
                <td>
                    <button class="btn-edit" onclick="prepararEdicion(${c.IDCliente}, '${c.NroDocumento}', '${c.Nombre}', '${c.Apellido}', '${c.Email}', '${c.Telefono}')">📝</button>
                    <button class="btn-delete" onclick="eliminarCliente(${c.IDCliente})">🗑️</button>
                </td>
            `;
            tabla.appendChild(fila);
        });
    } catch (error) { console.error("Error cargando clientes:", error); }
}

function prepararEdicion(id, doc, nombre, apellido, email, tel) {
    editandoID = id;
    document.getElementById("docCliente").value = doc;
    document.getElementById("nombreCliente").value = nombre;
    document.getElementById("apellidoCliente").value = apellido || "";
    document.getElementById("emailCliente").value = email;
    document.getElementById("telefonoCliente").value = tel;
    document.querySelector("#modalCliente h3").innerText = "Editar Cliente";
    abrirModalCliente();
}

async function guardarCliente() {
    const datos = {
        NroDocumento: document.getElementById("docCliente").value,
        Nombre: document.getElementById("nombreCliente").value,
        Apellido: document.getElementById("apellidoCliente").value,
        Email: document.getElementById("emailCliente").value,
        Telefono: document.getElementById("telefonoCliente").value,
        Estado: 1, IDRol: 2
    };

    const url = editandoID ? `${API_BASE}/clientes/${editandoID}` : `${API_BASE}/clientes`;
    const metodo = editandoID ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: getAuthHeaders(),
            body: JSON.stringify(datos)
        });
        if (res.ok) {
            alert(editandoID ? "Cliente actualizado" : "Cliente creado");
            cerrarModalCliente();
            cargarClientes();
        }
    } catch (error) { console.error("Error al guardar cliente:", error); }
}

async function eliminarCliente(id) {
    if (!confirm("¿Eliminar este cliente?")) return;
    try {
        await fetch(`${API_BASE}/clientes/${id}`, { 
            method: "DELETE",
            headers: getAuthHeaders()
        });
        cargarClientes();
    } catch (error) { console.error("Error al eliminar:", error); }
}

/* ==========================================
   GESTIÓN DE HABITACIONES
   ========================================== */

async function cargarHabitaciones() {
    try {
        const res = await fetch(`${API_BASE}/habitaciones`, {
            headers: getAuthHeaders()
        });
        const data = await res.json(); // Esta es la variable que faltaba
        
        const tabla = document.getElementById("tablaHabitaciones");
        if (!tabla) return;
        tabla.innerHTML = ""; 

        if (Array.isArray(data)) {
            data.forEach(h => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${h.IDHabitacion}</td>
                    <td>${h.NombreHabitacion}</td>
                    <td>$${h.Costo}</td>
                    <td>${h.Estado == 1 ? 'Disponible' : 'Ocupada'}</td>
                    <td>
                        <button class="btn-edit" onclick="prepararEdicionHab(${h.IDHabitacion}, '${h.NombreHabitacion}', '${h.Descripcion}', ${h.Costo})">📝</button>
                        <button class="btn-delete" onclick="eliminarHabitacion(${h.IDHabitacion})">🗑️</button>
                    </td>
                `;
                tabla.appendChild(fila);
            });
        }
    } catch (error) { console.error("Error cargando habitaciones:", error); }
}

function prepararEdicionHab(id, nombre, desc, costo) {
    editandoHabitacionID = id;
    document.getElementById("nombreHab").value = nombre;
    document.getElementById("descHab").value = desc;
    document.getElementById("precioHab").value = costo;
    document.querySelector("#modalHabitacion h3").innerText = "Editar Habitación";
    abrirModalHabitacion();
}

async function guardarHabitacion() {
    const datos = {
        nombre: document.getElementById("nombreHab").value,
        descripcion: document.getElementById("descHab").value,
        precio: parseFloat(document.getElementById("precioHab").value),
        estado: 1
    };

    if (!datos.nombre || isNaN(datos.precio)) {
        alert("Complete nombre y precio");
        return;
    }

    const url = editandoHabitacionID 
        ? `${API_BASE}/habitaciones/${editandoHabitacionID}` 
        : `${API_BASE}/habitaciones`;
    
    const metodo = editandoHabitacionID ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: getAuthHeaders(),
            body: JSON.stringify(datos)
        });
        
        if (res.ok) {
            alert("Guardado correctamente");
            cerrarModalHabitacion();
            cargarHabitaciones();
        }
    } catch (error) { console.error("Error al guardar habitación:", error); }
}

async function eliminarHabitacion(id) {
    if (!confirm("¿Eliminar habitación?")) return;
    try {
        await fetch(`${API_BASE}/habitaciones/${id}`, { 
            method: "DELETE",
            headers: getAuthHeaders()
        });
        cargarHabitaciones();
    } catch (error) { console.error("Error al eliminar:", error); }
}

/* ==========================================
   MODALES Y UTILS
   ========================================== */
function abrirModalCliente() { document.getElementById("modalCliente").style.display = "flex"; }
function cerrarModalCliente() { 
    document.getElementById("modalCliente").style.display = "none"; 
    editandoID = null; 
}
function abrirModalHabitacion() { document.getElementById("modalHabitacion").style.display = "flex"; }
function cerrarModalHabitacion() { 
    document.getElementById("modalHabitacion").style.display = "none"; 
    editandoHabitacionID = null; 
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

/* ==========================================
   GESTIÓN DE PAQUETES (RAGNARÖK)
   ========================================== */

let editandoPaqueteID = null;

// 1. Cargar la tabla de paquetes al iniciar
async function cargarPaquetes() {
    try {
        const res = await fetch(`${API_BASE}/paquetes`, {
            headers: getAuthHeaders()
        });
        const paquetes = await res.json();
        const tabla = document.getElementById("tablaPaquetes");
        if (!tabla) return;
        tabla.innerHTML = "";

        paquetes.forEach(p => {
            const nombre = p.NombrePaquete || p.Nombre || '';
            const precio = p.Precio || p.Costo || 0;
            const desc = p.Descripcion || '';

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td style="color: #00f2ff; font-size: 1.5rem;">${p.IconoRuna || 'ᚠ'}</td>
                <td>${nombre}</td>
                <td class="glow-text-gold">$${precio}</td>
                <td>
                    <button class="btn-edit" onclick="prepararEdicionPaquete(${p.IDPaquete}, '${nombre}', '${desc}', ${precio})">📝</button>
                    <button class="btn-delete" onclick="eliminarPaquete(${p.IDPaquete})">🗑️</button>
                </td>
            `;
            tabla.appendChild(fila);
        });
    } catch (error) { console.error("Error en el reino de los paquetes:", error); }
}

function abrirModalPaquete() {
    document.getElementById("modalPaquete").style.display = "flex";
}

function cerrarModalPaquete() {
    document.getElementById("modalPaquete").style.display = "none";
    editandoPaqueteID = null;
    document.getElementById("nombrePaquete").value = "";
    document.getElementById("descPaquete").value = "";
    document.getElementById("precioPaquete").value = "";
    document.querySelector("#modalPaquete h3").innerText = "Forjar Nuevo Paquete";
}

function prepararEdicionPaquete(id, nombre, desc, precio) {
    editandoPaqueteID = id;
    document.getElementById("nombrePaquete").value = nombre;
    document.getElementById("descPaquete").value = desc;
    document.getElementById("precioPaquete").value = precio;
    document.querySelector("#modalPaquete h3").innerText = "Reforjar Paquete";
    abrirModalPaquete();
}

async function guardarPaquete() {
    const nombre = document.getElementById("nombrePaquete").value;
    const precio = document.getElementById("precioPaquete").value;

    if (!nombre || !precio) {
        alert("Por favor ingresa un Nombre y un Precio para el paquete.");
        return;
    }

    // ATENCIÓN: Estos IDs por defecto (1) pueden fallar si las tablas están vacías.
    // Se recomienda añadir selectores en el HTML para IDHabitacion e IDServicio.
    const datos = {
        NombrePaquete: nombre,
        Descripcion: document.getElementById("descPaquete").value,
        Precio: parseFloat(precio),
        IDHabitacion: 1, 
        IDServicio: 1,   
        Estado: 1
    };

    const url = editandoPaqueteID 
        ? `${API_BASE}/paquetes/${editandoPaqueteID}` 
        : `${API_BASE}/paquetes`;
    const metodo = editandoPaqueteID ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: getAuthHeaders(),
            body: JSON.stringify(datos)
        });

        const respuesta = await res.json();

        if (res.ok) {
            alert(editandoPaqueteID ? "Paquete actualizado" : "Paquete creado");
            cerrarModalPaquete();
            cargarPaquetes();
        } else {
            // Muestra el error real (ej. clave foránea inválida)
            alert("Error: " + (respuesta.detalle || respuesta.error || "No se pudo guardar"));
        }
    } catch (error) { 
        console.error("Error al guardar paquete:", error);
        alert("Error de conexión con el servidor");
    }
}

async function eliminarPaquete(id) {
    if (!confirm("¿Deseas desvanecer este paquete en el Ginnungagap?")) return;
    try {
        await fetch(`${API_BASE}/paquetes/${id}`, { 
            method: "DELETE",
            headers: getAuthHeaders()
        });
        cargarPaquetes();
    } catch (error) { console.error("Error al eliminar paquete:", error); }
}

/* ==========================================
   LÓGICA DE RESERVAS (AIRBNB + RAGNARÖK)
   ========================================== */

function cerrarModalReserva() {
    document.getElementById("modalReserva").style.display = "none";
}

// Esta función es vital para el cálculo tipo Airbnb
function actualizarPrecioTotal() {
    const fechaIn = document.getElementById("resFechaInicio").value;
    const fechaOut = document.getElementById("resFechaFin").value;
    
    // Suponiendo que guardamos el costo de la hab seleccionada globalmente
    let costoHabitacion = 100; // Valor base de prueba
    let noches = 0;

    if (fechaIn && fechaOut) {
        const dias = (new Date(fechaOut) - new Date(fechaIn)) / (1000 * 60 * 60 * 24);
        noches = Math.max(0, dias);
    }

    let subtotalHab = costoHabitacion * noches;
    let extrasPaquetes = 0;

    // Sumar checkboxes de paquetes
    document.querySelectorAll('#listaPaquetesCheck input:checked').forEach(cb => {
        extrasPaquetes += parseFloat(cb.getAttribute('data-precio'));
    });

    const subtotalTotal = subtotalHab + extrasPaquetes;
    const iva = subtotalTotal * 0.19;
    const total = subtotalTotal + iva;

    // Actualizar labels con neón
    document.getElementById("resSubtotal").innerText = `$${subtotalHab.toFixed(2)}`;
    document.getElementById("resExtras").innerText = `$${extrasPaquetes.toFixed(2)}`;
    document.getElementById("resIva").innerText = `$${iva.toFixed(2)}`;
    document.getElementById("resTotal").innerText = `$${total.toFixed(2)}`;
}
