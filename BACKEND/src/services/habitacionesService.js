const habitacionesModel = require('../models/habitaciones');

// Función para listar todas las habitaciones
const listHabitaciones = async () => {
    try {
        const habitaciones = await habitacionesModel.getAll();
        return habitaciones;
    } catch (error) {
        throw new Error("Error al obtener las habitaciones");
    }
};

// Función para obtener una habitación por ID
const getHabitacionById = async (id) => {
    try {
        const habitacion = await habitacionesModel.getById(id);
        if (!habitacion) {
            throw new Error("Habitación no encontrada");
        }
        return habitacion;
    } catch (error) {
        throw new Error("Error al obtener la habitación: " + error.message);
    }
};

// Función para crear una nueva habitación
const createHabitacion = async (data) => {
    try {
        // Validar campos requeridos
        if (!data.NombreHabitacion || !data.Costo) {
            throw new Error("Nombre y costo son requeridos");
        }

        const result = await habitacionesModel.create(data);
        return result;
    } catch (error) {
        throw new Error("Error al crear la habitación: " + error.message);
    }
};

// Función para actualizar una habitación
const updateHabitacion = async (id, data) => {
    try {
        const result = await habitacionesModel.update(id, data);
        if (!result) {
            throw new Error("Habitación no encontrada");
        }
        return result;
    } catch (error) {
        throw new Error("Error al actualizar la habitación: " + error.message);
    }
};

// Función para eliminar una habitación
const removeHabitacion = async (id) => {
    try {
        const result = await habitacionesModel.remove(id);
        if (!result) {
            throw new Error("Habitación no encontrada");
        }
        return result;
    } catch (error) {
        throw new Error("Error al eliminar la habitación: " + error.message);
    }
};

module.exports = {
    listHabitaciones,
    getHabitacionById,
    createHabitacion,
    updateHabitacion,
    removeHabitacion
};                          



