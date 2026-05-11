-- ============================================================
-- MIGRACIÓN: Agregar ImagenURL a Paquetes + datos de ejemplo
-- Ejecutar una sola vez en la base de datos hospedaje
-- ============================================================
USE hospedaje;

-- 1. Agregar columna ImagenURL (MySQL 8+)
ALTER TABLE Paquetes
ADD COLUMN IF NOT EXISTS ImagenURL VARCHAR(255) DEFAULT NULL;

-- 2. Insertar 2 paquetes de ejemplo con imágenes locales
INSERT INTO Paquetes (NombrePaquete, Descripcion, IDHabitacion, IDServicio, Precio, Estado, IDCliente, ImagenURL) VALUES
(
    'Suite Valhala',
    'Estadía exclusiva con spa, masajes relajantes y acceso a sala VIP. Ambiente nórdico inigualable con vista panorámica.',
    2, 1, 680000, 1, NULL,
    'http://localhost:3306/img/VALLHALA.jpeg'
),
(
    'Olimpo Deluxe',
    'Habitación olímpica premium con piscina incluida, servicio VIP personalizado y todas las amenidades de lujo.',
    3, 3, 520000, 1, NULL,
    'http://localhost:3306/img/HABITACION%20OLIMPOV2.jpg'
);

SELECT 'Migración completada.' AS Resultado;
