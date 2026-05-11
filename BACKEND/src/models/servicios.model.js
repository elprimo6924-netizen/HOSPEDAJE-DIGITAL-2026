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
            Estado
        } = servicio;

        const sql = `
            INSERT INTO servicio
            (NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            NombreServicio,
            Descripcion,
            Duracion,
            CantidadMaximaPersonas,
            Costo,
            Estado
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
            Estado
        } = servicio;

        const sql = `
            UPDATE servicio
            SET NombreServicio=?, Descripcion=?, Duracion=?, CantidadMaximaPersonas=?, Costo=?, Estado=?
            WHERE IDServicio=?
        `;

        const [result] = await db.query(sql, [
            NombreServicio,
            Descripcion,
            Duracion,
            CantidadMaximaPersonas,
            Costo,
            Estado,
            id
        ]);

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