-- Script para corregir la tabla de reservas

USE hospedaje;

-- Verificar la estructura actual de la tabla reserva
DESCRIBE reserva;

-- Eliminar la tabla si existe y crearla de nuevo con la estructura correcta
DROP TABLE IF EXISTS reserva;

CREATE TABLE reserva (
    IDReserva INT AUTO_INCREMENT PRIMARY KEY,
    IDHabitacion INT NOT NULL,
    IDCliente INT,
    NombreCliente VARCHAR(100) NOT NULL,
    EmailCliente VARCHAR(100) NOT NULL,
    TelefonoCliente VARCHAR(20),
    FechaEntrada DATE NOT NULL,
    FechaSalida DATE NOT NULL,
    NumeroAdultos INT DEFAULT 1,
    NumeroNinos INT DEFAULT 0,
    CostoTotal DECIMAL(10, 2) NOT NULL,
    Estado VARCHAR(20) DEFAULT 'pendiente',
    FOREIGN KEY (IDHabitacion) REFERENCES habitacion(IDHabitacion)
);

-- Verificar que se creó correctamente
DESCRIBE reserva;
