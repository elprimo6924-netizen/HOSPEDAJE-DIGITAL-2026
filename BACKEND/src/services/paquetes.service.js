const Paquetes = require("../models/paquetes.model");

const PaquetesService = {

    listar: async () => {
        return await Paquetes.obtenerTodos();
    },

    obtener: async (id) => {
        return await Paquetes.obtenerPorId(id);
    },

    crear: async (data) => {
        return await Paquetes.crear(data);
    },

    actualizar: async (id, data) => {
        return await Paquetes.actualizar(id, data);
    },

    eliminar: async (id) => {
        return await Paquetes.eliminar(id);
    }

};

module.exports = PaquetesService;