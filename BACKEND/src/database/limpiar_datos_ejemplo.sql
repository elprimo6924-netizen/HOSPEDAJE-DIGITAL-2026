-- =============================================================
--  SCRIPT DE LIMPIEZA DE DATOS DE EJEMPLO
--  Hospedaje Digital — ejecutar UNA SOLA VEZ contra la BD
--
--  QUÉ HACE:
--    Elimina únicamente los registros insertados por insertar_datos.js
--    identificándolos por sus valores exactos (nombre, email, NroDocumento),
--    NO por rango de IDs, para no afectar datos reales que compartan IDs.
--
--  ANTES DE EJECUTAR:
--    1. Revisar la sección PREVIEW y verificar que los conteos son los esperados.
--    2. Hacer un backup: mysqldump -u<user> -p<pass> <base> > backup.sql
--    3. Ejecutar dentro de una transacción (el script lo gestiona solo).
--
--  TABLAS AFECTADAS (en orden):
--    detallereservaservicio → detallereservapaquetes → reserva
--    → clientes → usuarios → servicio → habitacion
--
--  TABLAS NO AFECTADAS:
--    roles, paquetes, paquete_servicios, cualquier otra tabla
-- =============================================================

-- ──────────────────────────────────────────────────────────────
--  SECCIÓN 1: PREVIEW — ejecutar esto primero para verificar
-- ──────────────────────────────────────────────────────────────

SELECT 'PREVIEW: reservas de clientes de ejemplo' AS descripcion,
       COUNT(*) AS registros
FROM reserva
WHERE NroDocumentoCliente IN (
    '1001234567','1002345678','1003456789','1004567890','1005678901',
    '1006789012','1007890123','1008901234','1009012345','1011123456'
);

SELECT 'PREVIEW: clientes de ejemplo' AS descripcion, COUNT(*) AS registros
FROM clientes
WHERE NroDocumento IN (
    '1001234567','1002345678','1003456789','1004567890','1005678901',
    '1006789012','1007890123','1008901234','1009012345','1011123456'
);

SELECT 'PREVIEW: usuarios de ejemplo' AS descripcion, COUNT(*) AS registros
FROM usuarios
WHERE Email IN ('admin@hotel.com', 'cliente@hotel.com');

SELECT 'PREVIEW: servicios de ejemplo' AS descripcion, COUNT(*) AS registros
FROM servicio
WHERE NombreServicio IN (
    'Spa y Masajes','Restaurante','Piscina','WiFi','Gimnasio',
    'Servicio a la Habitación','Tour Guiado','Lavandería','Transporte','Bar y Cocktails'
);

SELECT 'PREVIEW: habitaciones de ejemplo' AS descripcion, COUNT(*) AS registros
FROM habitacion
WHERE NombreHabitacion IN (
    'Habitación Estándar','Habitación Deluxe','Suite Familiar',
    'Habitación Individual','Suite Presidencial','Habitación Triple',
    'Cabaña Jardín','Habitación Piscina'
);

-- ──────────────────────────────────────────────────────────────
--  SECCIÓN 2: LIMPIEZA — descomentar y ejecutar DESPUÉS del preview
-- ──────────────────────────────────────────────────────────────

/*

START TRANSACTION;

-- Paso 1: detalles de servicio de reservas de clientes de ejemplo
DELETE drs
FROM detallereservaservicio drs
INNER JOIN reserva r ON drs.IDReserva = r.IdReserva
WHERE r.NroDocumentoCliente IN (
    '1001234567','1002345678','1003456789','1004567890','1005678901',
    '1006789012','1007890123','1008901234','1009012345','1011123456'
);

-- Paso 2: detalles de paquete de reservas de clientes de ejemplo
DELETE drp
FROM detallereservapaquetes drp
INNER JOIN reserva r ON drp.IDReserva = r.IdReserva
WHERE r.NroDocumentoCliente IN (
    '1001234567','1002345678','1003456789','1004567890','1005678901',
    '1006789012','1007890123','1008901234','1009012345','1011123456'
);

-- Paso 3: reservas de clientes de ejemplo
DELETE FROM reserva
WHERE NroDocumentoCliente IN (
    '1001234567','1002345678','1003456789','1004567890','1005678901',
    '1006789012','1007890123','1008901234','1009012345','1011123456'
);

-- Paso 4: clientes de ejemplo
DELETE FROM clientes
WHERE NroDocumento IN (
    '1001234567','1002345678','1003456789','1004567890','1005678901',
    '1006789012','1007890123','1008901234','1009012345','1011123456'
);

-- Paso 5: usuarios de ejemplo (solo los dos de prueba)
DELETE FROM usuarios
WHERE Email IN ('admin@hotel.com', 'cliente@hotel.com');

-- Paso 6: servicios de ejemplo — SOLO si no tienen reservas asociadas
-- (la subconsulta previene borrar servicios con uso real)
DELETE FROM servicio
WHERE NombreServicio IN (
    'Spa y Masajes','Restaurante','Piscina','WiFi','Gimnasio',
    'Servicio a la Habitación','Tour Guiado','Lavandería','Transporte','Bar y Cocktails'
)
AND IDServicio NOT IN (
    SELECT DISTINCT IDServicio FROM detallereservaservicio
);

-- Paso 7: habitaciones de ejemplo — SOLO si no tienen paquetes ni reservas asociadas
DELETE FROM habitacion
WHERE NombreHabitacion IN (
    'Habitación Estándar','Habitación Deluxe','Suite Familiar',
    'Habitación Individual','Suite Presidencial','Habitación Triple',
    'Cabaña Jardín','Habitación Piscina'
)
AND IDHabitacion NOT IN (
    SELECT DISTINCT IDHabitacion FROM paquetes
)
AND IDHabitacion NOT IN (
    SELECT DISTINCT p.IDHabitacion
    FROM detallereservapaquetes drp
    INNER JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
);

-- Verificar resultado antes de confirmar
SELECT 'RESULTADO: reservas restantes'  AS descripcion, COUNT(*) AS total FROM reserva;
SELECT 'RESULTADO: clientes restantes'  AS descripcion, COUNT(*) AS total FROM clientes;
SELECT 'RESULTADO: usuarios restantes'  AS descripcion, COUNT(*) AS total FROM usuarios;
SELECT 'RESULTADO: servicios restantes' AS descripcion, COUNT(*) AS total FROM servicio;
SELECT 'RESULTADO: habitaciones restantes' AS descripcion, COUNT(*) AS total FROM habitacion;

-- Si los resultados son correctos: COMMIT; de lo contrario: ROLLBACK;
COMMIT;
-- ROLLBACK;

*/
