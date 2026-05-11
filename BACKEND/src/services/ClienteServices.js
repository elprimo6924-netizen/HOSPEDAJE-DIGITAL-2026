const ClienteModel = require("../models/Cliente");

// Cliente Service - Lógica de negocio para clientes

const ClienteService = {
    // Obtener todos los clientes
    getAllClientes: async () => {
        try {
            const clientes = await ClienteModel.findAll();
            return clientes;
        } catch (error) {
            throw new Error("Error al obtener los clientes");
        }
    },

    // Obtener cliente por ID
    getClienteById: async (id) => {
        try {
            const cliente = await ClienteModel.findById(id);
            if (!cliente) {
                throw new Error("Cliente no encontrado");
            }
            return cliente;
        } catch (error) {
            throw new Error("Error al obtener el cliente: " + error.message);
        }
    },

    // Crear nuevo cliente
    createCliente: async (clienteData) => {
        try {
            // Validar que los datos requeridos estén presentes
            if (!clienteData.Nombre || !clienteData.Apellido || !clienteData.Email) {
                throw new Error("Nombre, Apellido y Email son requeridos");
            }
            
            const result = await ClienteModel.create(clienteData);
            return result;
        } catch (error) {
            throw new Error("Error al crear el cliente: " + error.message);
        }
    },

    // Actualizar cliente
    updateCliente: async (id, clienteData) => {
        try {
            // Verificar que el cliente existe
            const existingCliente = await ClienteModel.findById(id);
            if (!existingCliente) {
                throw new Error("Cliente no encontrado");
            }
            
            const result = await ClienteModel.update(id, clienteData);
            return result;
        } catch (error) {
            throw new Error("Error al actualizar el cliente: " + error.message);
        }
    },

    // Eliminar cliente
    deleteCliente: async (id) => {
        try {
            // Verificar que el cliente existe
            const existingCliente = await ClienteModel.findById(id);
            if (!existingCliente) {
                throw new Error("Cliente no encontrado");
            }
            
            const result = await ClienteModel.delete(id);
            return result;
        } catch (error) {
            throw new Error("Error al eliminar el cliente: " + error.message);
        }
    }
};

module.exports = ClienteService;
