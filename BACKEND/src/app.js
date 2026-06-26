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
        if (!(await colExists('FechaLimiteComprobante'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN FechaLimiteComprobante DATETIME NULL');
            migracionHizo = true;
        }
        if (!(await colExists('FechaLimiteCargosAdicionales'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN FechaLimiteCargosAdicionales DATETIME NULL');
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

// Migración: IDHabitacion en reserva (necesario para bloqueo de fechas)
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';
        const colExists = async (col) => {
            const [[row]] = await db.query(
                'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
                [dbName, 'reserva', col]
            );
            return row.c > 0;
        };

        if (!(await colExists('IDHabitacion'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN IDHabitacion INT NULL');
            console.log('[MIGRATION] Columna IDHabitacion agregada a reserva.');
        }

        // Backfill: poblar IDHabitacion desde detallereservapaquetes → paquetes
        await db.query(`
            UPDATE reserva r
            JOIN (
                SELECT drp.IDReserva, MIN(p.IDHabitacion) AS IDHabitacion
                FROM detallereservapaquetes drp
                JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
                GROUP BY drp.IDReserva
            ) src ON r.IdReserva = src.IDReserva
            SET r.IDHabitacion = src.IDHabitacion
            WHERE r.IDHabitacion IS NULL
        `);

        // Invalidar cache para que el service detecte la nueva columna
        const svc = require('./services/reservas.service.js');
        if (typeof svc._resetColsCache === 'function') svc._resetColsCache();

        console.log('[MIGRATION] Migración IDHabitacion OK.');
    } catch (err) {
        console.error("[MIGRATION] Error en migración IDHabitacion:", err.message);
    }
})();

// Migración: columnas pre check-in en reserva
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';
        const colExists = async (col) => {
            const [[row]] = await db.query(
                'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
                [dbName, 'reserva', col]
            );
            return row.c > 0;
        };
        if (!(await colExists('CheckinEnviado')))
            await db.query('ALTER TABLE reserva ADD COLUMN CheckinEnviado TINYINT(1) DEFAULT 0');
        if (!(await colExists('CheckinNumPersonas')))
            await db.query('ALTER TABLE reserva ADD COLUMN CheckinNumPersonas INT NULL');
        if (!(await colExists('CheckinHoraLlegada')))
            await db.query('ALTER TABLE reserva ADD COLUMN CheckinHoraLlegada VARCHAR(10) NULL');
        if (!(await colExists('CheckinSolicitudes')))
            await db.query('ALTER TABLE reserva ADD COLUMN CheckinSolicitudes TEXT NULL');
        console.log('[MIGRATION] Columnas pre check-in OK.');
    } catch (err) {
        console.error("[MIGRATION] Error en migración pre check-in:", err.message);
    }
})();

(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS detallereservahabitaciones (
                IDDetalle     INT AUTO_INCREMENT PRIMARY KEY,
                IDReserva     INT NOT NULL,
                IDHabitacion  INT NOT NULL,
                Precio        DECIMAL(10,2) NOT NULL DEFAULT 0,
                Noches        INT NOT NULL DEFAULT 1,
                Estado        TINYINT(1) NOT NULL DEFAULT 1,
                INDEX idx_drh_reserva     (IDReserva),
                INDEX idx_drh_habitacion  (IDHabitacion)
            )
        `);
        console.log('[MIGRATION] Tabla detallereservahabitaciones OK.');
    } catch (err) {
        console.error("[MIGRATION] Error en migración detallereservahabitaciones:", err.message);
    }
})();

// Migración: EsAdicional en detallereservaservicio (distingue servicios originales de adicionales)
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';
        const [[row]] = await db.query(
            'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
            [dbName, 'detallereservaservicio', 'EsAdicional']
        );
        if (row.c === 0) {
            await db.query('ALTER TABLE detallereservaservicio ADD COLUMN EsAdicional TINYINT(1) NOT NULL DEFAULT 0');
            console.log('[MIGRATION] Columna EsAdicional agregada a detallereservaservicio.');
            const svc = require('./services/reservas.service.js');
            if (typeof svc._resetColsCache === 'function') svc._resetColsCache();
        }
    } catch (err) {
        console.error('[MIGRATION] Error en migración EsAdicional:', err.message);
    }
})();

// Migración: EstadoCargosAdicionales en reserva (estado independiente de los cargos post-reserva)
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';
        const [[row]] = await db.query(
            'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
            [dbName, 'reserva', 'EstadoCargosAdicionales']
        );
        if (row.c === 0) {
            await db.query('ALTER TABLE reserva ADD COLUMN EstadoCargosAdicionales INT NULL DEFAULT NULL');
            console.log('[MIGRATION] Columna EstadoCargosAdicionales agregada a reserva.');
        }
    } catch (err) {
        console.error('[MIGRATION] Error en migración EstadoCargosAdicionales:', err.message);
    }
})();

// Migración: ComprobanteCargos* en reserva (comprobante independiente para cargos adicionales)
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';
        const colExists = async (col) => {
            const [[row]] = await db.query(
                'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
                [dbName, 'reserva', col]
            );
            return row.c > 0;
        };
        let migro = false;
        if (!(await colExists('ComprobanteCargos'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN ComprobanteCargos VARCHAR(255) NULL');
            migro = true;
        }
        if (!(await colExists('ComprobanteCargosEstado'))) {
            await db.query("ALTER TABLE reserva ADD COLUMN ComprobanteCargosEstado VARCHAR(20) NULL DEFAULT 'pendiente'");
            migro = true;
        }
        if (!(await colExists('ComprobanteCargosFecha'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN ComprobanteCargosFecha DATETIME NULL');
            migro = true;
        }
        if (!(await colExists('ComprobanteCargosNota'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN ComprobanteCargosNota VARCHAR(255) NULL');
            migro = true;
        }
        if (migro) {
            const svc = require('./services/reservas.service.js');
            if (typeof svc._resetColsCache === 'function') svc._resetColsCache();
            console.log('[MIGRATION] Columnas ComprobanteCargos* agregadas a reserva.');
        }
    } catch (err) {
        console.error('[MIGRATION] Error en migración ComprobanteCargos:', err.message);
    }
})();

// Migración: tabla comprobante_cargos_historial (trazabilidad de todos los comprobantes de cargos adicionales)
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS comprobante_cargos_historial (
                id INT AUTO_INCREMENT PRIMARY KEY,
                IdReserva INT NOT NULL,
                ComprobanteCargos VARCHAR(255) NOT NULL,
                Estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
                Tipo VARCHAR(30) NULL,
                Nota VARCHAR(255) NULL,
                FechaSubida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FechaVerificacion DATETIME NULL,
                INDEX idx_reserva (IdReserva)
            )
        `);
        // Agregar columna Tipo si la tabla ya existía sin ella
        try {
            await db.query("ALTER TABLE comprobante_cargos_historial ADD COLUMN Tipo VARCHAR(30) NULL AFTER Estado");
        } catch (_) { /* columna ya existe */ }
        console.log('[MIGRATION] Tabla comprobante_cargos_historial verificada.');
    } catch (err) {
        console.error('[MIGRATION] Error en migración comprobante_cargos_historial:', err.message);
    }
})();

// Migración: columna ComprobanteCargosReferencia en reserva (tipo de cargo que originó la solicitud de comprobante)
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';
        const [[row]] = await db.query(
            'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
            [dbName, 'reserva', 'ComprobanteCargosReferencia']
        );
        if (row.c === 0) {
            await db.query("ALTER TABLE reserva ADD COLUMN ComprobanteCargosReferencia VARCHAR(30) NULL");
            console.log('[MIGRATION] Columna ComprobanteCargosReferencia agregada a reserva.');
        }
    } catch (err) {
        console.error('[MIGRATION] Error en migración ComprobanteCargosReferencia:', err.message);
    }
})();

// Migración: CostoExtension + NochesExtension en reserva (registro de días extendidos)
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';
        const colExists = async (col) => {
            const [[row]] = await db.query(
                'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
                [dbName, 'reserva', col]
            );
            return row.c > 0;
        };
        let migro = false;
        if (!(await colExists('CostoExtension'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN CostoExtension DECIMAL(12,2) NOT NULL DEFAULT 0');
            migro = true;
        }
        if (!(await colExists('NochesExtension'))) {
            await db.query('ALTER TABLE reserva ADD COLUMN NochesExtension INT NOT NULL DEFAULT 0');
            migro = true;
        }
        if (migro) {
            const svc = require('./services/reservas.service.js');
            if (typeof svc._resetColsCache === 'function') svc._resetColsCache();
            console.log('[MIGRATION] Columnas CostoExtension/NochesExtension agregadas a reserva.');
        }
    } catch (err) {
        console.error('[MIGRATION] Error en migración CostoExtension:', err.message);
    }
})();

// Migración: EstadoPago en detallereservaservicio + EstadoPagoExtension en reserva (tracking por ítem)
(async () => {
    try {
        const dbName = process.env.DB_NAME || 'hospedaje';
        const colExistsIn = async (table, col) => {
            const [[row]] = await db.query(
                'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
                [dbName, table, col]
            );
            return row.c > 0;
        };
        let migro = false;
        if (!(await colExistsIn('detallereservaservicio', 'EstadoPago'))) {
            await db.query("ALTER TABLE detallereservaservicio ADD COLUMN EstadoPago VARCHAR(20) NULL");
            // Backfill: marcar servicios adicionales como 'aprobado' en reservas ya confirmadas
            await db.query(`
                UPDATE detallereservaservicio drs
                JOIN reserva r ON drs.IDReserva = r.IdReserva
                SET drs.EstadoPago = 'aprobado'
                WHERE drs.EsAdicional = 1
                  AND drs.EstadoPago IS NULL
                  AND r.EstadoCargosAdicionales = 2
            `).catch(() => {});
            migro = true;
        }
        if (!(await colExistsIn('reserva', 'EstadoPagoExtension'))) {
            await db.query("ALTER TABLE reserva ADD COLUMN EstadoPagoExtension VARCHAR(20) NULL");
            // Backfill: extensiones en reservas ya confirmadas
            await db.query(`
                UPDATE reserva
                SET EstadoPagoExtension = 'aprobado'
                WHERE EstadoPagoExtension IS NULL
                  AND EstadoCargosAdicionales = 2
                  AND COALESCE(CostoExtension, 0) > 0
            `).catch(() => {});
            migro = true;
        }
        if (migro) {
            const svc = require('./services/reservas.service.js');
            if (typeof svc._resetColsCache === 'function') svc._resetColsCache();
            console.log('[MIGRATION] EstadoPago/EstadoPagoExtension agregados.');
        }
    } catch (err) {
        console.error('[MIGRATION] Error en migración EstadoPago:', err.message);
    }
})();

// Auto-sync de estados cada 60 s: cancela reservas con comprobante vencido, cierra estancias completadas
setInterval(async () => {
    try {
        const ReservasService = require('./services/reservas.service');
        await ReservasService.syncEstados();
    } catch (err) {
        console.error('[AutoSync] Error en syncEstados:', err.message);
    }
}, 60 * 1000);

// =============================
// MIDDLEWARES
// =============================
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
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

// Rutas públicas de pre check-in (acceso por link en email, sin token)
const reservasController = require('./controllers/reservas.controller');
app.get('/api/reservas/:id/checkin-info', reservasController.getCheckinInfo);
app.post('/api/reservas/:id/checkin-data', reservasController.submitCheckinData);

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
// LANDING PAGE POR DEFECTO
// =============================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../FRONTEND', 'landingPage.html'));
});

// =============================
// TODAS LAS DEMÁS RUTAS → FRONTEND
// =============================
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../../FRONTEND', 'index.html'));
});

module.exports = app;