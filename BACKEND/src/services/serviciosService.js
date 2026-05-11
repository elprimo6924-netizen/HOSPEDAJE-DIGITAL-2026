const ServiciosModel = require('../models/servicios');

// Función para listar todos los servicios
const listServicios = async () => {
    try {
        const servicios = await ServiciosModel.findAll();
        return servicios;
    } catch (error) {
        throw new Error("Error al obtener los servicios");
    }
};

// Función para obtener un servicio por ID
const getServicioById = async (id) => {
    try {
        const servicio = await ServiciosModel.findById(id);
        if (!servicio) {
            throw new Error("Servicio no encontrado");
        }
        return servicio;
    } catch (error) {
        throw new Error("Error al obtener el servicio: " + error.message);
    }
};

// Función para crear un nuevo servicio
const createServicio = async (data) => {
    try {
        // Validar campos requeridos
        if (!data.NombreServicio || !data.Costo) {
            throw new Error("Nombre y costo son requeridos");
        }

        const result = await ServiciosModel.create(data);
        return result;
    } catch (error) {
        throw new Error("Error al crear el servicio: " + error.message);
    }
};

// Función para actualizar un servicio
const updateServicio = async (id, data) => {
    try {
        const result = await ServiciosModel.update(id, data);
        if (!result.affectedRows || result.affectedRows === 0) {
            throw new Error("Servicio no encontrado");
        }
        return result;
    } catch (error) {
        throw new Error("Error al actualizar el servicio: " + error.message);
    }
};

// Función para eliminar un servicio
const removeServicio = async (id) => {
    try {
        const result = await ServiciosModel.delete(id);
        if (!result.affectedRows || result.affectedRows === 0) {
            throw new Error("Servicio no encontrado");
        }
        return result;
    } catch (error) {
        throw new Error("Error al eliminar el servicio: " + error.message);
    }
};

module.exports = {
    listServicios,
    getServicioById,
    createServicio,
    updateServicio,
    removeServicio
};
