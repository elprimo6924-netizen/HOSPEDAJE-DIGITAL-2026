# 🔧 Correcciones de Modelos del Backend

## Problema Identificado

Los modelos del backend no coinciden con la estructura real de la base de datos MySQL `hospedaje`.

---

## 📋 Estructura Real de la Base de Datos

### Tabla `habitacion`
```sql
IDHabitacion        int(11)         PRI  auto_increment
NombreHabitacion    varchar(30)
ImagenHabitacion    blob
Descripcion         varchar(50)
Costo               float
Estado              tinyint(1)
```

### Tabla `cliente`
```sql
NroDocumento        varchar(50)     PRI
Nombre              varchar(50)
Apellido            varchar(50)
Direccion           varchar(50)
Email               varchar(50)
Telefono            varchar(50)
Estado              tinyint(1)
IDRol               int(11)         MUL
```

### Tabla `reserva`
```sql
IdReserva           int(11)         PRI  auto_increment
NroDocumentoCliente varchar(50)
FechaReserva        datetime
FechaInicio         date
FechaFinalizacion   date
Sub_Total           float
Descuento           float
IVA                 float
Monto_Total         float
MetodoPago          int(11)
IdEstadoReserva     int(11)
id_usuario          int(11)
```

### Tabla `servicio`
```sql
IDServicio          int(11)         PRI  auto_increment
NombreServicio      varchar(30)
Descripcion         varchar(50)
Duracion            varchar(50)
CantidadMaximaPersonas int(11)
Costo               float
Estado              tinyint(1)
```

---

## ❌ Problemas Encontrados

### 1. Modelo `Cliente.js`
**Problema**: El modelo espera columnas que no existen:
- `IDCliente` → No existe, la PK es `NroDocumento`
- `CorreoElectronico` → Debería ser `Email`
- `NumeroDocumento` → Debería ser `NroDocumento`
- `TipoDocumento` → No existe

### 2. Modelo `servicios.js`
**Problema**: Usa tabla `servicios` pero la tabla se llama `servicio` (sin 's')

### 3. Modelo `reserva.js`
**Problema**: El modelo espera columnas que no existen en la tabla real:
- `IDCliente` → No existe
- `NombreCliente` → No existe
- `EmailCliente` → No existe
- `TelefonoCliente` → No existe
- `FechaEntrada` → Debería ser `FechaInicio`
- `FechaSalida` → Debería ser `FechaFinalizacion`
- `NumeroAdultos` → No existe
- `NumeroNinos` → No existe
- `CostoTotal` → Debería ser `Monto_Total`
- `Estado` → Debería ser `IdEstadoReserva`

---

## ✅ Correcciones Necesarias

### Corrección 1: Modelo `Cliente.js`

```javascript
const db = require("../database/connection");

const ClienteModel = {
    // Obtener todos los clientes
    findAll: async () => {
        const [rows] = await db.query("SELECT * FROM cliente");
        return rows;
    },

    // Obtener cliente por NroDocumento
    findById: async (nroDocumento) => {
        const [rows] = await db.query("SELECT * FROM cliente WHERE NroDocumento = ?", [nroDocumento]);
        return rows[0];
    },

    // Crear nuevo cliente
    create: async (clienteData) => {
        const { NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol } = clienteData;
        const [result] = await db.query(
            "INSERT INTO cliente (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado || 1, IDRol || 1]
        );
        return result;
    },

    // Actualizar cliente
    update: async (nroDocumento, clienteData) => {
        const { Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol } = clienteData;
        const [result] = await db.query(
            "UPDATE cliente SET Nombre = ?, Apellido = ?, Direccion = ?, Email = ?, Telefono = ?, Estado = ?, IDRol = ? WHERE NroDocumento = ?",
            [Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol, nroDocumento]
        );
        return result;
    },

    // Eliminar cliente
    delete: async (nroDocumento) => {
        const [result] = await db.query("DELETE FROM cliente WHERE NroDocumento = ?", [nroDocumento]);
        return result;
    }
};

module.exports = ClienteModel;
```

### Corrección 2: Modelo `servicios.js`

```javascript
const db = require("../database/connection");

const ServiciosModel = {
    // Obtener todos los servicios
    findAll: async () => {
        const [rows] = await db.query("SELECT * FROM servicio");  // Cambiado de 'servicios' a 'servicio'
        return rows;
    },

    // Obtener servicio por ID
    findById: async (id) => {
        const [rows] = await db.query("SELECT * FROM servicio WHERE IDServicio = ?", [id]);  // Cambiado
        return rows[0];
    },

    // Crear nuevo servicio
    create: async (servicioData) => {
        const { NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado } = servicioData;
        const [result] = await db.query(
            "INSERT INTO servicio (NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado) VALUES (?, ?, ?, ?, ?, ?)",  // Cambiado
            [NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado]
        );
        return result;
    },

    // Actualizar servicio
    update: async (id, servicioData) => {
        const { NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado } = servicioData;
        const [result] = await db.query(
            "UPDATE servicio SET NombreServicio = ?, Descripcion = ?, Duracion = ?, CantidadMaximaPersonas = ?, Costo = ?, Estado = ? WHERE IDServicio = ?",  // Cambiado
            [NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado, id]
        );
        return result;
    },

    // Eliminar servicio
    delete: async (id) => {
        const [result] = await db.query("DELETE FROM servicio WHERE IDServicio = ?", [id]);  // Cambiado
        return result;
    }
};

module.exports = ServiciosModel;
```

### Corrección 3: Modelo `reserva.js`

```javascript
const db = require('../database/connection');

// Listar todas las reservas
const list = async () => {
    const [reservas] = await db.query(`
        SELECT r.*, h.NombreHabitacion 
        FROM reserva r 
        LEFT JOIN habitacion h ON r.IDHabitacion = h.IDHabitacion
    `);
    return reservas;
};

// Obtener reserva por ID
const getById = async (id) => {
    const [rows] = await db.query(`
        SELECT r.*, h.NombreHabitacion 
        FROM reserva r 
        LEFT JOIN habitacion h ON r.IDHabitacion = h.IDHabitacion
        WHERE r.IdReserva = ?
    `, [id]);
    return rows[0];
};

// Crear reserva
const create = async (reservaData) => {
    const {
        NroDocumentoCliente,
        IDHabitacion,
        FechaInicio,
        FechaFinalizacion,
        Sub_Total,
        Descuento,
        IVA,
        Monto_Total,
        MetodoPago,
        IdEstadoReserva,
        id_usuario
    } = reservaData;

    const [result] = await db.query(
        `INSERT INTO reserva (NroDocumentoCliente, IDHabitacion, FechaReserva, FechaInicio, FechaFinalizacion, Sub_Total, Descuento, IVA, Monto_Total, MetodoPago, IdEstadoReserva, id_usuario) 
         VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [NroDocumentoCliente, IDHabitacion, FechaInicio, FechaFinalizacion, Sub_Total, Descuento, IVA, Monto_Total, MetodoPago, IdEstadoReserva, id_usuario]
    );
    return result;
};

// Actualizar reserva
const update = async (id, reservaData) => {
    const {
        NroDocumentoCliente,
        IDHabitacion,
        FechaInicio,
        FechaFinalizacion,
        Sub_Total,
        Descuento,
        IVA,
        Monto_Total,
        MetodoPago,
        IdEstadoReserva,
        id_usuario
    } = reservaData;

    await db.query(
        `UPDATE reserva SET 
            NroDocumentoCliente = ?, IDHabitacion = ?, FechaInicio = ?, FechaFinalizacion = ?,
            Sub_Total = ?, Descuento = ?, IVA = ?, Monto_Total = ?, MetodoPago = ?,
            IdEstadoReserva = ?, id_usuario = ?
         WHERE IdReserva = ?`,
        [NroDocumentoCliente, IDHabitacion, FechaInicio, FechaFinalizacion,
         Sub_Total, Descuento, IVA, Monto_Total, MetodoPago, IdEstadoReserva, id_usuario, id]
    );
};

// Eliminar reserva
const remove = async (id) => {
    await db.query('DELETE FROM reserva WHERE IdReserva = ?', [id]);
};

module.exports = {
    list,
    getById,
    create,
    update,
    remove
};
```

---

## 🚀 Pasos para Aplicar las Correcciones

1. **Respaldar los archivos originales** (opcional pero recomendado)
2. **Reemplazar el contenido** de cada modelo con el código corregido
3. **Reiniciar el backend** para que los cambios surtan efecto
4. **Probar los endpoints** para verificar que funcionan correctamente

---

## 📝 Notas Adicionales

- La tabla `cliente` usa `NroDocumento` como clave primaria (no un ID numérico)
- La tabla `reserva` tiene campos financieros: Sub_Total, Descuento, IVA, Monto_Total
- La tabla `servicio` (sin 's') tiene campos de duración y capacidad
- El campo `Estado` en las tablas es `tinyint(1)` (0 o 1), no un string
