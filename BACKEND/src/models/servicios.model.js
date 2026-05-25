const db = require("../config/db");

const servicio = {

    obtenerTodos: async () => {

        const [rows] = await db.query("SELECT * FROM servicio");
        return rows;

    },

    obtenerPorId: async (id) => {

        const [rows] = await db.query(
            "SELECT * FROM servicio WHERE IDServicio = ?",
            [id]
        );

        return rows[0];

    },

    crear: async (servicio) => {

        const {
            NombreServicio,
            Descripcion,
            Duracion,
            CantidadMaximaPersonas,
            Costo,
            Estado,
            imagen_url
        } = servicio;

        const sql = `
            INSERT INTO servicio
            (NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado, imagen_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            NombreServicio,
            Descripcion,
            Duracion,
            CantidadMaximaPersonas,
            Costo,
            Estado,
            imagen_url || null
        ]);

        return result;

    },

    actualizar: async (id, servicio) => {

        const {
            NombreServicio,
            Descripcion,
            Duracion,
            CantidadMaximaPersonas,
            Costo,
            Estado,
            imagen_url
        } = servicio;

        const sqlActualizar = imagen_url !== undefined
            ? `UPDATE servicio SET NombreServicio=?, Descripcion=?, Duracion=?, CantidadMaximaPersonas=?, Costo=?, Estado=?, imagen_url=? WHERE IDServicio=?`
            : `UPDATE servicio SET NombreServicio=?, Descripcion=?, Duracion=?, CantidadMaximaPersonas=?, Costo=?, Estado=? WHERE IDServicio=?`;

        const valores = imagen_url !== undefined
            ? [NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado, imagen_url, id]
            : [NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado, id];

        const [result] = await db.query(sqlActualizar, valores);

        return result;

    },

    eliminar: async (id) => {

        const [result] = await db.query(
            "DELETE FROM servicio WHERE IDServicio=?",
            [id]
        );

        return result;

    },

    toggleEstado: async (id, estado) => {

        const [result] = await db.query(
            "UPDATE servicio SET Estado=? WHERE IDServicio=?",
            [estado, id]
        );

        return result;

    }

};

module.exports = servicio;