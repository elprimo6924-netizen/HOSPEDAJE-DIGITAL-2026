const PaquetesService = require("../services/paquetes.service");

const PaquetesController = {

    listar: async (req, res) => {

        try {

            const data = await PaquetesService.listar();

            res.json(data);

        } catch (error) {

            res.status(500).json({
                error: "Error obteniendo paquetes"
            });

        }

    },

    obtener: async (req, res) => {

        try {

            const data = await PaquetesService.obtener(req.params.id);

            res.json(data);

        } catch (error) {

            res.status(500).json({
                error: "Error obteniendo paquete"
            });

        }

    },

    crear: async (req, res) => {

        try {

            const data = await PaquetesService.crear(req.body);

            res.status(201).json({
                mensaje: "Paquete creado correctamente",
                data
            });

        } catch (error) {

            res.status(500).json({
                error: "Error creando paquete",
                detalle: error.message
            });

        }

    },

    actualizar: async (req, res) => {

        try {

            const data = await PaquetesService.actualizar(
                req.params.id,
                req.body
            );

            res.json({
                mensaje: "Paquete actualizado",
                data
            });

        } catch (error) {

            res.status(500).json({
                error: "Error actualizando paquete"
            });

        }

    },

    eliminar: async (req, res) => {

        try {

            const data = await PaquetesService.eliminar(req.params.id);

            res.json({
                mensaje: "Paquete eliminado",
                data
            });

        } catch (error) {

            res.status(500).json({
                error: "Error eliminando paquete"
            });

        }

    }

};

module.exports = PaquetesController;