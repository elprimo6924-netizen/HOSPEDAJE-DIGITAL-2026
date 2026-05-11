const db = require("../database/connection");

// Servicios Model - Define la estructura de la tabla servicio

const ServiciosModel = {
    // Obtener todos los servicios
    findAll: async () => {
        const [rows] = await db.query("SELECT * FROM servicios");
        return rows;
    },

    // Obtener servicio por ID
    findById: async (id) => {
        const [rows] = await db.query("SELECT * FROM servicios WHERE IDServicio = ?", [id]);
        return rows[0];
    },

    // Crear nuevo servicio
    create: async (servicioData) => {
        const { NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado } = servicioData;
        const [result] = await db.query(
            "INSERT INTO servicios (NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado) VALUES (?, ?, ?, ?, ?, ?)",
            [NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado]
        );
        return result;
    },

    // Actualizar servicio
    update: async (id, servicioData) => {
        const { NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado } = servicioData;
        const [result] = await db.query(
            "UPDATE servicios SET NombreServicio = ?, Descripcion = ?, Duracion = ?, CantidadMaximaPersonas = ?, Costo = ?, Estado = ? WHERE IDServicio = ?",
            [NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado, id]
        );
        return result;
    },

    // Eliminar servicio
    delete: async (id) => {
        const [result] = await db.query("DELETE FROM servicios WHERE IDServicio = ?", [id]);
        return result;
    }
};

module.exports = ServiciosModel;
