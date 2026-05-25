-- ============================================================
-- ACTUALIZACIÓN DE PRECIOS A VALORES REALES (Colombia - COP)
-- Ejecutar una sola vez sobre la BD existente
-- ============================================================

-- REFERENCIA DE PRECIOS - HOSPEDAJE COLOMBIA (COP)
-- Fuente: Rango promedio hoteles 3-4 estrellas en ciudades intermedias
-- -----------------------------------------------------------------------
-- HABITACIONES (por noche):
--   Individual:         $120.000   (hotel básico ciudad intermedia)
--   Estándar doble:     $160.000   (Hotel 3* promedio Colombia)
--   Triple:             $250.000   (+ persona adicional ~$30.000)
--   Deluxe king:        $320.000   (Hotel 4* Medellín/Cali/Cartagena)
--   Cabaña Jardín:      $290.000   (hostal boutique / ecohotel)
--   Piscina view:       $270.000   (hotel resort mediano)
--   Suite Familiar:     $450.000   (3 noches familia 4 personas)
--   Suite Presidencial: $950.000   (hotel 5* Bogotá/Cartagena)
-- SERVICIOS (por uso):
--   Spa y Masajes:      $150.000   (60 min, aceites premium)
--   Tour Guiado:         $65.000   (4h, guía bilingüe)
--   Transporte aerop.:   $60.000   (transfer ida, Uber promedio)
--   Lavandería:          $18.000   (por kg o prenda)
--   Serv. Habitación:     $8.000   (cargo domicilio interno)
--   Piscina/WiFi/Gym/
--   Bar/Restaurante:          $0   (incluidos en tarifa)
-- PAQUETES (precio total todo incluido):
--   Fin de Semana:      $520.000   (2 noches + desayuno)
--   Escapada Romántica: $650.000   (2 noches + spa pareja)
--   Paquete Familiar:   $980.000   (3 noches + actividades)
--   Luna de Miel:     $1.750.000   (3 noches suite + cena romántica)
--   Todo Incluido:    $2.200.000   (5 noches + todas las comidas)
-- -----------------------------------------------------------------------

USE hospedaje;

-- ── HABITACIONES (precio por noche) ────────────────────────
UPDATE habitacion SET Costo = 160000 WHERE IDHabitacion = 1; -- Estándar
UPDATE habitacion SET Costo = 320000 WHERE IDHabitacion = 2; -- Deluxe
UPDATE habitacion SET Costo = 450000 WHERE IDHabitacion = 3; -- Suite Familiar
UPDATE habitacion SET Costo = 120000 WHERE IDHabitacion = 4; -- Individual
UPDATE habitacion SET Costo = 950000 WHERE IDHabitacion = 5; -- Suite Presidencial
UPDATE habitacion SET Costo = 250000 WHERE IDHabitacion = 6; -- Triple
UPDATE habitacion SET Costo = 290000 WHERE IDHabitacion = 7; -- Cabaña Jardín
UPDATE habitacion SET Costo = 270000 WHERE IDHabitacion = 8; -- Habitación Piscina

-- ── SERVICIOS (precio por uso/persona) ─────────────────────
UPDATE servicio SET Costo = 150000 WHERE IDServicio = 1;  -- Spa y Masajes
UPDATE servicio SET Costo = 0      WHERE IDServicio = 2;  -- Restaurante (incluido)
UPDATE servicio SET Costo = 0      WHERE IDServicio = 3;  -- Piscina (incluido)
UPDATE servicio SET Costo = 0      WHERE IDServicio = 4;  -- WiFi (incluido)
UPDATE servicio SET Costo = 0      WHERE IDServicio = 5;  -- Gimnasio (incluido)
UPDATE servicio SET Costo = 8000   WHERE IDServicio = 6;  -- Serv. Habitación
UPDATE servicio SET Costo = 65000  WHERE IDServicio = 7;  -- Tour Guiado
UPDATE servicio SET Costo = 18000  WHERE IDServicio = 8;  -- Lavandería
UPDATE servicio SET Costo = 60000  WHERE IDServicio = 9;  -- Transporte
UPDATE servicio SET Costo = 0      WHERE IDServicio = 10; -- Bar (incluido)

-- ── PAQUETES (precio total del paquete, no por noche) ───────
-- Solo paquetes con nombres de producción conocidos.
-- NO se tocan paquetes de prueba del admin (ej: 'ffsdfsa').
UPDATE paquetes SET Precio = 520000  WHERE NombrePaquete = 'Fin de Semana';
UPDATE paquetes SET Precio = 650000  WHERE NombrePaquete = 'Escapada Romántica';
UPDATE paquetes SET Precio = 980000  WHERE NombrePaquete = 'Paquete Familiar';
UPDATE paquetes SET Precio = 1750000 WHERE NombrePaquete = 'Luna de Miel';
UPDATE paquetes SET Precio = 2200000 WHERE NombrePaquete = 'Todo Incluido';

-- ── VERIFICACIÓN ────────────────────────────────────────────
SELECT 'habitacion' AS tabla, IDHabitacion AS id, NombreHabitacion AS nombre, Costo
FROM habitacion
UNION ALL
SELECT 'servicio', IDServicio, NombreServicio, Costo
FROM servicio
ORDER BY tabla, id;
