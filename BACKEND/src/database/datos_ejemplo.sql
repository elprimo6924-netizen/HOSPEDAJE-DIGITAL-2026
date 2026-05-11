-- Script para insertar datos de ejemplo en la base de datos hospedaje
USE hospedaje;

-- =============================================================================
-- TABLA ROLES
-- =============================================================================

-- Limpiar datos existentes
DELETE FROM roles WHERE IDRol > 0;

-- Insertar roles de ejemplo
INSERT INTO roles (IDRol, Nombre, Estado, IsActive) VALUES
(1, 'Administrador', 'activo', 1),
(3, 'Cliente', 'activo', 1);

-- =============================================================================
-- TABLA HABITACION
-- =============================================================================

-- Limpiar datos existentes
DELETE FROM habitacion WHERE IDHabitacion > 0;

-- Insertar habitaciones de ejemplo
INSERT INTO habitacion (IDHabitacion, NombreHabitacion, ImagenHabitacion, Descripcion, Costo, Estado) VALUES 
(1, 'Habitación Estándar', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop', 'Habitación cómoda con cama doble, baño privado, TV y aire acondicionado.', 100000, 1),
(2, 'Habitación Deluxe', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop', 'Habitación espaciosa con cama king, jacuzzi, mini bar y balcón con vista al mar.', 200000, 1),
(3, 'Suite Familiar', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop', 'Gran habitación familiar con dos camas queen, sala de estar y cocina básica.', 350000, 1),
(4, 'Habitación Individual', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop', 'Habitación económica con cama individual, baño privado y TV.', 50000, 1),
(5, 'Suite Presidencial', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop', 'Lujo extremo con cama king, jacuzzi privado, sala de conferencias y terraza.', 500000, 1),
(6, 'Habitación Triple', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop', 'Habitación espaciosa con tres cama individuales y espacio adicional.', 150000, 1),
(7, 'Cabaña Jardín', 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=400&h=300&fit=crop', 'Acogedora cabaña rodeada de vegetación con terraza privada.', 180000, 1),
(8, 'Habitación Piscina', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop', 'Habitación moderna con vista directa a la piscina y balcón.', 170000, 1);

-- =============================================================================
-- TABLA CLIENTES
-- =============================================================================

-- Limpiar datos existentes
DELETE FROM clientes WHERE NroDocumento != '';

-- Insertar clientes de ejemplo
INSERT INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol) VALUES
('1001234567', 'Juan', 'Pérez García', 'Calle 123 #45-67', 'juan.perez@email.com', '3001234567', 1, 3),
('1002345678', 'María', 'López Hernández', 'Carrera 78 #12-34', 'maria.lopez@email.com', '3102345678', 1, 3),
('1003456789', 'Carlos', 'Rodríguez Soto', 'Avenida 56 #78-90', 'carlos.rodriguez@email.com', '3203456789', 1, 3),
('1004567890', 'Ana', 'Martínez Díaz', 'Calle 90 #11-22', 'ana.martinez@email.com', '3014567890', 1, 3),
('1005678901', 'Pedro', 'Sánchez Ruiz', 'Carrera 34 #55-66', 'pedro.sanchez@email.com', '3155678901', 1, 3),
('1006789012', 'Laura', 'Gómez Torres', 'Calle 67 #88-99', 'laura.gomez@email.com', '3166789012', 1, 3),
('1007890123', 'Miguel', 'Fernández Castro', 'Avenida 12 #33-44', 'miguel.fernandez@email.com', '3177890123', 1, 3),
('1008901234', 'Sofia', 'Ramírez Peña', 'Carrera 90 #77-88', 'sofia.ramirez@email.com', '3188901234', 1, 3),
('1009012345', 'Diego', 'Morales López', 'Calle 45 #66-77', 'diego.morales@email.com', '3199012345', 1, 3),
('1011123456', 'Carmen', 'Torres Rivera', 'Carrera 23 #55-66', 'carmen.torres@email.com', '3201123456', 1, 3);

-- =============================================================================
-- TABLA SERVICIOS
-- =============================================================================

-- Limpiar datos existentes
DELETE FROM servicios WHERE IDServicio > 0;

-- Insertar servicios de ejemplo
INSERT INTO servicios (IDServicio, NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado) VALUES
(1, 'Spa y Masajes', 'Relajantes tratamientos con aceites esenciales', '60 min', 2, 80000, 1),
(2, 'Restaurante', 'Restaurante con comida local e internacional', '2 horas', 20, 0, 1),
(3, 'Piscina', 'Acceso a piscina climatizada al aire libre', 'todo el día', 50, 0, 1),
(4, 'WiFi', 'Conexión a internet de alta velocidad', '24 horas', 10, 0, 1),
(5, 'Gimnasio', 'Gimnasio completamente equipado', '6 horas', 15, 0, 1),
(6, 'Servicio a la Habitación', 'Pedidos de comida y bebidas', '45 min', 4, 15000, 1),
(7, 'Tour Guiado', 'Tours guiados por la ciudad', '4 horas', 12, 50000, 1),
(8, 'Lavandería', 'Servicio de lavandería y tintorería', '24 horas', 5, 20000, 1),
(9, 'Transporte', 'Servicio de transporte al aeropuerto', '1 hora', 4, 35000, 1),
(10, 'Bar y Cocktails', 'Bar con amplia carta de cocktails', '3 horas', 30, 0, 1);

-- =============================================================================
-- TABLA RESERVA
-- =============================================================================

-- Limpiar datos existentes
DELETE FROM reserva WHERE IdReserva > 0;

-- Insertar reservas de ejemplo
INSERT INTO reserva (IdReserva, NroDocumentoCliente, FechaReserva, FechaInicio, FechaFinalizacion, SubTotal, Descuento, IVA, MontoTotal, MetodoPago, IdEstadoReserva, UsuarioIdusuario) VALUES
(1, '1001234567', '2026-03-15 10:30:00', '2026-03-20', '2026-03-25', 500000, 0, 95000, 595000, 1, 1, 1),
(2, '1002345678', '2026-03-16 14:00:00', '2026-03-22', '2026-03-27', 1000000, 50000, 180500, 1180500, 2, 1, 1),
(3, '1003456789', '2026-03-17 09:15:00', '2026-03-25', '2026-03-30', 1750000, 0, 332500, 2082500, 1, 2, 1),
(4, '1004567890', '2026-03-18 08:00:00', '2026-03-18', '2026-03-20', 100000, 0, 19000, 119000, 1, 1, 1),
(5, '1005678901', '2026-03-17 16:45:00', '2026-04-01', '2026-04-05', 2000000, 100000, 361000, 2261000, 2, 1, 1),
(6, '1006789012', '2026-03-18 11:20:00', '2026-04-10', '2026-04-15', 750000, 0, 142500, 892500, 1, 2, 1),
(7, '1007890123', '2026-03-16 13:30:00', '2026-04-05', '2026-04-08', 540000, 0, 102600, 642600, 1, 1, 1),
(8, '1008901234', '2026-03-15 17:00:00', '2026-04-12', '2026-04-14', 340000, 0, 64600, 404600, 1, 3, 1),
(9, '1009012345', '2026-03-18 10:00:00', '2026-04-20', '2026-04-25', 500000, 0, 95000, 595000, 1, 1, 1),
(10, '1011123456', '2026-03-17 15:30:00', '2026-05-01', '2026-05-07', 1200000, 0, 228000, 1428000, 2, 2, 1);

-- =============================================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- =============================================================================
SELECT 'Habitaciones insertadas:' AS Mensaje, COUNT(*) AS Cantidad FROM habitacion
UNION ALL
SELECT 'Clientes insertados:', COUNT(*) FROM clientes
UNION ALL
SELECT 'Servicios insertados:', COUNT(*) FROM servicios
UNION ALL
SELECT 'Reservas insertadas:', COUNT(*) FROM reserva
UNION ALL
SELECT 'Roles insertados:', COUNT(*) FROM roles;
