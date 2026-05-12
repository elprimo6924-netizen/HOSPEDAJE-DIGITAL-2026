# 📦 Plantilla Lista para Usar - Frontend

## 🎯 Cómo Crear tu Frontend

Sigue estos pasos para crear tu carpeta de frontend con la estructura correcta:

### Paso 1: Crear la Estructura de Carpetas

Abre tu terminal y ejecuta estos comandos **fuera de la carpeta HOSPEDAJE_DIGITAL**:

```bash
# Crear carpeta principal del frontend
mkdir mi-proyecto-frontend
cd mi-proyecto-frontend

# Crear subcarpetas
mkdir pages css js assets components
mkdir assets/images assets/icons assets/fonts
```

### Paso 2: Crear los Archivos

#### 📄 `index.html`
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hospedaje Digital</title>
    <link rel="stylesheet" href="css/reset.css">
    <link rel="stylesheet" href="css/variables.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <header>
        <nav>
            <h1>🏨 Hospedaje Digital</h1>
            <ul>
                <li><a href="index.html">Inicio</a></li>
                <li><a href="pages/nosotros.html">Nosotros</a></li>
                <li><a href="pages/contacto.html">Contacto</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <h2>Bienvenido a Hospedaje Digital</h2>
            <p>Encuentra la habitación perfecta para tu estadía</p>
        </section>

        <section class="habitaciones-section">
            <h3>Habitaciones Disponibles</h3>
            <div id="habitaciones" class="habitaciones-grid">
                <p>Cargando habitaciones...</p>
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2026 Hospedaje Digital. Todos los derechos reservados.</p>
    </footer>

    <!-- ⭐ IMPORTANTE: Cargar scripts en este orden -->
    <script src="js/api.js"></script>
    <script src="js/app.js"></script>
    <script src="js/eventos.js"></script>
</body>
</html>
```

---

#### 📄 `js/api.js` ⭐ ARCHIVO CLAVE
```javascript
// ============================================
// CONFIGURACIÓN - Cambia esto según tu backend
// ============================================
const API_URL = 'http://localhost:3000/api';

// ============================================
// HABITACIONES
// ============================================
async function obtenerHabitaciones() {
    try {
        const response = await fetch(`${API_URL}/habitaciones`);
        if (!response.ok) throw new Error('Error al obtener habitaciones');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function obtenerHabitacionPorId(id) {
    try {
        const response = await fetch(`${API_URL}/habitaciones/${id}`);
        if (!response.ok) throw new Error('Error al obtener habitación');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function crearHabitacion(habitacion) {
    try {
        const response = await fetch(`${API_URL}/habitaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(habitacion)
        });
        if (!response.ok) throw new Error('Error al crear habitación');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function actualizarHabitacion(id, habitacion) {
    try {
        const response = await fetch(`${API_URL}/habitaciones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(habitacion)
        });
        if (!response.ok) throw new Error('Error al actualizar habitación');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function eliminarHabitacion(id) {
    try {
        const response = await fetch(`${API_URL}/habitaciones/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar habitación');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// ============================================
// CLIENTES
// ============================================
async function obtenerClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        if (!response.ok) throw new Error('Error al obtener clientes');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function crearCliente(cliente) {
    try {
        const response = await fetch(`${API_URL}/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cliente)
        });
        if (!response.ok) throw new Error('Error al crear cliente');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// ============================================
// RESERVAS
// ============================================
async function obtenerReservas() {
    try {
        const response = await fetch(`${API_URL}/reservas`);
        if (!response.ok) throw new Error('Error al obtener reservas');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function crearReserva(reserva) {
    try {
        const response = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reserva)
        });
        if (!response.ok) throw new Error('Error al crear reserva');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// ============================================
// SERVICIOS
// ============================================
async function obtenerServicios() {
    try {
        const response = await fetch(`${API_URL}/servicios`);
        if (!response.ok) throw new Error('Error al obtener servicios');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}
```

---

#### 📄 `js/app.js`
```javascript
// ============================================
// FUNCIONES PARA MOSTRAR DATOS
// ============================================

function mostrarHabitaciones(habitaciones) {
    const contenedor = document.getElementById('habitaciones');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    if (habitaciones.length === 0) {
        contenedor.innerHTML = '<p>No hay habitaciones disponibles</p>';
        return;
    }
    
    habitaciones.forEach(habitacion => {
        const card = document.createElement('div');
        card.className = 'habitacion-card';
        card.innerHTML = `
            <div class="habitacion-imagen">
                <img src="${habitacion.ImagenHabitacion || 'assets/images/default.jpg'}" 
                     alt="${habitacion.NombreHabitacion}">
            </div>
            <div class="habitacion-info">
                <h3>${habitacion.NombreHabitacion}</h3>
                <p class="descripcion">${habitacion.Descripcion}</p>
                <p class="precio">$${habitacion.Costo} / noche</p>
                <span class="estado ${habitacion.Estado}">${habitacion.Estado}</span>
                <button onclick="verDetalles(${habitacion.id})" class="btn-ver">Ver Detalles</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

async function cargarHabitaciones() {
    const habitaciones = await obtenerHabitaciones();
    console.log('Habitaciones obtenidas:', habitaciones);
    mostrarHabitaciones(habitaciones);
}

function verDetalles(id) {
    console.log('Ver detalles de habitación:', id);
    // Aquí puedes redirigir a una página de detalles
    // window.location.href = `pages/detalle.html?id=${id}`;
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página cargada, obteniendo datos del backend...');
    cargarHabitaciones();
});
```

---

#### 📄 `js/eventos.js`
```javascript
// ============================================
// EVENTOS Y FORMULARIOS
// ============================================

// Búsqueda de habitaciones
function buscarHabitaciones(termino) {
    obtenerHabitaciones().then(habitaciones => {
        const filtradas = habitaciones.filter(h => 
            h.NombreHabitacion.toLowerCase().includes(termino.toLowerCase()) ||
            h.Descripcion.toLowerCase().includes(termino.toLowerCase())
        );
        mostrarHabitaciones(filtradas);
    });
}

// Filtrar por estado
function filtrarPorEstado(estado) {
    obtenerHabitaciones().then(habitaciones => {
        const filtradas = estado === 'todas' 
            ? habitaciones 
            : habitaciones.filter(h => h.Estado === estado);
        mostrarHabitaciones(filtradas);
    });
}

// Ordenar por precio
function ordenarPorPrecio(orden) {
    obtenerHabitaciones().then(habitaciones => {
        const ordenadas = [...habitaciones].sort((a, b) => {
            return orden === 'asc' 
                ? a.Costo - b.Costo 
                : b.Costo - a.Costo;
        });
        mostrarHabitaciones(ordenadas);
    });
}
```

---

#### 📄 `css/reset.css`
```css
/* Reset básico */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
}

a {
    text-decoration: none;
    color: inherit;
}

ul {
    list-style: none;
}

img {
    max-width: 100%;
    height: auto;
}
```

---

#### 📄 `css/variables.css`
```css
:root {
    /* Colores */
    --color-primary: #2c3e50;
    --color-secondary: #3498db;
    --color-accent: #e74c3c;
    --color-success: #27ae60;
    --color-warning: #f39c12;
    --color-background: #ecf0f1;
    --color-text: #2c3e50;
    --color-white: #ffffff;
    
    /* Espaciado */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Fuentes */
    --font-family: 'Arial', sans-serif;
    --font-size-sm: 14px;
    --font-size-base: 16px;
    --font-size-lg: 20px;
    --font-size-xl: 24px;
    --font-size-xxl: 32px;
    
    /* Bordes */
    --border-radius: 8px;
    --border-radius-sm: 4px;
    
    /* Sombras */
    --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 8px rgba(0,0,0,0.15);
    --shadow-lg: 0 8px 16px rgba(0,0,0,0.2);
}
```

---

#### 📄 `css/styles.css`
```css
/* Importar variables */
@import 'variables.css';

body {
    background-color: var(--color-background);
    color: var(--color-text);
    font-family: var(--font-family);
}

/* Header */
header {
    background-color: var(--color-primary);
    color: var(--color-white);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-md);
}

header nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
}

header nav ul {
    display: flex;
    gap: var(--spacing-lg);
}

header nav a {
    color: var(--color-white);
    transition: color 0.3s;
}

header nav a:hover {
    color: var(--color-secondary);
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: var(--color-white);
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-md);
}

.hero h2 {
    font-size: var(--font-size-xxl);
    margin-bottom: var(--spacing-md);
}

/* Main Content */
main {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-md);
}

.habitaciones-section h3 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-lg);
    text-align: center;
}

/* Grid de Habitaciones */
.habitaciones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-lg);
    margin-top: var(--spacing-lg);
}

/* Card de Habitación */
.habitacion-card {
    background: var(--color-white);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
}

.habitacion-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.habitacion-imagen img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.habitacion-info {
    padding: var(--spacing-md);
}

.habitacion-info h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-sm);
    color: var(--color-primary);
}

.habitacion-info .descripcion {
    color: #666;
    margin-bottom: var(--spacing-md);
    font-size: var(--font-size-sm);
}

.habitacion-info .precio {
    font-size: var(--font-size-lg);
    font-weight: bold;
    color: var(--color-success);
    margin-bottom: var(--spacing-sm);
}

.habitacion-info .estado {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-md);
}

.estado.disponible {
    background-color: var(--color-success);
    color: var(--color-white);
}

.estado.ocupada {
    background-color: var(--color-accent);
    color: var(--color-white);
}

.estado.mantenimiento {
    background-color: var(--color-warning);
    color: var(--color-white);
}

.btn-ver {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-secondary);
    color: var(--color-white);
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-base);
    transition: background-color 0.3s;
}

.btn-ver:hover {
    background-color: var(--color-primary);
}

/* Footer */
footer {
    background-color: var(--color-primary);
    color: var(--color-white);
    text-align: center;
    padding: var(--spacing-lg);
    margin-top: var(--spacing-xl);
}

/* Responsive */
@media (max-width: 768px) {
    .habitaciones-grid {
        grid-template-columns: 1fr;
    }
    
    header nav {
        flex-direction: column;
        gap: var(--spacing-md);
    }
}
```

---

#### 📄 `pages/nosotros.html`
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nosotros - Hospedaje Digital</title>
    <link rel="stylesheet" href="../css/reset.css">
    <link rel="stylesheet" href="../css/variables.css">
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <header>
        <nav>
            <h1>🏨 Hospedaje Digital</h1>
            <ul>
                <li><a href="../index.html">Inicio</a></li>
                <li><a href="nosotros.html">Nosotros</a></li>
                <li><a href="contacto.html">Contacto</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <h2>Sobre Nosotros</h2>
        <p>Bienvenido a Hospedaje Digital, tu mejor opción para alojamiento.</p>
    </main>

    <footer>
        <p>&copy; 2026 Hospedaje Digital</p>
    </footer>
</body>
</html>
```

---

#### 📄 `pages/contacto.html`
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contacto - Hospedaje Digital</title>
    <link rel="stylesheet" href="../css/reset.css">
    <link rel="stylesheet" href="../css/variables.css">
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <header>
        <nav>
            <h1>🏨 Hospedaje Digital</h1>
            <ul>
                <li><a href="../index.html">Inicio</a></li>
                <li><a href="nosotros.html">Nosotros</a></li>
                <li><a href="contacto.html">Contacto</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <h2>Contáctanos</h2>
        <p>Email: info@hospedajedigital.com</p>
        <p>Teléfono: +57 123 456 7890</p>
    </main>

    <footer>
        <p>&copy; 2026 Hospedaje Digital</p>
    </footer>
</body>
</html>
```

---

## 🚀 Cómo Usar Esta Plantilla

### 1. Copia cada archivo en su ubicación correspondiente

### 2. Inicia tu backend
```bash
cd HOSPEDAJE_DIGITAL
npm start
```

### 3. Abre tu frontend
- Opción A: Usa Live Server en VSCode (click derecho en `index.html`)
- Opción B: Abre directamente `index.html` en tu navegador

### 4. ¡Listo! Deberías ver las habitaciones cargándose desde el backend

---

## 🎯 Puntos Clave

1. **`js/api.js`** es el archivo más importante - contiene todas las funciones para comunicarte con el backend
2. Los scripts deben cargarse en orden: `api.js` → `app.js` → `eventos.js`
3. El backend debe estar corriendo en `http://localhost:3000`
4. Puedes personalizar los estilos en `css/styles.css` y `css/variables.css`

---

## 🔧 Personalización

- Cambia los colores en [`css/variables.css`](css/variables.css)
- Modifica el diseño en [`css/styles.css`](css/styles.css)
- Agrega más funciones en [`js/api.js`](js/api.js)
- Crea nuevas páginas en la carpeta `pages/`
