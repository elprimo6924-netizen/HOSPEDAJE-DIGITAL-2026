-- ============================================================
-- MIGRACIÓN: Agregar imagen_url a la tabla servicio
-- Ejecutar una sola vez en la base de datos hospedaje
-- ============================================================
USE hospedaje;

ALTER TABLE servicio
ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(500) DEFAULT NULL;

SELECT 'Migración completada: imagen_url agregado a servicio.' AS Resultado;
