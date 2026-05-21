-- ============================================================
-- MIGRACIÓN COMPLETA PARA RAILWAY
-- Ejecutar en MySQL Workbench conectado a Railway
-- NO incluye CREATE DATABASE ni USE (Railway ya los maneja)
-- ============================================================

-- ── ROLES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    IDRol INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(255),
    Estado VARCHAR(50),
    IsActive TINYINT(1) DEFAULT 1,
    Permisos JSON
);

INSERT IGNORE INTO roles (IDRol, Nombre, Estado, IsActive) VALUES
(1, 'Administrador', 'activo', 1),
(2, 'Empleado',      'activo', 1),
(3, 'Cliente',       'activo', 1);

-- ── USUARIOS (agregar columnas faltantes si no existen) ───────
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS IsActive TINYINT(1) DEFAULT 1,
    ADD COLUMN IF NOT EXISTS requiereCambioPassword TINYINT(1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS IDRol INT;

-- Asignar rol Administrador al usuario admin@hotel.com
UPDATE usuarios SET IDRol = 1, IsActive = 1 WHERE Email = 'admin@hotel.com';
-- Los demás usuarios quedan como Cliente
UPDATE usuarios SET IDRol = 3, IsActive = 1 WHERE IDRol IS NULL;

-- ── PERMISOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permisos (
    IDPermiso INT AUTO_INCREMENT PRIMARY KEY,
    NombrePermisos VARCHAR(255),
    EstadoPermisos VARCHAR(50) DEFAULT 'activo',
    Descripcion VARCHAR(255),
    IsActive TINYINT(1) DEFAULT 1
);

-- ── ROLES-PERMISOS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rolespermisos (
    IDRolPermiso INT AUTO_INCREMENT PRIMARY KEY,
    IDRol INT,
    IDPermiso INT,
    FOREIGN KEY (IDRol)    REFERENCES roles(IDRol),
    FOREIGN KEY (IDPermiso) REFERENCES permisos(IDPermiso)
);

-- ── CLIENTE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
    IDCliente    INT AUTO_INCREMENT PRIMARY KEY,
    NroDocumento VARCHAR(50),
    Nombre       VARCHAR(100),
    Apellido     VARCHAR(100),
    Direccion    VARCHAR(255),
    Email        VARCHAR(100),
    Telefono     VARCHAR(50),
    Estado       TINYINT(1) DEFAULT 1,
    IDRol        INT,
    FOREIGN KEY (IDRol) REFERENCES roles(IDRol)
);

-- ── HABITACIONES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habitaciones (
    IDHabitacion    INT AUTO_INCREMENT PRIMARY KEY,
    NombreHabitacion VARCHAR(100) NOT NULL,
    ImagenHabitacion MEDIUMBLOB,
    Descripcion      TEXT,
    Costo            FLOAT NOT NULL,
    Estado           TINYINT(1) NOT NULL DEFAULT 1
);

-- ── SERVICIOS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicios (
    IDServicio           INT AUTO_INCREMENT PRIMARY KEY,
    NombreServicio       VARCHAR(100) NOT NULL,
    Descripcion          TEXT,
    Duracion             VARCHAR(50),
    CantidadMaximaPersonas INT,
    Costo                FLOAT NOT NULL DEFAULT 0,
    Estado               TINYINT(1) NOT NULL DEFAULT 1,
    ImagenServicio       MEDIUMBLOB,
    HorarioDisponible    VARCHAR(255)
);

-- ── ESTADOS RESERVA ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estadosreserva (
    IdEstadoReserva     INT AUTO_INCREMENT PRIMARY KEY,
    NombreEstadoReserva VARCHAR(50)
);

INSERT IGNORE INTO estadosreserva (IdEstadoReserva, NombreEstadoReserva) VALUES
(1, 'Pendiente'),
(2, 'Confirmada'),
(3, 'Cancelada'),
(4, 'Completada');

-- ── MÉTODOS DE PAGO ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metodopago (
    IdMetodoPago INT AUTO_INCREMENT PRIMARY KEY,
    NomMetodoPago VARCHAR(50)
);

INSERT IGNORE INTO metodopago (IdMetodoPago, NomMetodoPago) VALUES
(1, 'Efectivo'),
(2, 'Tarjeta Crédito'),
(3, 'Tarjeta Débito'),
(4, 'Transferencia');

-- ── RESERVAS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservas (
    IDReserva           INT AUTO_INCREMENT PRIMARY KEY,
    IDUsuario           INT,
    IDCliente           INT,
    IDHabitacion        INT,
    FechaReserva        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FechaInicio         DATE,
    FechaFinalizacion   DATE,
    SubTotal            FLOAT,
    Descuento           FLOAT DEFAULT 0,
    IVA                 FLOAT DEFAULT 0,
    MontoTotal          FLOAT,
    IdMetodoPago        INT,
    IdEstadoReserva     INT DEFAULT 1,
    Notas               TEXT,
    FOREIGN KEY (IDUsuario)       REFERENCES usuarios(IDUsuario),
    FOREIGN KEY (IdMetodoPago)    REFERENCES metodopago(IdMetodoPago),
    FOREIGN KEY (IdEstadoReserva) REFERENCES estadosreserva(IdEstadoReserva)
);

-- ── DETALLE RESERVA SERVICIOS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS detallereservaservicio (
    IDDetalle   INT AUTO_INCREMENT PRIMARY KEY,
    IDReserva   INT,
    IDServicio  INT,
    Cantidad    INT DEFAULT 1,
    Precio      FLOAT,
    Estado      TINYINT(1) DEFAULT 1,
    FOREIGN KEY (IDReserva)  REFERENCES reservas(IDReserva),
    FOREIGN KEY (IDServicio) REFERENCES servicios(IDServicio)
);

-- ── PAQUETES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paquetes (
    IDPaquete    INT AUTO_INCREMENT PRIMARY KEY,
    NombrePaquete VARCHAR(100) NOT NULL,
    ImagenPaquete MEDIUMBLOB,
    Descripcion   TEXT,
    IDHabitacion  INT,
    IDServicio    INT,
    Precio        FLOAT,
    Estado        TINYINT(1) DEFAULT 1,
    FOREIGN KEY (IDHabitacion) REFERENCES habitaciones(IDHabitacion),
    FOREIGN KEY (IDServicio)   REFERENCES servicios(IDServicio)
);

-- ── VERIFICACIÓN FINAL ────────────────────────────────────────
SELECT 'roles'         AS Tabla, COUNT(*) AS Filas FROM roles
UNION ALL SELECT 'usuarios',      COUNT(*) FROM usuarios
UNION ALL SELECT 'habitaciones',  COUNT(*) FROM habitaciones
UNION ALL SELECT 'servicios',     COUNT(*) FROM servicios
UNION ALL SELECT 'estadosreserva',COUNT(*) FROM estadosreserva
UNION ALL SELECT 'metodopago',    COUNT(*) FROM metodopago;
