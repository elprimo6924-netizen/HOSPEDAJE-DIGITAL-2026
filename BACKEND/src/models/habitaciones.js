const db = require("../database/connection");

// Get all rooms / list
const getAll = async () => {
    const[rows] = await db.execute("SELECT * FROM habitacion");
    return rows;
   }; 

// Get room by ID
const getById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM habitacion WHERE IDHabitacion = ?", [id]);
    return rows[0];
};
// CREATE habitacion POST
const create = async (data) => {
    const { NombreHabitacion, ImagenHabitacion, Descripcion, Costo, Estado } = data;
    const [result] = await db.execute(
        "INSERT INTO habitacion (NombreHabitacion, ImagenHabitacion, Descripcion, Costo, Estado) VALUES (?, ?, ?, ?, ?)",
        [NombreHabitacion, ImagenHabitacion, Descripcion, Costo, Estado]
    );
    return result.insertId;     
};
// UPDATE habitacion PUT
const update = async (id, data) => {
    const { NombreHabitacion, ImagenHabitacion, Descripcion, Costo, Estado } = data;
    const [result] = await db.execute(
        "UPDATE habitacion SET NombreHabitacion = ?, ImagenHabitacion = ?, Descripcion = ?, Costo = ?, Estado = ? WHERE IDHabitacion = ?",
        [NombreHabitacion, ImagenHabitacion, Descripcion, Costo, Estado, id]
    );
    return result.affectedRows > 0;
};
// DELETE habitacion
const remove = async (id) => {
    const [result] = await db.execute("DELETE FROM habitacion WHERE IDHabitacion = ?", [id]);
    return result.affectedRows > 0;
};


module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};      



