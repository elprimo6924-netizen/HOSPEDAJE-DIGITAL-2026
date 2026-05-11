-- Script para crear la base de datos y tablas necesarias

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS hospedaje;
USE hospedaje;

-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    IDRol INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(255),
    Estado VARCHAR(50),
    IsActive TINYINT(1) DEFAULT 1,
    Permisos JSON
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS cliente (
    NroDocumento VARCHAR(50) PRIMARY KEY,
    Nombre VARCHAR(50),
    Apellido VARCHAR(50),
    Direccion VARCHAR(50),
    Email VARCHAR(50),
    Telefono VARCHAR(50),
    Estado TINYINT(1),
    IDRol INT,
    FOREIGN KEY (IDRol) REFERENCES roles(IDRol)
);

-- Crear tabla de habitaciones
CREATE TABLE IF NOT EXISTS habitacion (
    IDHabitacion INT AUTO_INCREMENT PRIMARY KEY,
    NombreHabitacion VARCHAR(30) NOT NULL,
    ImagenHabitacion BLOB,
    Descripcion VARCHAR(50) NOT NULL,
    Costo FLOAT NOT NULL,
    Estado TINYINT(1) NOT NULL
);

-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS servicio (
    IDServicio INT AUTO_INCREMENT PRIMARY KEY,
    NombreServicio VARCHAR(30) NOT NULL,
    Descripcion VARCHAR(50) NOT NULL,
    Duracion VARCHAR(50),
    CantidadMaximaPersonas INT NOT NULL,
    Costo FLOAT NOT NULL,
    Estado TINYINT(1) NOT NULL
);

-- Crear tabla de estados de reserva
CREATE TABLE IF NOT EXISTS estadosreserva (
    IdEstadoReserva INT AUTO_INCREMENT PRIMARY KEY,
    NombreEstadoReserva VARCHAR(15)
);

-- Crear tabla de métodos de pago
CREATE TABLE IF NOT EXISTS metodopago (
    IdMetodoPago INT AUTO_INCREMENT PRIMARY KEY,
    NomMetodoPago VARCHAR(20)
);

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    IDUsuario INT AUTO_INCREMENT PRIMARY KEY,
    NombreUsuario VARCHAR(255),
    Contrasena VARCHAR(255),
    Apellido VARCHAR(255),
    Email VARCHAR(255),
    TipoDocumento VARCHAR(50),
    NumeroDocumento INT,
    Telefono VARCHAR(50),
    Pais VARCHAR(100),
    Direccion VARCHAR(255),
    IDRol INT,
    FOREIGN KEY (IDRol) REFERENCES roles(IDRol)
);

-- Crear tabla de reservas
CREATE TABLE IF NOT EXISTS reserva (
    IdReserva INT AUTO_INCREMENT PRIMARY KEY,
    NroDocumentoCliente VARCHAR(50),
    FechaReserva DATETIME,
    FechaInicio DATE,
    FechaFinalizacion DATE,
    Sub_Total FLOAT,
    Descuento FLOAT,
    IVA FLOAT,
    Monto_Total FLOAT,
    MetodoPago INT,
    IdEstadoReserva INT,
    id_usuario INT,
    FOREIGN KEY (NroDocumentoCliente) REFERENCES cliente(NroDocumento),
    FOREIGN KEY (MetodoPago) REFERENCES metodopago(IdMetodoPago),
    FOREIGN KEY (IdEstadoReserva) REFERENCES estadosreserva(IdEstadoReserva),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(IDUsuario)
);

-- Crear tabla de paquetes
CREATE TABLE IF NOT EXISTS paquetes (
    IDPaquete INT AUTO_INCREMENT PRIMARY KEY,
    NombrePaquete VARCHAR(30) NOT NULL,
    ImagenPaquete BLOB,
    Descripcion TEXT NOT NULL,
    IDHabitacion INT NOT NULL,
    IDServicio INT NOT NULL,
    Precio FLOAT,
    Estado TINYINT(1) NOT NULL,
    FOREIGN KEY (IDHabitacion) REFERENCES habitacion(IDHabitacion),
    FOREIGN KEY (IDServicio) REFERENCES servicio(IDServicio)
);

-- Crear tabla de permisos
CREATE TABLE IF NOT EXISTS permisos (
    IDPermiso INT AUTO_INCREMENT PRIMARY KEY,
    NombrePermisos VARCHAR(255),
    EstadoPermisos VARCHAR(50),
    Descripcion VARCHAR(255),
    IsActive TINYINT(1) DEFAULT 1
);

-- Crear tabla de roles y permisos
CREATE TABLE IF NOT EXISTS rolespermisos (
    IDRolPermiso INT AUTO_INCREMENT PRIMARY KEY,
    IDRol INT,
    IDPermiso INT,
    FOREIGN KEY (IDRol) REFERENCES roles(IDRol),
    FOREIGN KEY (IDPermiso) REFERENCES permisos(IDPermiso)
);

-- Crear tabla de detalle reserva paquetes
CREATE TABLE IF NOT EXISTS detallereservapaquetes (
    IDDetalleReservaPaquetes INT AUTO_INCREMENT PRIMARY KEY,
    IDReserva INT,
    Cantidad INT,
    Precio FLOAT,
    Estado TINYINT(1),
    IDPaquete INT,
    FOREIGN KEY (IDReserva) REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDPaquete) REFERENCES paquetes(IDPaquete)
);

-- Crear tabla de detalle reserva servicio
CREATE TABLE IF NOT EXISTS detallereservaservicio (
    IDDetalleReservaServicio INT AUTO_INCREMENT PRIMARY KEY,
    IDReserva INT,
    Cantidad INT,
    Precio FLOAT,
    Estado TINYINT(1),
    IDServicio INT,
    FOREIGN KEY (IDReserva) REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDServicio) REFERENCES servicio(IDServicio)
);

-- Insertar habitaciones de ejemplo
INSERT INTO habitacion (NombreHabitacion, Descripcion, Costo, Estado) VALUES 
('Habitación Estándar', 'Habitación cómoda con cama doble, baño privado y TV', 100000, 'disponible'),
('Habitación Deluxe', 'Habitación espaciosa con cama king, jacuzzi y vista al mar', 200000, 'disponible'),
('Suite Familiar', 'Gran habitación familiar con dos camas queen y sala de estar', 350000, 'disponible');

-- Insertar servicios de ejemplo
INSERT INTO servicio (NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo) VALUES
('Spa y Masajes', 'Relajantes tratamientos de spa y masajes', '60 min', 2, 80000),
('Restaurante', 'Restaurante con comida local e internacional', '2 horas', 20, 0),
('Piscina', 'Acceso a piscina climatizada', 'todo el día', 50, 0),
('WiFi', 'Conexión a internet de alta velocidad', '24 horas', 10, 0);

-- Insertar un cliente de ejemplo
INSERT INTO cliente (NombreCliente, EmailCliente, TelefonoCliente) VALUES
('Cliente Ejemplo', 'ejemplo@email.com', '3001234567');

-- Insertar una habitación de ejemplo
INSERT INTO habitacion (NombreHabitacion, Descripcion, Costo, Estado) VALUES 
('Habitación Individual', 'Habitación económica con cama individual', 50000, 'disponible');
