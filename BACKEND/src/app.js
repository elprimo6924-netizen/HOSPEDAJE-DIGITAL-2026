const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./config/db");

const app = express();

// Migración automática de columnas faltantes en usuarios
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';
        const [cols] = await db.query(
            'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?,?)',
            [dbName, 'usuarios', 'IsActive', 'requiereCambioPassword']
        );
        const existing = cols.map(c => c.COLUMN_NAME);
        if (!existing.includes('IsActive'))
            await db.query('ALTER TABLE usuarios ADD COLUMN IsActive TINYINT(1) DEFAULT 1');
        if (!existing.includes('requiereCambioPassword'))
            await db.query('ALTER TABLE usuarios ADD COLUMN requiereCambioPassword TINYINT(1) DEFAULT 0');
    } catch (err) {
        console.error("[MIGRATION] Error aplicando migración de usuarios:", err.message);
    }
})();

// Migración automática: comprobante de pago
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';

        // Ampliar NombreEstadoReserva si sigue siendo VARCHAR(15) — necesita ≥26 chars
        await db.query(
            "ALTER TABLE estadosreserva MODIFY COLUMN NombreEstadoReserva VARCHAR(50)"
        ).catch(() => {}); // ignorar si la tabla no existe aún

        // Estado 5 — Pendiente Verificación Pago
        await db.query(
            "INSERT IGNORE INTO estadosreserva (IdEstadoReserva, NombreEstadoReserva) VALUES (5, 'Pendiente Verificación Pago')"
        );

        // Columnas Comprobante* en reserva
        const colExists = async (col) => {
            const [[row]] = await db.query(
                'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
                [dbName, 'reserva', col]
            );
            return row.c > 0;
        };
        let migracionHizo = false;
        if (!(await colExists('ComprobantePago'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN ComprobantePago VARCHAR(255) NULL');
            migracionHizo = true;
        }
        if (!(await colExists('ComprobanteFecha'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN ComprobanteFecha DATETIME NULL');
            migracionHizo = true;
        }
        if (!(await colExists('ComprobanteEstado'))) {
            await db.query("ALTER TABLE reserva ADD COLUMN ComprobanteEstado VARCHAR(20) NULL DEFAULT 'pendiente'");
            migracionHizo = true;
        }
        if (!(await colExists('ComprobanteNota'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN ComprobanteNota VARCHAR(255) NULL');
            migracionHizo = true;
        }

        // Invalidar cache del service para que lea las nuevas columnas
        if (migracionHizo) {
            const svc = require('./services/reservas.service.js');
            if (typeof svc._resetColsCache === 'function') svc._resetColsCache();
        }

        console.log('[MIGRATION] Migración comprobante de pago OK.');
    } catch (err) {
        console.error("[MIGRATION] Error aplicando migración de comprobante:", err.message);
    }
})();

// =============================
// MIDDLEWARES
// =============================
app.use(cors());
app.use(express.json());
app.use("/img",     express.static(path.join(__dirname, "public", "img")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

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

// =============================
// RUTAS PÚBLICAS (sin token)
// =============================
const paquetesController    = require('./controllers/paquetes.controller');
const serviciosController   = require('./controllers/servicios.controller');
const habitacionesController = require('./controllers/habitaciones.controller');

app.get('/api/paquetes/activos',       paquetesController.listarActivos);
app.get('/api/servicios/activos',      serviciosController.listarActivos);
app.get('/api/habitaciones/disponibles', habitacionesController.disponibles);

// Rutas de autenticación y acceso
app.use("/api/auth", authRoutes);
app.use('/api/password-reset', passwordResetRoutes);

// Rutas de administración
app.use('/api/usuarios', verificarToken, usuariosRoutes);
app.use('/api/roles', verificarToken, rolesRoutes);
app.use('/api/permisos', verificarToken, permisosRoutes);

// Rutas de la API (hotel)
app.use("/api/dashboard", verificarToken, dashboardRoutes);
app.use("/api/reservas", verificarToken, reservasRoutes);
app.use("/api/paquetes", verificarToken, paquetesRoutes);
app.use("/api/habitaciones", verificarToken, habitacionesRoutes);
app.use("/api/servicios", verificarToken, serviciosRoutes);
app.use("/api/clientes", verificarToken, clientesRoutes);

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
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../../FRONTEND', 'index.html'));
});

module.exports = app;