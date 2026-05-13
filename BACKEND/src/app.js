const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// =============================
// MIDDLEWARES
// =============================
app.use(cors());
app.use(express.json());
app.use("/img", express.static(path.join(__dirname, "public", "img")));

// =============================
// RUTAS
// =============================
const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const habitacionesRoutes = require("./routes/habitaciones.routes");
const reservasRoutes = require("./routes/reservas.routes");
const clientesRoutes = require("./routes/clientes.routes");
const paquetesRoutes = require("./routes/paquetes.routes");
const serviciosRoutes = require("./routes/servicios.routes");

const verificarToken = require("./middlewares/auth.middleware");

// Arrancar cliente WhatsApp al iniciar el servidor
require("./services/whatsapp.service");

// Importar rutas de acceso y administración
const passwordResetRoutes = require('./routes/passwordReset.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const rolesRoutes = require('./routes/roles.routes');
const permisosRoutes = require('./routes/permisos.routes');

// Rutas de autenticación y acceso
app.use("/api/auth", authRoutes);
app.use('/api/password-reset', passwordResetRoutes);

// Rutas de administración
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permisos', permisosRoutes);

// Rutas de la API (hotel)
app.use("/api/dashboard", verificarToken, dashboardRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/paquetes", paquetesRoutes);
app.use("/api/habitaciones", habitacionesRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/clientes", clientesRoutes);

// =============================
// FRONTEND ESTÁTICO
// =============================
app.use(express.static(path.join(__dirname, '../../FRONTEND')));

// =============================
// HEALTH CHECK
// =============================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'hospedaje_digital_backend',
        timestamp: new Date().toISOString()
    });
});

// =============================
// TODAS LAS DEMÁS RUTAS → FRONTEND
// =============================
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../FRONTEND', 'index.html'));
});

module.exports = app;