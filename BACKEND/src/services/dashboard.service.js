const db = require("../config/db");

const DashboardService = {

    estadisticas: async () => {

        // D1: Current-month income (confirmed / completed / en-curso reservations)
        const [[{ ingresosMes }]] = await db.query(`
            SELECT COALESCE(SUM(r.Monto_Total), 0) AS ingresosMes
            FROM reserva r
            LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
            WHERE MONTH(r.FechaReserva) = MONTH(CURDATE())
              AND YEAR(r.FechaReserva)  = YEAR(CURDATE())
              AND LOWER(COALESCE(e.NombreEstadoReserva,''))
                  NOT IN ('cancelada','anulada','rechazada')
        `);

        // D1: Reservations active right now (date range covers today, non-cancelled)
        const [[{ reservasActivas }]] = await db.query(`
            SELECT COUNT(*) AS reservasActivas
            FROM reserva r
            LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
            WHERE DATE(r.FechaInicio)       <= CURDATE()
              AND DATE(r.FechaFinalizacion) >= CURDATE()
              AND LOWER(COALESCE(e.NombreEstadoReserva,''))
                  NOT IN ('cancelada','anulada','rechazada')
        `);

        // D1: Distinct rooms occupied today (through paquetes, non-cancelled)
        const [[{ habOcupadas }]] = await db.query(`
            SELECT COUNT(DISTINCT p.IDHabitacion) AS habOcupadas
            FROM reserva r
            JOIN detallereservapaquetes drp ON drp.IDReserva = r.IdReserva
            JOIN paquetes p                 ON p.IDPaquete   = drp.IDPaquete
            LEFT JOIN estadosreserva e      ON e.IdEstadoReserva = r.IdEstadoReserva
            WHERE DATE(r.FechaInicio)       <= CURDATE()
              AND DATE(r.FechaFinalizacion) >= CURDATE()
              AND LOWER(COALESCE(e.NombreEstadoReserva,''))
                  NOT IN ('cancelada','anulada','rechazada')
        `);

        // D1: Total registered clients
        const [[{ totalClientes }]] = await db.query(
            "SELECT COUNT(*) AS totalClientes FROM clientes"
        );

        // D1: Active packages available for booking
        const [[{ paqActivos }]] = await db.query(
            "SELECT COUNT(*) AS paqActivos FROM paquetes WHERE Estado = 1"
        );

        // Chart: reservations and revenue per month (last 6 months)
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

        // Chart: reservations by status
        const [reservasPorEstado] = await db.query(`
            SELECT
                COALESCE(e.NombreEstadoReserva, CONCAT('Estado ', r.IdEstadoReserva)) AS nombre,
                COUNT(*) AS total
            FROM reserva r
            LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
            GROUP BY r.IdEstadoReserva
            ORDER BY total DESC
        `);

        // Ranking: top 5 packages
        const [topPaquetes] = await db.query(`
            SELECT p.NombrePaquete, COUNT(*) AS total
            FROM detallereservapaquetes d
            JOIN paquetes p ON d.IDPaquete = p.IDPaquete
            GROUP BY d.IDPaquete
            ORDER BY total DESC
            LIMIT 5
        `);

        // Ranking: top 5 services
        const [topServicios] = await db.query(`
            SELECT s.NombreServicio, COUNT(*) AS total
            FROM detallereservaservicio d
            JOIN servicio s ON d.IDServicio = s.IDServicio
            GROUP BY d.IDServicio
            ORDER BY total DESC
            LIMIT 5
        `);

        // Recent reservations table
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
            ingresosMes:      Number(ingresosMes),
            reservasActivas:  Number(reservasActivas),
            habOcupadas:      Number(habOcupadas),
            totalClientes:    Number(totalClientes),
            paqActivos:       Number(paqActivos),
            reservasPorMes,
            reservasPorEstado,
            topPaquetes,
            topServicios,
            reservasRecientes,
        };
    }
};

module.exports = DashboardService;
