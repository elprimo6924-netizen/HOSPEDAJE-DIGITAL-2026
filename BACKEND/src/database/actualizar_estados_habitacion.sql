-- Script para actualizar el campo Estado de la tabla habitacion
-- Cambia los valores numéricos a textos legibles

USE hospedaje;

-- Actualizar los estados de las habitaciones
-- Estado 1 = disponible
-- Estado 2 = ocupada
-- Estado 3 = mantenimiento
-- Estado 4 = reservada (opcional)

UPDATE habitacion SET Estado = 'disponible' WHERE Estado = '1' OR Estado = 1;
UPDATE habitacion SET Estado = 'ocupada' WHERE Estado = '2' OR Estado = 2;
UPDATE habitacion SET Estado = 'mantenimiento' WHERE Estado = '3' OR Estado = 3;
UPDATE habitacion SET Estado = 'reservada' WHERE Estado = '4' OR Estado = 4;

-- Verificar los cambios
SELECT IDHabitacion, NombreHabitacion, Estado FROM habitacion;
