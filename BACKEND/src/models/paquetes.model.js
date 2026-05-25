const db = require("../config/db");

const Paquetes = {

obtenerTodos: async () => {

    const queries = [
        {
            sql: `
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
                    s.NombreServicio,
                    GROUP_CONCAT(DISTINCT ps.IDServicio     ORDER BY ps.IDServicio SEPARATOR ',') AS ServiciosIds,
                    GROUP_CONCAT(DISTINCT sv.NombreServicio ORDER BY ps.IDServicio SEPARATOR ', ') AS NombresServicios
                FROM paquetes p
                INNER JOIN habitaciones h  ON p.IDHabitacion = h.IDHabitacion
                LEFT  JOIN servicios   s  ON p.IDServicio   = s.IDServicio
                LEFT  JOIN paquete_servicios ps ON p.IDPaquete = ps.IDPaquete
                LEFT  JOIN servicios  sv  ON ps.IDServicio  = sv.IDServicio
                GROUP BY p.IDPaquete
            `
        },
        {
            sql: `
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
                    s.NombreServicio,
                    GROUP_CONCAT(DISTINCT ps.IDServicio     ORDER BY ps.IDServicio SEPARATOR ',') AS ServiciosIds,
                    GROUP_CONCAT(DISTINCT sv.NombreServicio ORDER BY ps.IDServicio SEPARATOR ', ') AS NombresServicios
                FROM paquetes p
                INNER JOIN habitacion h  ON p.IDHabitacion = h.IDHabitacion
                LEFT  JOIN servicio   s  ON p.IDServicio   = s.IDServicio
                LEFT  JOIN paquete_servicios ps ON p.IDPaquete = ps.IDPaquete
                LEFT  JOIN servicio  sv  ON ps.IDServicio  = sv.IDServicio
                GROUP BY p.IDPaquete
            `
        },
        {
            sql: `
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
                    s.NombreServicio,
                    NULL AS ServiciosIds,
                    NULL AS NombresServicios
                FROM paquetes p
                INNER JOIN habitacion h  ON p.IDHabitacion = h.IDHabitacion
                LEFT  JOIN servicio   s  ON p.IDServicio   = s.IDServicio
            `
        },
        {
            sql: `
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
                    s.NombreServicio,
                    NULL AS ServiciosIds,
                    NULL AS NombresServicios
                FROM paquetes p
                INNER JOIN habitaciones h  ON p.IDHabitacion = h.IDHabitacion
                LEFT  JOIN servicios   s  ON p.IDServicio   = s.IDServicio
            `
        },
    ];

    let rows = null;
    let lastError = null;

    for (const q of queries) {
        try {
            const [result] = await db.query(q.sql, q.params || []);
            rows = result;
            break;
        } catch (error) {
            lastError = error;
        }
    }

    if (!rows) {
        throw lastError || new Error("No se pudo obtener paquetes");
    }

    return rows.map(r => ({
        ...r,
        ImagenPaquete: Buffer.isBuffer(r.ImagenPaquete) ? r.ImagenPaquete.toString('utf8') : r.ImagenPaquete,
        serviciosIds:  r.ServiciosIds ? r.ServiciosIds.split(',').map(Number) : (r.IDServicio ? [Number(r.IDServicio)] : []),
        NombreServicio: r.NombresServicios || r.NombreServicio || '—',
    }));

},

    obtenerActivos: async () => {

    const queries = [
        {
            sql: `
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
                    s.NombreServicio,
                    GROUP_CONCAT(DISTINCT ps.IDServicio     ORDER BY ps.IDServicio SEPARATOR ',') AS ServiciosIds,
                    GROUP_CONCAT(DISTINCT sv.NombreServicio ORDER BY ps.IDServicio SEPARATOR ', ') AS NombresServicios
                FROM paquetes p
                INNER JOIN habitaciones h  ON p.IDHabitacion = h.IDHabitacion
                LEFT  JOIN servicios   s  ON p.IDServicio   = s.IDServicio
                LEFT  JOIN paquete_servicios ps ON p.IDPaquete = ps.IDPaquete
                LEFT  JOIN servicios  sv  ON ps.IDServicio  = sv.IDServicio
                WHERE p.Estado = 1
                GROUP BY p.IDPaquete
            `
        },
        {
            sql: `
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
                    s.NombreServicio,
                    GROUP_CONCAT(DISTINCT ps.IDServicio     ORDER BY ps.IDServicio SEPARATOR ',') AS ServiciosIds,
                    GROUP_CONCAT(DISTINCT sv.NombreServicio ORDER BY ps.IDServicio SEPARATOR ', ') AS NombresServicios
                FROM paquetes p
                INNER JOIN habitacion h  ON p.IDHabitacion = h.IDHabitacion
                LEFT  JOIN servicio   s  ON p.IDServicio   = s.IDServicio
                LEFT  JOIN paquete_servicios ps ON p.IDPaquete = ps.IDPaquete
                LEFT  JOIN servicio  sv  ON ps.IDServicio  = sv.IDServicio
                WHERE p.Estado = 1
                GROUP BY p.IDPaquete
            `
        },
        {
            sql: `
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
                    s.NombreServicio,
                    NULL AS ServiciosIds,
                    NULL AS NombresServicios
                FROM paquetes p
                INNER JOIN habitacion h  ON p.IDHabitacion = h.IDHabitacion
                LEFT  JOIN servicio   s  ON p.IDServicio   = s.IDServicio
                WHERE p.Estado = 1
            `
        },
        {
            sql: `
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
                    s.NombreServicio,
                    NULL AS ServiciosIds,
                    NULL AS NombresServicios
                FROM paquetes p
                INNER JOIN habitaciones h  ON p.IDHabitacion = h.IDHabitacion
                LEFT  JOIN servicios   s  ON p.IDServicio   = s.IDServicio
                WHERE p.Estado = 1
            `
        },
    ];

    let rows = null;
    let lastError = null;

    for (const q of queries) {
        try {
            const [result] = await db.query(q.sql, q.params || []);
            rows = result;
            break;
        } catch (error) {
            lastError = error;
        }
    }

    if (!rows) {
        throw lastError || new Error("No se pudo obtener paquetes activos");
    }

    return rows.map(r => ({
        ...r,
        ImagenPaquete: Buffer.isBuffer(r.ImagenPaquete) ? r.ImagenPaquete.toString('utf8') : r.ImagenPaquete,
        serviciosIds:  r.ServiciosIds ? r.ServiciosIds.split(',').map(Number) : (r.IDServicio ? [Number(r.IDServicio)] : []),
        NombreServicio: r.NombresServicios || r.NombreServicio || '—',
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
            serviciosIds,
            Precio,
            Estado,
            ImagenURL = null
        } = paquete;

        const svcList   = Array.isArray(serviciosIds) && serviciosIds.length ? serviciosIds : (IDServicio ? [IDServicio] : []);
        const primarySvc = svcList[0] || null;

        const [result] = await db.query(
            `INSERT INTO paquetes (NombrePaquete, Descripcion, IDHabitacion, IDServicio, Precio, Estado, ImagenPaquete)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [NombrePaquete, Descripcion, IDHabitacion, primarySvc, Precio, Estado, ImagenURL ?? null]
        );

        const idPaquete = result.insertId;
        for (const sid of svcList) {
            try {
                await db.query(`INSERT IGNORE INTO paquete_servicios (IDPaquete, IDServicio) VALUES (?, ?)`, [idPaquete, sid]);
            } catch (error) {
                if (error && error.code !== 'ER_NO_SUCH_TABLE') {
                    throw error;
                }
            }
        }

        return result;

    },

    actualizar: async (id, paquete) => {

        const {
            NombrePaquete,
            Descripcion,
            IDHabitacion,
            IDServicio,
            serviciosIds,
            Precio,
            Estado,
            ImagenURL = null
        } = paquete;

        const svcList    = Array.isArray(serviciosIds) && serviciosIds.length ? serviciosIds : (IDServicio ? [IDServicio] : []);
        const primarySvc = svcList[0] || null;

        const [result] = await db.query(
            `UPDATE paquetes
             SET NombrePaquete=?, Descripcion=?, IDHabitacion=?, IDServicio=?, Precio=?, Estado=?, ImagenPaquete=?
             WHERE IDPaquete=?`,
            [NombrePaquete, Descripcion, IDHabitacion, primarySvc, Precio, Estado, ImagenURL ?? null, id]
        );

        // Re-sync junction table (optional)
        try {
            await db.query(`DELETE FROM paquete_servicios WHERE IDPaquete = ?`, [id]);
            for (const sid of svcList) {
                await db.query(`INSERT IGNORE INTO paquete_servicios (IDPaquete, IDServicio) VALUES (?, ?)`, [id, sid]);
            }
        } catch (error) {
            if (error && error.code !== 'ER_NO_SUCH_TABLE') {
                throw error;
            }
        }

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