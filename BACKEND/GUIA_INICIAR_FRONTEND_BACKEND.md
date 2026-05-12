# 🚀 Guía Paso a Paso: Iniciar Frontend y Backend

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener:
- ✅ Node.js instalado
- ✅ MySQL corriendo
- ✅ Base de datos `hospedaje_digital` creada
- ✅ VSCode instalado (recomendado)

---

## 🎯 Paso 1: Iniciar el Backend

### 1.1 Abrir Terminal en la Carpeta del Backend

**Opción A: Desde VSCode**
1. Abre VSCode
2. Ve a `Archivo` → `Abrir Carpeta`
3. Selecciona la carpeta `HOSPEDAJE_DIGITAL`
4. Presiona `` Ctrl + ` `` (o `Ver` → `Terminal`) para abrir la terminal

**Opción B: Desde el Explorador de Windows**
1. Navega a la carpeta `HOSPEDAJE_DIGITAL`
2. Haz clic derecho en un espacio vacío
3. Selecciona "Abrir en Terminal" o "Git Bash Here"

### 1.2 Iniciar el Servidor Backend

En la terminal, ejecuta:

```bash
npm start
```

**Deberías ver algo como:**
```
Servidor corriendo en http://localhost:3000
Conectado a la base de datos MySQL
```

✅ **¡El backend ya está corriendo!** Déjalo abierto y no cierres esta terminal.

---

## 🎨 Paso 2: Abrir el Frontend

Ahora necesitas abrir tu carpeta de frontend en otra ventana.

### 2.1 Ubicar la Carpeta del Frontend

Tu frontend está en:
```
C:\Users\mauri\OneDrive\Escritorio\NODE\mi-proyecto-frontend
```

### 2.2 Abrir el Frontend en VSCode

**Opción A: Nueva Ventana de VSCode**
1. Abre una **nueva ventana** de VSCode (`Archivo` → `Nueva Ventana`)
2. Ve a `Archivo` → `Abrir Carpeta`
3. Selecciona la carpeta `mi-proyecto-frontend`

**Opción B: Desde el Explorador**
1. Navega a `C:\Users\mauri\OneDrive\Escritorio\NODE\mi-proyecto-frontend`
2. Haz clic derecho en la carpeta
3. Selecciona "Abrir con Code"

---

## 🌐 Paso 3: Iniciar el Frontend con Live Server

### 3.1 Instalar Live Server (si no lo tienes)

1. En VSCode, ve a la barra lateral izquierda
2. Haz clic en el ícono de **Extensiones** (cuadrado con 4 cuadrados)
3. Busca "Live Server"
4. Haz clic en **Instalar** en la extensión de Ritwick Dey

### 3.2 Iniciar Live Server

1. En VSCode, abre el archivo `index.html` de tu frontend
2. Haz clic derecho en cualquier parte del código
3. Selecciona **"Open with Live Server"**

**O también puedes:**
- Hacer clic en el botón "Go Live" en la barra inferior de VSCode

### 3.3 ¿Qué Debería Pasar?

- Se abrirá tu navegador automáticamente
- La URL será algo como: `http://127.0.0.1:5500` o `http://localhost:5500`
- Verás tu página web cargada

---

## 🔗 Paso 4: Verificar la Conexión Frontend-Backend

### 4.1 Verificar en el Navegador

1. Abre las **Herramientas de Desarrollador** (presiona `F12`)
2. Ve a la pestaña **Console**
3. Deberías ver mensajes como:
   ```
   🚀 Frontend iniciado correctamente
   ```
4. Si hay datos en tu base de datos, deberías ver las habitaciones y servicios cargados

### 4.2 Verificar en la Terminal del Backend

En la terminal donde corre el backend, deberías ver peticiones como:
```
GET /api/habitaciones 200
GET /api/servicios 200
GET /api/reservas 200
```

---

## 📝 Resumen de URLs

Una vez que todo esté corriendo:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Backend API** | `http://localhost:3000/api` | Servidor backend |
| **Frontend** | `http://localhost:5500` | Interfaz de usuario |
| **Habitaciones** | `http://localhost:3000/api/habitaciones` | Endpoint de habitaciones |
| **Servicios** | `http://localhost:3000/api/servicios` | Endpoint de servicios |
| **Reservas** | `http://localhost:3000/api/reservas` | Endpoint de reservas |
| **Clientes** | `http://localhost:3000/api/clientes` | Endpoint de clientes |

---

## 🐛 Solución de Problemas

### Problema 1: El backend no inicia

**Error:** `Cannot connect to MySQL`

**Solución:**
1. Verifica que MySQL esté corriendo
2. Abre MySQL Workbench o phpMyAdmin
3. Verifica que la base de datos `hospedaje_digital` exista
4. Revisa las credenciales en tu archivo de configuración

### Problema 2: El frontend no carga datos

**Error:** `Failed to fetch` en la consola

**Solución:**
1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. Abre `http://localhost:3000/api/habitaciones` en tu navegador
3. Deberías ver datos en formato JSON
4. Si no ves datos, revisa la base de datos

### Problema 3: Error de CORS

**Error:** `Access to fetch has been blocked by CORS policy`

**Solución:**
- Tu backend ya tiene CORS configurado
- Si aún tienes problemas, verifica que [`src/app.js`](src/app.js) tenga:
  ```javascript
  app.use(cors({
      origin: '*'
  }));
  ```

### Problema 4: Live Server no funciona

**Alternativa 1: Usar Python**
```bash
cd mi-proyecto-frontend
python -m http.server 8000
```
Luego abre: `http://localhost:8000`

**Alternativa 2: Usar Node.js**
```bash
cd mi-proyecto-frontend
npx http-server -p 8080
```
Luego abre: `http://localhost:8080`

---

## 🎓 Flujo de Trabajo Diario

Cada vez que quieras trabajar en tu proyecto:

### 1️⃣ Iniciar Backend
```bash
cd HOSPEDAJE_DIGITAL
npm start
```

### 2️⃣ Iniciar Frontend
- Abre `mi-proyecto-frontend` en VSCode
- Haz clic derecho en `index.html`
- Selecciona "Open with Live Server"

### 3️⃣ Trabajar
- Edita tu código
- Los cambios en el frontend se verán automáticamente (Live Server recarga la página)
- Los cambios en el backend requieren reiniciar el servidor (Ctrl+C y luego `npm start`)

### 4️⃣ Detener Todo
- **Backend:** Presiona `Ctrl + C` en la terminal
- **Frontend:** Haz clic en "Port: 5500" en la barra inferior de VSCode y selecciona "Stop Live Server"

---

## 💡 Consejos Útiles

### Mantener Dos Ventanas de VSCode Abiertas

Es recomendable tener:
- **Ventana 1:** Backend (`HOSPEDAJE_DIGITAL`)
- **Ventana 2:** Frontend (`mi-proyecto-frontend`)

Así puedes ver y editar ambos al mismo tiempo.

### Usar la Consola del Navegador

Presiona `F12` para abrir las herramientas de desarrollador:
- **Console:** Ver errores de JavaScript
- **Network:** Ver peticiones al backend
- **Elements:** Inspeccionar HTML y CSS

### Verificar que el Backend Funciona

Abre en tu navegador:
```
http://localhost:3000/api/habitaciones
```

Deberías ver datos en formato JSON.

---

## 📚 Archivos Importantes

### En el Backend (HOSPEDAJE_DIGITAL)
- [`src/app.js`](src/app.js) - Configuración principal
- [`src/routes/`](src/routes/) - Rutas de la API
- [`src/controllers/`](src/controllers/) - Lógica de negocio
- [`src/models/`](src/models/) - Modelos de base de datos

### En el Frontend (mi-proyecto-frontend)
- `index.html` - Página principal
- `js/api.js` - Funciones para conectar con el backend
- `js/main.js` - Lógica principal
- `css/styles.css` - Estilos

---

## ✅ Checklist de Inicio

Antes de empezar a trabajar, verifica:

- [ ] MySQL está corriendo
- [ ] Base de datos `hospedaje_digital` existe
- [ ] Backend inicia sin errores (`npm start`)
- [ ] Frontend abre en el navegador
- [ ] Consola del navegador no muestra errores
- [ ] Datos se cargan correctamente

---

## 🎉 ¡Listo!

Ahora tienes tu frontend y backend corriendo y conectados. Puedes:
- Ver habitaciones y servicios
- Crear reservas
- Modificar el código y ver los cambios en tiempo real

¡Disfruta programando! 🚀
