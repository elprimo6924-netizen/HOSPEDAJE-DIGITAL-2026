const database = require("../database/connection");

/**
 * Lista todos los usuarios con paginación
 * @param {Number} page - Número de página (por defecto 1)
 * @param {Number} limit - Cantidad de registros por página (por defecto 10)
 * @returns {Object} { data: [], total: number, page: number, limit: number }
 */
const listUsuarios = async (page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        
        // Obtener total de usuarios
        const [countResult] = await database.query("SELECT COUNT(*) as total FROM Usuarios");
        const total = countResult[0].total;

        // Obtener usuarios con paginación
        const query = `
            SELECT u.*, r.Nombre as NombreRol
            FROM Usuarios u
            LEFT JOIN Roles r ON u.IDRol = r.IDRol
            ORDER BY u.IDUsuario DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await database.query(query, [limit, offset]);
        
        return {
            data: rows,
            total: total,
            page: page,
            limit: limit,
            pages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("Error en listUsuarios:", error.sqlMessage);
        throw error; 
    }
};

const getUsuarioById = async (id) => {
    const query = `
        SELECT u.*, r.Nombre as NombreRol
        FROM Usuarios u
        LEFT JOIN Roles r ON u.IDRol = r.IDRol
        WHERE u.IDUsuario = ?
    `;
    const [rows] = await database.query(query, [id]);
    return rows[0];
};

const createUsuario = async (data) => {
    const { 
        Contrasena, Nombre, Apellido, Email, 
        TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, IsActive
    } = data;

    // IDRol viene del body, por defecto 2 (Cliente)
    const rol = IDRol || 2;
    // IsActive viene del body, por defecto 1 (Activo)
    const isActive = IsActive !== undefined ? IsActive : 1;
    
    const [result] = await database.query(
        `INSERT INTO Usuarios (Contrasena, Nombre, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, IsActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [Contrasena, Nombre, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, rol, isActive]
    );
    return result;
};


const updateUsuario = async (id, data) => {
    // Construir dinámicamente la query solo con los campos proporcionados
    const allowedFields = ['Nombre', 'Apellido', 'Email', 'TipoDocumento', 'NumeroDocumento', 'Telefono', 'Pais', 'Direccion', 'IDRol', 'IsActive'];
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(data).forEach(key => {
        if (allowedFields.includes(key) && data[key] !== undefined && data[key] !== null && data[key] !== '') {
            updateFields.push(`${key} = ?`);
            updateValues.push(data[key]);
        }
    });
    
    // Si no hay campos para actualizar, retornar error
    if (updateFields.length === 0) {
        throw new Error('No hay datos para actualizar');
    }
    
    // Agregar el ID al final
    updateValues.push(id);
    
    const query = `UPDATE Usuarios SET ${updateFields.join(', ')} WHERE IDUsuario = ?`;
    const [result] = await database.query(query, updateValues);
    return result;
};

const deleteUsuario = async (id) => {
    const [result] = await database.query("DELETE FROM Usuarios WHERE IDUsuario = ?", [id]);
    return result;
};

/**
 * Alterna el estado activo/inactivo de un usuario
 * @param {Number} id - ID del usuario
 * @param {Boolean} isActive - Nuevo estado (true = activo, false = inactivo)
 * @returns {Object} Resultado de la actualización
 */
const toggleUsuarioStatus = async (id, isActive) => {
    const [result] = await database.query(
        "UPDATE Usuarios SET IsActive = ? WHERE IDUsuario = ?",
        [isActive ? 1 : 0, id]
    );
    return result;
};

/**
 * Búsqueda de usuarios por nombre o email
 * @param {String} searchTerm - Término de búsqueda
 * @param {Number} page - Número de página
 * @param {Number} limit - Límite de registros
 * @returns {Object} { data: [], total: number, page: number }
 */
const searchUsuarios = async (searchTerm, page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        const search = `%${searchTerm}%`;

        // Contar total de resultados
        const [countResult] = await database.query(
            `SELECT COUNT(*) as total FROM Usuarios 
             WHERE Nombre LIKE ? OR Email LIKE ?`,
            [search, search]
        );
        const total = countResult[0].total;

        // Obtener resultados con paginación
        const query = `
            SELECT u.*, r.Nombre as NombreRol
            FROM Usuarios u
            LEFT JOIN Roles r ON u.IDRol = r.IDRol
            WHERE u.Nombre LIKE ? OR u.Email LIKE ?
            ORDER BY u.IDUsuario DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await database.query(query, [search, search, limit, offset]);
        
        return {
            data: rows,
            total: total,
            page: page,
            limit: limit,
            pages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("Error en searchUsuarios:", error.sqlMessage);
        throw error;
    }
};


module.exports = { listUsuarios, getUsuarioById, createUsuario, updateUsuario, deleteUsuario, toggleUsuarioStatus, searchUsuarios };