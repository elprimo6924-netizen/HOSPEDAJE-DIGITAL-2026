const connection = require('./connection');

async function main() {
    try {
        console.log('Conectando a la base de datos...');
        // Con un pool, la conexión se establece automáticamente
        console.log('Conexión establecida correctamente.\n');

        // Limpiar datos en orden inverso de dependencias
        console.log('--- Limpiando datos existentes ---');
        await connection.query('DELETE FROM detallereservaservicio WHERE IDDetalleReservaServicio > 0');
        await connection.query('DELETE FROM detallereservapaquetes WHERE IDDetalleReservaPaquetes > 0');
        await connection.query('DELETE FROM reserva WHERE IdReserva > 0');
        await connection.query('DELETE FROM paquetes WHERE IDPaquete > 0');
        await connection.query('DELETE FROM clientes WHERE NroDocumento != ""');
        await connection.query('DELETE FROM usuarios WHERE IDUsuario > 0');
        await connection.query('DELETE FROM servicio WHERE IDServicio > 0');
        await connection.query('DELETE FROM habitacion WHERE IDHabitacion > 0');
        await connection.query('DELETE FROM roles WHERE IDRol > 0');
        console.log('✓ Datos limpiados\n');

        // 1. Insertar roles
        console.log('--- Insertando Roles ---');
        await connection.query(`INSERT INTO roles (IDRol, Nombre, Estado, IsActive) VALUES
            (1, 'Administrador', 'activo', 1),
            (3, 'Cliente', 'activo', 1)`);
        console.log('✓ Roles insertados\n');

        // 1.5. Insertar Usuarios
        console.log('--- Insertando Usuarios ---');
        await connection.query(`INSERT INTO usuarios (NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol) VALUES
            ('admin', 'admin123', 'Admin', 'admin@hotel.com', 'CC', 1234567890, '3001234567', 'Colombia', 'Calle Principal 100', 1),
            ('cliente1', 'cliente123', 'Cliente Prueba', 'cliente@hotel.com', 'CC', 1098765432, '3109876543', 'Colombia', 'Calle Secundaria 50', 3)`);
        console.log('✓ Usuarios insertados\n');

        // 2. Insertar habitaciones
        console.log('--- Insertando Habitaciones ---');
        await connection.query(`INSERT INTO habitacion (IDHabitacion, NombreHabitacion, ImagenHabitacion, Descripcion, Costo, Estado) VALUES 
            (1, 'Habitación Estándar', NULL, 'Habitación cómoda con cama doble, baño privado, TV y aire acondicionado.', 100000, 1),
            (2, 'Habitación Deluxe', NULL, 'Habitación espaciosa con cama king, jacuzzi, mini bar y balcón con vista al mar.', 200000, 1),
            (3, 'Suite Familiar', NULL, 'Gran habitación familiar con dos camas queen, sala de estar y cocina básica.', 350000, 1),
            (4, 'Habitación Individual', NULL, 'Habitación económica con cama individual, baño privado y TV.', 50000, 1),
            (5, 'Suite Presidencial', NULL, 'Lujo extremo con cama king, jacuzzi privado, sala de conferencias y terraza.', 500000, 1),
            (6, 'Habitación Triple', NULL, 'Habitación espaciosa con tres cama individuales y espacio adicional.', 150000, 1),
            (7, 'Cabaña Jardín', NULL, 'Acogedora cabaña rodeada de vegetación con terraza privada.', 180000, 1),
            (8, 'Habitación Piscina', NULL, 'Habitación moderna con vista directa a la piscina y balcón.', 170000, 1)`);
        console.log('✓ Habitaciones insertadas\n');

        // 3. Insertar clientes
        console.log('--- Insertando Clientes ---');
        await connection.query(`INSERT INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol) VALUES
            ('1001234567', 'Juan', 'Pérez García', 'Calle 123 #45-67', 'juan.perez@email.com', '3001234567', 1, 3),
            ('1002345678', 'María', 'López Hernández', 'Carrera 78 #12-34', 'maria.lopez@email.com', '3102345678', 1, 3),
            ('1003456789', 'Carlos', 'Rodríguez Soto', 'Avenida 56 #78-90', 'carlos.rodriguez@email.com', '3203456789', 1, 3),
            ('1004567890', 'Ana', 'Martínez Díaz', 'Calle 90 #11-22', 'ana.martinez@email.com', '3014567890', 1, 3),
            ('1005678901', 'Pedro', 'Sánchez Ruiz', 'Carrera 34 #55-66', 'pedro.sanchez@email.com', '3155678901', 1, 3),
            ('1006789012', 'Laura', 'Gómez Torres', 'Calle 67 #88-99', 'laura.gomez@email.com', '3166789012', 1, 3),
            ('1007890123', 'Miguel', 'Fernández Castro', 'Avenida 12 #33-44', 'miguel.fernandez@email.com', '3177890123', 1, 3),
            ('1008901234', 'Sofia', 'Ramírez Peña', 'Carrera 90 #77-88', 'sofia.ramirez@email.com', '3188901234', 1, 3),
            ('1009012345', 'Diego', 'Morales López', 'Calle 45 #66-77', 'diego.morales@email.com', '3199012345', 1, 3),
            ('1011123456', 'Carmen', 'Torres Rivera', 'Carrera 23 #55-66', 'carmen.torres@email.com', '3201123456', 1, 3)`);
        console.log('✓ Clientes insertados\n');

        // 4. Insertar servicios
        console.log('--- Insertando Servicios ---');
        await connection.query('DELETE FROM servicio WHERE IDServicio > 0');
        await connection.query(`INSERT INTO servicio (IDServicio, NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado) VALUES
            (1, 'Spa y Masajes', 'Relajantes tratamientos con aceites esenciales', '60 min', 2, 80000, 1),
            (2, 'Restaurante', 'Restaurante con comida local e internacional', '2 horas', 20, 0, 1),
            (3, 'Piscina', 'Acceso a piscina climatizada al aire libre', 'todo el día', 50, 0, 1),
            (4, 'WiFi', 'Conexión a internet de alta velocidad', '24 horas', 10, 0, 1),
            (5, 'Gimnasio', 'Gimnasio completamente equipado', '6 horas', 15, 0, 1),
            (6, 'Servicio a la Habitación', 'Pedidos de comida y bebidas', '45 min', 4, 15000, 1),
            (7, 'Tour Guiado', 'Tours guiados por la ciudad', '4 horas', 12, 50000, 1),
            (8, 'Lavandería', 'Servicio de lavandería y tintorería', '24 horas', 5, 20000, 1),
            (9, 'Transporte', 'Servicio de transporte al aeropuerto', '1 hora', 4, 35000, 1),
            (10, 'Bar y Cocktails', 'Bar con amplia carta de cocktails', '3 horas', 30, 0, 1)`);
        console.log('✓ Servicios insertados\n');

        // 5. Insertar reservas
        console.log('--- Insertando Reservas ---');
        await connection.query(`INSERT INTO reserva (IdReserva, NroDocumentoCliente, FechaReserva, FechaInicio, FechaFinalizacion, Sub_Total, Descuento, IVA, Monto_Total, MetodoPago, IdEstadoReserva, id_usuario) VALUES
            (1, '1001234567', '2026-03-15 10:30:00', '2026-03-20', '2026-03-25', 500000, 0, 95000, 595000, 1, 1, 1),
            (2, '1002345678', '2026-03-16 14:00:00', '2026-03-22', '2026-03-27', 1000000, 50000, 180500, 1180500, 2, 1, 1),
            (3, '1003456789', '2026-03-17 09:15:00', '2026-03-25', '2026-03-30', 1750000, 0, 332500, 2082500, 1, 2, 1),
            (4, '1004567890', '2026-03-18 08:00:00', '2026-03-18', '2026-03-20', 100000, 0, 19000, 119000, 1, 1, 1),
            (5, '1005678901', '2026-03-17 16:45:00', '2026-04-01', '2026-04-05', 2000000, 100000, 361000, 2261000, 2, 1, 1),
            (6, '1006789012', '2026-03-18 11:20:00', '2026-04-10', '2026-04-15', 750000, 0, 142500, 892500, 1, 2, 1),
            (7, '1007890123', '2026-03-16 13:30:00', '2026-04-05', '2026-04-08', 540000, 0, 102600, 642600, 1, 1, 1),
            (8, '1008901234', '2026-03-15 17:00:00', '2026-04-12', '2026-04-14', 340000, 0, 64600, 404600, 1, 3, 1),
            (9, '1009012345', '2026-03-18 10:00:00', '2026-04-20', '2026-04-25', 500000, 0, 95000, 595000, 1, 1, 1),
            (10, '1011123456', '2026-03-17 15:30:00', '2026-05-01', '2026-05-07', 1200000, 0, 228000, 1428000, 2, 2, 1)`);
        console.log('✓ Reservas insertadas\n');

        // 6. Verificar los datos
        console.log('--- Verificación de datos ---');
        
        const [habitaciones] = await connection.query('SELECT COUNT(*) as total FROM habitacion');
        console.log(`Habitaciones: ${habitaciones[0].total}`);
        
        const [clientes] = await connection.query('SELECT COUNT(*) as total FROM clientes');
        console.log(`Clientes: ${clientes[0].total}`);
        
        const [servicios] = await connection.query('SELECT COUNT(*) as total FROM servicio');
        console.log(`Servicios: ${servicios[0].total}`);
        
        const [reservas] = await connection.query('SELECT COUNT(*) as total FROM reserva');
        console.log(`Reservas: ${reservas[0].total}`);
        
        const [roles] = await connection.query('SELECT COUNT(*) as total FROM roles');
        console.log(`Roles: ${roles[0].total}`);

        const [usuarios] = await connection.query('SELECT COUNT(*) as total FROM usuarios');
        console.log(`Usuarios: ${usuarios[0].total}`);

        console.log('\n✓✓✓ Todos los datos fueron insertados correctamente en la base de datos!');
        
    } catch (error) {
        console.error('Error general:', error.message);
    } finally {
        await connection.end();
    }
}

main();
