const Servicios = require("../models/servicios.model");

const ServiciosService = {

    listar: async () => {
        return await Servicios.obtenerTodos();
    },

    obtener: async (id) => {
        return await Servicios.obtenerPorId(id);
    },

    crear: async (data) => {
        return await Servicios.crear(data);
    },

    actualizar: async (id, data) => {
        return await Servicios.actualizar(id, data);
    },

    eliminar: async (id) => {
        return await Servicios.eliminar(id);
    },

    toggleEstado: async (id, estado) => {
        return await Servicios.toggleEstado(id, estado);
    }

};

module.exports = ServiciosService;