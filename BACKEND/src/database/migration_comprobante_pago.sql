-- ============================================================
-- MIGRACIÓN: Comprobante de pago en reservas
-- Idempotente — se puede ejecutar varias veces sin errores
-- ============================================================

-- Estado 5: Pendiente Verificación Pago
INSERT IGNORE INTO estadosreserva (IdEstadoReserva, NombreEstadoReserva)
VALUES (5, 'Pendiente Verificación Pago');

-- Columnas Comprobante* en tabla reserva
-- MySQL 8+: ADD COLUMN IF NOT EXISTS
-- MySQL 5.7: usar bloques con information_schema

SET @db = DATABASE();

-- ComprobantePago
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'reserva' AND COLUMN_NAME = 'ComprobantePago') = 0,
  'ALTER TABLE reserva ADD COLUMN ComprobantePago VARCHAR(255) NULL',
  'SELECT 1 -- ComprobantePago ya existe'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ComprobanteFecha
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'reserva' AND COLUMN_NAME = 'ComprobanteFecha') = 0,
  'ALTER TABLE reserva ADD COLUMN ComprobanteFecha DATETIME NULL',
  'SELECT 1 -- ComprobanteFecha ya existe'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ComprobanteEstado
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'reserva' AND COLUMN_NAME = 'ComprobanteEstado') = 0,
  "ALTER TABLE reserva ADD COLUMN ComprobanteEstado VARCHAR(20) NULL DEFAULT 'pendiente'",
  'SELECT 1 -- ComprobanteEstado ya existe'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ComprobanteNota
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'reserva' AND COLUMN_NAME = 'ComprobanteNota') = 0,
  'ALTER TABLE reserva ADD COLUMN ComprobanteNota VARCHAR(255) NULL',
  'SELECT 1 -- ComprobanteNota ya existe'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
