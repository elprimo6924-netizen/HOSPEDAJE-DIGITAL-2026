/**
 * Modelo de Reservas
 */

const db = require('../database/connection');

// Listar todas las reservas
const list = async () => {
    const [reservas] = await db.execute(`
        SELECT r.*, c.Nombre, c.Apellido, c.Email, e.NombreEstadoReserva AS EstadoReservaNombre
        FROM reserva r
        LEFT JOIN clientes c ON r.IDCliente = c.IDCliente
        LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
        ORDER BY r.FechaReserva DESC
    `);
    return reservas;
};

// Obtener reserva por ID
const getById = async (id) => {
    const [rows] = await db.execute(`
        SELECT r.*, c.Nombre, c.Apellido, c.Email, c.Telefono, e.NombreEstadoReserva AS EstadoReservaNombre
        FROM reserva r
        LEFT JOIN clientes c ON r.IDCliente = c.IDCliente
        LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
        WHERE r.IdReserva = ?
    `, [id]);
    return rows[0];
};

// Crear reserva
const create = async (reservaData) => {
    const {
        IDCliente,
        IDHabitacion,
        FechaInicio,
        FechaFinalizacion,
        SubTotal,
        Descuento,
        IVA,
        MontoTotal,
        MetodoPago,
        IdEstadoReserva,
        UsuarioIdusuario
    } = reservaData;

    const [result] = await db.execute(
        `INSERT INTO reserva (IDCliente, IDHabitacion, FechaReserva, FechaInicio, FechaFinalizacion, SubTotal, Descuento, IVA, MontoTotal, MetodoPago, IdEstadoReserva, UsuarioIdusuario)
         VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [IDCliente, IDHabitacion, FechaInicio, FechaFinalizacion, SubTotal, Descuento, IVA, MontoTotal, MetodoPago, IdEstadoReserva, UsuarioIdusuario]
    );
    return result;
};

// Actualizar reserva
const updateReserva = async (id, reservaData) => {
    const {
        IDCliente,
        IDHabitacion,
        FechaInicio,
        FechaFinalizacion,
        SubTotal,
        Descuento,
        IVA,
        MontoTotal,
        MetodoPago,
        IdEstadoReserva,
        UsuarioIdusuario
    } = reservaData;

    const [result] = await db.execute(
        `UPDATE reserva SET IDCliente = ?, IDHabitacion = ?, FechaInicio = ?, FechaFinalizacion = ?, SubTotal = ?, Descuento = ?, IVA = ?, MontoTotal = ?, MetodoPago = ?, IdEstadoReserva = ?, UsuarioIdusuario = ? WHERE IdReserva = ?`,
        [IDCliente, IDHabitacion, FechaInicio, FechaFinalizacion, SubTotal, Descuento, IVA, MontoTotal, MetodoPago, IdEstadoReserva, UsuarioIdusuario, id]
    );
    return result;
};

// Eliminar reserva
const deleteReserva = async (id) => {
    console.log('Intentando eliminar reserva con ID:', id);
    try {
        const [result] = await db.execute("DELETE FROM reserva WHERE IdReserva = ?", [id]);
        console.log('Resultado de eliminación:', result);
        console.log('Filas afectadas:', result.affectedRows);
        return result;
    } catch (error) {
        console.error('Error en deleteReserva:', error);
        throw error;
    }
};

// Obtener reservas por cliente
const getByCliente = async (nroDocumento) => {
    const [reservas] = await db.execute(`
        SELECT r.*, c.Nombre, c.Apellido, e.NombreEstadoReserva AS EstadoReservaNombre
        FROM reserva r
        LEFT JOIN clientes c ON r.IDCliente = c.IDCliente
        LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
        WHERE c.NroDocumento = ?
        ORDER BY r.FechaReserva DESC
    `, [nroDocumento]);
    return reservas;
};

const getEstadosReserva = async () => {
    const [estados] = await db.execute(`
        SELECT IdEstadoReserva, NombreEstadoReserva
        FROM estadosreserva
        ORDER BY IdEstadoReserva
    `);
    return estados;
};

const getServicesByReserva = async (idReserva, estadoFiltro = 1) => {
    const [reservaRows] = await db.execute(
        'SELECT IdReserva FROM reserva WHERE IdReserva = ?',
        [idReserva]
    );

    if (!reservaRows.length) {
        const error = new Error('Reserva no encontrada');
        error.code = 'RESERVA_NOT_FOUND';
        throw error;
    }

    let query = `SELECT
            drs.IDDetalleReservaServicio,
            drs.IDReserva,
            drs.IDServicio,
            s.NombreServicio,
            s.Descripcion,
            drs.Cantidad,
            drs.Precio,
            (drs.Cantidad * drs.Precio) AS TotalLinea,
            drs.Estado
         FROM detallereservaservicio drs
         INNER JOIN servicios s ON s.IDServicio = drs.IDServicio
         WHERE drs.IDReserva = ?`;

    const params = [idReserva];

    if (estadoFiltro === 0 || estadoFiltro === 1) {
        query += ' AND drs.Estado = ?';
        params.push(estadoFiltro);
    }

    query += ' ORDER BY drs.IDDetalleReservaServicio DESC';

    const [services] = await db.execute(query, params);

    return services;
};

const addServiceToReserva = async (idReserva, serviceData) => {
    const { IDServicio, Cantidad, Precio, Estado = 1 } = serviceData;

    await db.beginTransaction();

    try {
        const [reservaRows] = await db.execute(
            'SELECT IdReserva, SubTotal, Descuento, IVA FROM reserva WHERE IdReserva = ?',
            [idReserva]
        );

        if (!reservaRows.length) {
            const error = new Error('Reserva no encontrada');
            error.code = 'RESERVA_NOT_FOUND';
            throw error;
        }

        const [servicioRows] = await db.execute(
            'SELECT IDServicio, Costo, Estado FROM servicios WHERE IDServicio = ?',
            [IDServicio]
        );

        if (!servicioRows.length) {
            const error = new Error('Servicio no encontrado');
            error.code = 'SERVICIO_NOT_FOUND';
            throw error;
        }

        if (Number(servicioRows[0].Estado) !== 1) {
            const error = new Error('El servicio seleccionado no está activo');
            error.code = 'SERVICIO_INACTIVO';
            throw error;
        }

        const [sumBeforeRows] = await db.execute(
            `SELECT COALESCE(SUM(Cantidad * Precio), 0) AS totalServiciosAntes
             FROM detallereservaservicio
             WHERE IDReserva = ? AND Estado = 1`,
            [idReserva]
        );

        const precioFinal = Number(Precio ?? servicioRows[0].Costo);

        const [existingDetailRows] = await db.execute(
            `SELECT IDDetalleReservaServicio, Cantidad, Precio
             FROM detallereservaservicio
             WHERE IDReserva = ? AND IDServicio = ? AND Estado = 1
             ORDER BY IDDetalleReservaServicio DESC`,
            [idReserva, IDServicio]
        );

        let detalleResult;
        let operation;

        if (existingDetailRows.length > 0) {
            const detalleExistente = existingDetailRows[0];
            const idsDuplicados = existingDetailRows
                .slice(1)
                .map((row) => Number(row.IDDetalleReservaServicio));
            const cantidadExistenteTotal = existingDetailRows.reduce(
                (acc, row) => acc + Number(row.Cantidad),
                0
            );
            const nuevaCantidad = cantidadExistenteTotal + Number(Cantidad);
            const nuevoPrecio = Precio !== null && Precio !== undefined
                ? precioFinal
                : Number(detalleExistente.Precio);

            [detalleResult] = await db.execute(
                `UPDATE detallereservaservicio
                 SET Cantidad = ?, Precio = ?
                 WHERE IDDetalleReservaServicio = ?`,
                [nuevaCantidad, nuevoPrecio, detalleExistente.IDDetalleReservaServicio]
            );

            if (idsDuplicados.length > 0) {
                await db.execute(
                    `UPDATE detallereservaservicio
                     SET Estado = 0
                     WHERE IDReserva = ? AND IDServicio = ? AND Estado = 1 AND IDDetalleReservaServicio <> ?`,
                    [idReserva, IDServicio, detalleExistente.IDDetalleReservaServicio]
                );
            }

            operation = {
                type: 'updated',
                id: detalleExistente.IDDetalleReservaServicio
            };
        } else {
            [detalleResult] = await db.execute(
                `INSERT INTO detallereservaservicio (IDReserva, IDServicio, Cantidad, Precio, Estado)
                 VALUES (?, ?, ?, ?, ?)`,
                [idReserva, IDServicio, Cantidad, precioFinal, Estado]
            );

            operation = {
                type: 'inserted',
                id: detalleResult.insertId
            };
        }

        const [sumRows] = await db.execute(
            `SELECT COALESCE(SUM(Cantidad * Precio), 0) AS totalServicios
             FROM detallereservaservicio
             WHERE IDReserva = ? AND Estado = 1`,
            [idReserva]
        );

        const subtotalActualReserva = Number(reservaRows[0].SubTotal || 0);
        const totalServiciosAntes = Number(sumBeforeRows[0].totalServiciosAntes || 0);
        const totalServicios = Number(sumRows[0].totalServicios || 0);
        const subtotalBaseSinServicios = Math.max(0, subtotalActualReserva - totalServiciosAntes);
        const nuevoSubTotal = subtotalBaseSinServicios + totalServicios;

        await db.execute(
            `UPDATE reserva
             SET SubTotal = ?,
                 MontoTotal = (? - COALESCE(Descuento, 0)) + COALESCE(IVA, 0)
             WHERE IdReserva = ?`,
            [nuevoSubTotal, nuevoSubTotal, idReserva]
        );

        await db.commit();

        const [reservaActualizadaRows] = await db.execute(
            'SELECT * FROM reserva WHERE IdReserva = ?',
            [idReserva]
        );

        return {
            operation,
            reservaActualizada: reservaActualizadaRows[0]
        };
    } catch (error) {
        await db.rollback();
        throw error;
    }
};

const removeServiceFromReserva = async (idReserva, idDetalleReservaServicio) => {
    await db.beginTransaction();

    try {
        const [reservaRows] = await db.execute(
            'SELECT IdReserva, SubTotal, Descuento, IVA FROM reserva WHERE IdReserva = ?',
            [idReserva]
        );

        if (!reservaRows.length) {
            const error = new Error('Reserva no encontrada');
            error.code = 'RESERVA_NOT_FOUND';
            throw error;
        }

        const [detalleRows] = await db.execute(
            `SELECT IDDetalleReservaServicio, IDReserva, Estado
             FROM detallereservaservicio
             WHERE IDDetalleReservaServicio = ? AND IDReserva = ?`,
            [idDetalleReservaServicio, idReserva]
        );

        if (!detalleRows.length) {
            const error = new Error('Detalle de servicio no encontrado para esta reserva');
            error.code = 'DETALLE_NOT_FOUND';
            throw error;
        }

        if (Number(detalleRows[0].Estado) !== 1) {
            const error = new Error('El detalle de servicio ya está inactivo');
            error.code = 'DETALLE_ALREADY_INACTIVE';
            throw error;
        }

        const [sumBeforeRows] = await db.execute(
            `SELECT COALESCE(SUM(Cantidad * Precio), 0) AS totalServiciosAntes
             FROM detallereservaservicio
             WHERE IDReserva = ? AND Estado = 1`,
            [idReserva]
        );

        await db.execute(
            `UPDATE detallereservaservicio
             SET Estado = 0
             WHERE IDDetalleReservaServicio = ? AND IDReserva = ?`,
            [idDetalleReservaServicio, idReserva]
        );

        const [sumAfterRows] = await db.execute(
            `SELECT COALESCE(SUM(Cantidad * Precio), 0) AS totalServiciosDespues
             FROM detallereservaservicio
             WHERE IDReserva = ? AND Estado = 1`,
            [idReserva]
        );

        const subtotalActualReserva = Number(reservaRows[0].SubTotal || 0);
        const totalServiciosAntes = Number(sumBeforeRows[0].totalServiciosAntes || 0);
        const totalServiciosDespues = Number(sumAfterRows[0].totalServiciosDespues || 0);
        const subtotalBaseSinServicios = Math.max(0, subtotalActualReserva - totalServiciosAntes);
        const nuevoSubTotal = subtotalBaseSinServicios + totalServiciosDespues;

        await db.execute(
            `UPDATE reserva
             SET SubTotal = ?,
                 MontoTotal = (? - COALESCE(Descuento, 0)) + COALESCE(IVA, 0)
             WHERE IdReserva = ?`,
            [nuevoSubTotal, nuevoSubTotal, idReserva]
        );

        await db.commit();

        const [reservaActualizadaRows] = await db.execute(
            'SELECT * FROM reserva WHERE IdReserva = ?',
            [idReserva]
        );

        return {
            detalleDesactivadoId: idDetalleReservaServicio,
            reservaActualizada: reservaActualizadaRows[0]
        };
    } catch (error) {
        await db.rollback();
        throw error;
    }
};

module.exports = {
    list,
    getById,
    create,
    update: updateReserva,
    delete: deleteReserva,
    getByCliente,
    getEstadosReserva,
    getServicesByReserva,
    addServiceToReserva,
    removeServiceFromReserva
};
