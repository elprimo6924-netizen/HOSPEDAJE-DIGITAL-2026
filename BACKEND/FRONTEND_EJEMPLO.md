# 🌐 Cómo Conectar Frontend con Backend

## 📋 Configuración Actual

Tu **backend** está configurado para:
- Correr en: `http://localhost:3000`
- Aceptar peticiones desde cualquier origen (CORS habilitado)
- Endpoints disponibles:
  - `http://localhost:3000/api/habitaciones`
  - `http://localhost:3000/api/servicios`
  - `http://localhost:3000/api/clientes`
  - `http://localhost:3000/api/reservas`

---

## 🚀 Pasos para Separar Frontend y Backend

### 1️⃣ Estructura de Carpetas Recomendada

```
📁 TU_PROYECTO/
├── 📁 HOSPEDAJE_DIGITAL/     ← Backend (carpeta actual)
│   ├── src/
│   ├── public/
│   ├── index.js
│   └── package.json
│
└── 📁 mi-proyecto-frontend/  ← Tu nuevo frontend
    ├── index.html
    ├── /pages
    │   ├── nosotros.html
    │   └── contacto.html
    ├── /css
    │   ├── styles.css
    │   ├── reset.css
    │   └── variables.css
    ├── /js
    │   ├── app.js
    │   ├── eventos.js
    │   └── api.js          ← ⭐ Archivo clave para conectar con backend
    ├── /assets
    │   ├── /images
    │   ├── /icons
    │   └── /fonts
    └── /components
        ├── header.html
        └── footer.html
```

### 2️⃣ Iniciar el Backend

```bash
cd backend
npm start
# El servidor correrá en http://localhost:3000
```

### 3️⃣ Ejemplos de Código para el Frontend

#### 📝 Archivo Principal: `/js/api.js` ⭐

Este es el archivo más importante. Aquí defines todas las funciones para comunicarte con el backend:

**archivo: mi-proyecto-frontend/js/api.js**
```javascript
// ============================================
// CONFIGURACIÓN DE LA API
// ============================================
const API_URL = 'http://localhost:3000/api';

// ============================================
// FUNCIONES PARA HABITACIONES
// ============================================

// Obtener todas las habitaciones
async function obtenerHabitaciones() {
    try {
        const response = await fetch(`${API_URL}/habitaciones`);
        if (!response.ok) throw new Error('Error al obtener habitaciones');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// Obtener una habitación por ID
async function obtenerHabitacionPorId(id) {
    try {
        const response = await fetch(`${API_URL}/habitaciones/${id}`);
        if (!response.ok) throw new Error('Error al obtener habitación');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Crear nueva habitación
async function crearHabitacion(habitacion) {
    try {
        const response = await fetch(`${API_URL}/habitaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(habitacion)
        });
        if (!response.ok) throw new Error('Error al crear habitación');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// ============================================
// FUNCIONES PARA CLIENTES
// ============================================

// Obtener todos los clientes
async function obtenerClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        if (!response.ok) throw new Error('Error al obtener clientes');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// Crear nuevo cliente
async function crearCliente(cliente) {
    try {
        const response = await fetch(`${API_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cliente)
        });
        if (!response.ok) throw new Error('Error al crear cliente');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// ============================================
// FUNCIONES PARA RESERVAS
// ============================================

// Obtener todas las reservas
async function obtenerReservas() {
    try {
        const response = await fetch(`${API_URL}/reservas`);
        if (!response.ok) throw new Error('Error al obtener reservas');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// Crear nueva reserva
async function crearReserva(reserva) {
    try {
        const response = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reserva)
        });
        if (!response.ok) throw new Error('Error al crear reserva');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// ============================================
// FUNCIONES PARA SERVICIOS
// ============================================

// Obtener todos los servicios
async function obtenerServicios() {
    try {
        const response = await fetch(`${API_URL}/servicios`);
        if (!response.ok) throw new Error('Error al obtener servicios');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}
```

---

#### 📝 Archivo: `/js/app.js`

Este archivo usa las funciones de `api.js` para mostrar datos en tu página:

**archivo: mi-proyecto-frontend/js/app.js**
```javascript
// ============================================
// FUNCIONES PARA MOSTRAR DATOS EN EL HTML
// ============================================

// Mostrar habitaciones en el HTML
function mostrarHabitaciones(habitaciones) {
    const contenedor = document.getElementById('habitaciones');
    if (!contenedor) return;
    
    contenedor.innerHTML = ''; // Limpiar contenedor
    
    habitaciones.forEach(habitacion => {
        const div = document.createElement('div');
        div.className = 'habitacion-card';
        div.innerHTML = `
            <h3>${habitacion.NombreHabitacion}</h3>
            <img src="${habitacion.ImagenHabitacion}" alt="${habitacion.NombreHabitacion}">
            <p>${habitacion.Descripcion}</p>
            <p class="precio">$${habitacion.Costo}</p>
            <p class="estado">Estado: ${habitacion.Estado}</p>
            <button onclick="reservarHabitacion(${habitacion.id})">Reservar</button>
        `;
        contenedor.appendChild(div);
    });
}

// Cargar habitaciones cuando la página cargue
async function cargarHabitaciones() {
    const habitaciones = await obtenerHabitaciones();
    mostrarHabitaciones(habitaciones);
}

// Función para reservar habitación
async function reservarHabitacion(habitacionId) {
    // Aquí puedes agregar lógica para crear una reserva
    console.log('Reservando habitación:', habitacionId);
    alert('Funcionalidad de reserva en desarrollo');
}

// ============================================
// INICIALIZAR CUANDO CARGUE LA PÁGINA
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cargarHabitaciones();
});
```

---

#### 📝 Archivo: `index.html`

**archivo: mi-proyecto-frontend/index.html**
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
    <!-- Header -->
    <header>
        <nav>
            <h1>Hospedaje Digital</h1>
            <ul>
                <li><a href="index.html">Inicio</a></li>
                <li><a href="pages/nosotros.html">Nosotros</a></li>
                <li><a href="pages/contacto.html">Contacto</a></li>
            </ul>
        </nav>
    </header>

    <!-- Contenido Principal -->
    <main>
        <section class="hero">
            <h2>Habitaciones Disponibles</h2>
        </section>

        <section id="habitaciones" class="habitaciones-grid">
            <!-- Las habitaciones se cargarán aquí dinámicamente -->
            <p>Cargando habitaciones...</p>
        </section>
    </main>

    <!-- Footer -->
    <footer>
        <p>&copy; 2026 Hospedaje Digital. Todos los derechos reservados.</p>
    </footer>

    <!-- Scripts -->
    <script src="js/api.js"></script>      <!-- ⭐ Primero carga api.js -->
    <script src="js/app.js"></script>      <!-- Luego app.js -->
    <script src="js/eventos.js"></script>  <!-- Finalmente eventos.js -->
</body>
</html>
```

---

#### 📝 Archivo: `/js/eventos.js`

Este archivo maneja eventos específicos de tu aplicación:

**archivo: mi-proyecto-frontend/js/eventos.js**
```javascript
// ============================================
// EVENTOS Y FORMULARIOS
// ============================================

// Evento para formulario de reserva
document.addEventListener('DOMContentLoaded', () => {
    const formReserva = document.getElementById('form-reserva');
    
    if (formReserva) {
        formReserva.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const reserva = {
                cliente_id: document.getElementById('cliente_id').value,
                habitacion_id: document.getElementById('habitacion_id').value,
                fecha_entrada: document.getElementById('fecha_entrada').value,
                fecha_salida: document.getElementById('fecha_salida').value,
                estado: 'confirmada'
            };
            
            const resultado = await crearReserva(reserva);
            
            if (resultado) {
                alert('¡Reserva creada exitosamente!');
                formReserva.reset();
            } else {
                alert('Error al crear la reserva');
            }
        });
    }
});

// Evento para filtrar habitaciones
function filtrarHabitaciones(tipo) {
    obtenerHabitaciones().then(habitaciones => {
        const filtradas = tipo === 'todas' 
            ? habitaciones 
            : habitaciones.filter(h => h.tipo === tipo);
        mostrarHabitaciones(filtradas);
    });
}
```

---

#### 📝 Archivo: `/css/variables.css`

**archivo: mi-proyecto-frontend/css/variables.css**
```css
:root {
    /* Colores */
    --color-primary: #2c3e50;
    --color-secondary: #3498db;
    --color-accent: #e74c3c;
    --color-background: #ecf0f1;
    --color-text: #2c3e50;
    
    /* Espaciado */
    --spacing-small: 8px;
    --spacing-medium: 16px;
    --spacing-large: 32px;
    
    /* Fuentes */
    --font-family: 'Arial', sans-serif;
    --font-size-base: 16px;
    --font-size-large: 24px;
}
```

---

#### 📝 Ejemplo Completo: Página de Contacto

**archivo: mi-proyecto-frontend/pages/contacto.html**
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
            <h1>Hospedaje Digital</h1>
            <ul>
                <li><a href="../index.html">Inicio</a></li>
                <li><a href="nosotros.html">Nosotros</a></li>
                <li><a href="contacto.html">Contacto</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <h2>Contáctanos</h2>
        
        <form id="form-contacto">
            <input type="text" id="nombre" placeholder="Nombre" required>
            <input type="email" id="email" placeholder="Email" required>
            <textarea id="mensaje" placeholder="Mensaje" required></textarea>
            <button type="submit">Enviar</button>
        </form>
    </main>

    <footer>
        <p>&copy; 2026 Hospedaje Digital</p>
    </footer>

    <script src="../js/api.js"></script>
    <script src="../js/app.js"></script>
    <script src="../js/eventos.js"></script>
</body>
</html>
```

---

#### 📝 Ejemplo 2: Con React

**archivo: frontend/src/App.jsx**
```javascript
import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api';

function App() {
    const [habitaciones, setHabitaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        obtenerHabitaciones();
    }, []);

    const obtenerHabitaciones = async () => {
        try {
            const response = await fetch(`${API_URL}/habitaciones`);
            const data = await response.json();
            setHabitaciones(data);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div>
            <h1>Habitaciones Disponibles</h1>
            {habitaciones.map(habitacion => (
                <div key={habitacion.id}>
                    <h3>Habitación {habitacion.numero}</h3>
                    <p>Tipo: {habitacion.tipo}</p>
                    <p>Precio: ${habitacion.precio}</p>
                </div>
            ))}
        </div>
    );
}

export default App;
```

#### 📝 Ejemplo 3: Crear una Reserva (POST)

```javascript
const API_URL = 'http://localhost:3000/api';

async function crearReserva(datosReserva) {
    try {
        const response = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosReserva)
        });

        const data = await response.json();
        console.log('Reserva creada:', data);
        return data;
    } catch (error) {
        console.error('Error al crear reserva:', error);
    }
}

// Ejemplo de uso:
const nuevaReserva = {
    cliente_id: 1,
    habitacion_id: 2,
    fecha_entrada: '2026-04-01',
    fecha_salida: '2026-04-05',
    estado: 'confirmada'
};

crearReserva(nuevaReserva);
```

---

## 🔧 Configuración para Producción

Cuando vayas a publicar tu aplicación, debes cambiar la configuración de CORS en [`src/app.js`](src/app.js:13):

```javascript
// En lugar de:
app.use(cors({
    origin: '*', // ❌ No usar en producción
    ...
}));

// Usa:
app.use(cors({
    origin: 'https://tu-frontend.com', // ✅ URL específica de tu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🛠️ Herramientas para Servir el Frontend

### Opción 1: Live Server (VSCode Extension)
1. Instala la extensión "Live Server" en VSCode
2. Click derecho en `index.html` → "Open with Live Server"
3. Se abrirá en `http://localhost:5500` (o similar)

### Opción 2: http-server (Node.js)
```bash
cd frontend
npx http-server -p 8080
# Se abrirá en http://localhost:8080
```

### Opción 3: Python
```bash
cd frontend
python -m http.server 8000
# Se abrirá en http://localhost:8000
```

---

## 📚 Todos los Endpoints Disponibles

### Habitaciones
- `GET /api/habitaciones` - Obtener todas las habitaciones
- `GET /api/habitaciones/:id` - Obtener una habitación específica
- `POST /api/habitaciones` - Crear nueva habitación
- `PUT /api/habitaciones/:id` - Actualizar habitación
- `DELETE /api/habitaciones/:id` - Eliminar habitación

### Servicios
- `GET /api/servicios` - Obtener todos los servicios
- `GET /api/servicios/:id` - Obtener un servicio específico
- `POST /api/servicios` - Crear nuevo servicio
- `PUT /api/servicios/:id` - Actualizar servicio
- `DELETE /api/servicios/:id` - Eliminar servicio

### Clientes
- `GET /api/clientes` - Obtener todos los clientes
- `GET /api/clientes/:id` - Obtener un cliente específico
- `POST /api/clientes` - Crear nuevo cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Reservas
- `GET /api/reservas` - Obtener todas las reservas
- `GET /api/reservas/:id` - Obtener una reserva específica
- `POST /api/reservas` - Crear nueva reserva
- `PUT /api/reservas/:id` - Actualizar reserva
- `DELETE /api/reservas/:id` - Eliminar reserva

---

## ⚠️ Solución de Problemas Comunes

### Error: "CORS policy blocked"
✅ **Solución:** Ya está configurado CORS en tu backend. Asegúrate de que el backend esté corriendo.

### Error: "Failed to fetch"
✅ **Solución:** Verifica que:
1. El backend esté corriendo en `http://localhost:3000`
2. La URL en tu frontend sea correcta
3. No haya errores en la consola del backend

### Error: "Cannot GET /api/..."
✅ **Solución:** Verifica que la ruta del endpoint sea correcta y que el backend esté corriendo.

---

## 💡 Consejos para Principiantes

1. **Siempre inicia el backend primero** antes de probar el frontend
2. **Usa la consola del navegador** (F12) para ver errores
3. **Usa `console.log()`** para ver qué datos recibes del backend
4. **Prueba los endpoints primero** con herramientas como:
   - Navegador: `http://localhost:3000/api/habitaciones`
   - Postman
   - Thunder Client (extensión de VSCode)

---

## 🎯 Próximos Pasos

1. Crea una carpeta `frontend` separada
2. Copia uno de los ejemplos de código de arriba
3. Inicia tu backend: `npm start`
4. Abre tu frontend con Live Server o cualquier servidor local
5. ¡Verás los datos de tu backend en el frontend!

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) y la terminal del backend para ver mensajes de error.
