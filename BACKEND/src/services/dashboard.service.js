const db = require("../config/db");

const DashboardService = {

    estadisticas: async () => {

        const [[{ totalReservas }]]  = await db.query("SELECT COUNT(*) AS totalReservas FROM reserva");
        const [[{ ingresosTotales }]] = await db.query("SELECT COALESCE(SUM(Monto_Total),0) AS ingresosTotales FROM reserva");
        const [[{ totalClientes }]]  = await db.query("SELECT COUNT(*) AS totalClientes FROM clientes");
        const [[{ habActivas }]]     = await db.query("SELECT COUNT(*) AS habActivas FROM habitacion WHERE Estado=1");
        const [[{ paqActivos }]]     = await db.query("SELECT COUNT(*) AS paqActivos FROM paquetes WHERE Estado=1");

        const [reservasPorMes] = await db.query(`
            SELECT
                DATE_FORMAT(FechaInicio, '%Y-%m') AS mes,
                COUNT(*)                           AS total,
                COALESCE(SUM(Monto_Total), 0)      AS ingresos
            FROM reserva
            GROUP BY mes
            ORDER BY mes ASC
            LIMIT 6
        `);

        const [reservasPorEstado] = await db.query(`
            SELECT
                COALESCE(e.NombreEstadoReserva, CONCAT('Estado ', r.IdEstadoReserva)) AS nombre,
                COUNT(*) AS total
            FROM reserva r
            LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
            GROUP BY r.IdEstadoReserva
            ORDER BY total DESC
        `);

        const [topPaquetes] = await db.query(`
            SELECT p.NombrePaquete, COUNT(*) AS total
            FROM detallereservapaquetes d
            JOIN paquetes p ON d.IDPaquete = p.IDPaquete
            GROUP BY d.IDPaquete
            ORDER BY total DESC
            LIMIT 5
        `);

        const [topServicios] = await db.query(`
            SELECT s.NombreServicio, COUNT(*) AS total
            FROM detallereservaservicio d
            JOIN servicio s ON d.IDServicio = s.IDServicio
            GROUP BY d.IDServicio
            ORDER BY total DESC
            LIMIT 5
        `);

        const [reservasRecientes] = await db.query(`
            SELECT
                r.IdReserva,
                r.NroDocumentoCliente,
                r.FechaInicio,
                r.FechaFinalizacion,
                r.Monto_Total,
                COALESCE(e.NombreEstadoReserva, '—') AS estado
            FROM reserva r
            LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
            ORDER BY r.FechaReserva DESC
            LIMIT 8
        `);

        return {
            totalReservas,
            ingresosTotales: Number(ingresosTotales),
            totalClientes,
            habActivas,
            paqActivos,
            reservasPorMes,
            reservasPorEstado,
            topPaquetes,
            topServicios,
            reservasRecientes,
        };
    }
};

module.exports = DashboardService;
