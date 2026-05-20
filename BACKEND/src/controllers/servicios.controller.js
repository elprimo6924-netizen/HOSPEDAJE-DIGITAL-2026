const ServiciosService = require("../services/servicios.service");
const db = require("../config/db");

const ServiciosController = {

    listar: async (req, res) => {

        try {

            const data = await ServiciosService.listar();

            res.json(data);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error obteniendo servicios"
            });

        }

    },

    listarActivos: async (req, res) => {

        try {

            const [rows] = await db.query(
                "SELECT * FROM servicio WHERE Estado = 1 ORDER BY NombreServicio ASC"
            );

            res.json(rows);

        } catch (error) {

            res.status(500).json({ error: "Error obteniendo servicios activos" });

        }

    },

    obtener: async (req, res) => {

        try {

            const data = await ServiciosService.obtener(req.params.id);

            res.json(data);

        } catch (error) {

            res.status(500).json({
                error: "Error obteniendo servicio"
            });

        }

    },

crear: async (req, res) => {

    try {

        console.log("BODY:", req.body);

        const data = await ServiciosService.crear(req.body);

        res.status(201).json({
            mensaje: "Servicio creado correctamente",
            data
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error creando servicio",
            detalle: error.message
        });

    }

},

    actualizar: async (req, res) => {

        try {

            const data = await ServiciosService.actualizar(
                req.params.id,
                req.body
            );

            res.json({
                mensaje: "Servicio actualizado",
                data
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error actualizando servicio",
                detalle: error.message
            });

        }

    },

    eliminar: async (req, res) => {

        try {

            const id = req.params.id;

            const [[{ totalReservas }]] = await db.query(
                `SELECT COUNT(*) AS totalReservas FROM detallereservaservicio WHERE IDServicio = ?`,
                [id]
            );
            if (totalReservas > 0) {
                return res.status(409).json({
                    error: "No se puede eliminar este servicio porque está asociado a reservas existentes."
                });
            }

            const data = await ServiciosService.eliminar(id);

            res.json({
                mensaje: "Servicio eliminado",
                data
            });

        } catch (error) {

            res.status(500).json({
                error: "Error eliminando servicio"
            });

        }

    },

    toggleEstado: async (req, res) => {

        try {

            const { Estado } = req.body;

            if (Estado === undefined || Estado === null) {
                return res.status(400).json({ error: "Campo Estado es requerido" });
            }

            await ServiciosService.toggleEstado(req.params.id, Estado);

            res.json({ mensaje: "Estado del servicio actualizado", Estado });

        } catch (error) {

            res.status(500).json({ error: "Error actualizando estado del servicio" });

        }

    }

};

module.exports = ServiciosController;