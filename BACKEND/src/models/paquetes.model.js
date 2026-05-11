const db = require("../config/db");

const Paquetes = {

obtenerTodos: async () => {

    const [rows] = await db.query(`
        SELECT
            p.IDPaquete,
            p.NombrePaquete,
            p.Descripcion,
            p.Precio,
            p.Estado,
            p.ImagenPaquete,
            p.IDHabitacion,
            p.IDServicio,

            h.NombreHabitacion,

            s.NombreServicio

        FROM paquetes p
        INNER JOIN habitacion h
            ON p.IDHabitacion = h.IDHabitacion

        INNER JOIN servicio s
            ON p.IDServicio = s.IDServicio
    `);

    return rows.map(r => ({
        ...r,
        ImagenPaquete: Buffer.isBuffer(r.ImagenPaquete)
            ? r.ImagenPaquete.toString('utf8')
            : r.ImagenPaquete
    }));

},

    obtenerPorId: async (id) => {

        const [rows] = await db.query(
            "SELECT * FROM paquetes WHERE IDPaquete = ?",
            [id]
        );

        return rows[0];

    },

    crear: async (paquete) => {

        const {
            NombrePaquete,
            Descripcion,
            IDHabitacion,
            IDServicio,
            Precio,
            Estado,
            IDCliente,
            ImagenURL = null
        } = paquete;

        const sql = `
            INSERT INTO paquetes
            (NombrePaquete, Descripcion, IDHabitacion, IDServicio, Precio, Estado, ImagenPaquete)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            NombrePaquete,
            Descripcion,
            IDHabitacion,
            IDServicio,
            Precio,
            Estado,
            ImagenURL ?? null
        ]);

        return result;

    },

    actualizar: async (id, paquete) => {

        const {
            NombrePaquete,
            Descripcion,
            IDHabitacion,
            IDServicio,
            Precio,
            Estado,
            IDCliente,
            ImagenURL = null
        } = paquete;

        const sql = `
            UPDATE paquetes
            SET NombrePaquete=?, Descripcion=?, IDHabitacion=?, IDServicio=?, Precio=?, Estado=?, ImagenPaquete=?
            WHERE IDPaquete=?
        `;

        const [result] = await db.query(sql, [
            NombrePaquete,
            Descripcion,
            IDHabitacion,
            IDServicio,
            Precio,
            Estado,
            ImagenURL ?? null,
            id
        ]);

        return result;

    },

    eliminar: async (id) => {

        const [result] = await db.query(
            "DELETE FROM paquetes WHERE IDPaquete=?",
            [id]
        );

        return result;

    }

};

module.exports = Paquetes;