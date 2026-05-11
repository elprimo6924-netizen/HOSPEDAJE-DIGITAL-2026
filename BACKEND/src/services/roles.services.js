const database = require("../database/connection");

/**
 * Parsea el campo Permisos de MySQL a un array JavaScript
 * @param {any} permisos - Valor del campo Permisos (puede ser Buffer, string, o array)
 * @returns {Array} - Array de permisos
 */
const parsePermisos = (permisos) => {
    if (!permisos) return [];
    
    try {
        // Si es Buffer (MySQL lo devuelve así a veces), convertir a string
        if (Buffer.isBuffer(permisos)) {
            return JSON.parse(permisos.toString());
        } else if (typeof permisos === 'string') {
            return JSON.parse(permisos);
        } else if (Array.isArray(permisos)) {
            return permisos;
        } else if (typeof permisos === 'object') {
            return Object.values(permisos);
        }
    } catch (e) {
        console.warn('Error parseando Permisos:', e);
    }
    return [];
};

/**
 * Lista todos los roles (activos e inactivos) con paginación
 * @param {Number} page - Número de página (por defecto 1)
 * @param {Number} limit - Cantidad de registros por página (por defecto 10)
 * @returns {Object} { data: [], total: number, page: number, limit: number }
 */
const listRoles = async (page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        
        // Obtener total de roles (activos e inactivos)
        const [countResult] = await database.query("SELECT COUNT(*) as total FROM Roles");
        const total = countResult[0].total;

        // Obtener roles con paginación (todos, no filtrar por IsActive)
        const query = `
            SELECT * FROM Roles 
            ORDER BY IsActive DESC, IDRol ASC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await database.query(query, [limit, offset]);
        
        // Parsear permisos en cada rol
        const rolesParsed = rows.map(rol => ({
            ...rol,
            Permisos: parsePermisos(rol.Permisos)
        }));
        
        return {
            data: rolesParsed,
            total: total,
            page: page,
            limit: limit,
            pages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("Error en listRoles:", error.sqlMessage);
        throw error;
    }
};

const getRolById = async (id) => {
    const [rows] = await database.query("SELECT * FROM Roles WHERE IDRol = ? AND IsActive = 1", [id]);
    const rol = rows[0];
    if (!rol) return null;
    
    // Parsear el campo Permisos
    rol.Permisos = parsePermisos(rol.Permisos);
    
    return rol;
};

const createRol = async (data) => {
    const { NombreRol, IsActive, Permisos } = data;
    const permisosJSON = Permisos ? JSON.stringify(Permisos) : null;
    const [result] = await database.query(
        "INSERT INTO Roles (Nombre, IsActive, Permisos) VALUES (?, ?, ?)",
        [NombreRol, IsActive, permisosJSON]
    );
    return result;
};

const updateRol = async (id, data) => {
    const { NombreRol, IsActive, Permisos } = data;
    const permisosJSON = Permisos ? JSON.stringify(Permisos) : null;
    const [result] = await database.query(
        "UPDATE Roles SET Nombre = ?, IsActive = ?, Permisos = ? WHERE IDRol = ?",
        [NombreRol, IsActive, permisosJSON, id]
    );
    return result;
};

const deleteRol = async (id) => {
    console.log(`🗑️ deleteRol service called with id: ${id}`);
    try {
        // DELETE real de la base de datos
        const [result] = await database.query(
            "DELETE FROM Roles WHERE IDRol = ?", 
            [id]
        );
        console.log(`✅ Rol ${id} eliminado completamente. Affected rows: ${result.affectedRows}`);
        if (result.affectedRows === 0) {
            throw new Error(`Rol ${id} no encontrado`);
        }
        return result;
    } catch (error) {
        console.error(`❌ Error en deleteRol:`, error.message);
        throw error;
    }
};

/**
 * Alterna el estado activo/inactivo de un rol
 * @param {Number} id - ID del rol
 * @param {Boolean} isActive - Nuevo estado (true = activo, false = inactivo)
 * @returns {Object} Resultado de la actualización
 */
const toggleRolStatus = async (id, isActive) => {
    const [result] = await database.query(
        "UPDATE Roles SET IsActive = ? WHERE IDRol = ?",
        [isActive ? 1 : 0, id]
    );
    return result;
};

/**
 * Búsqueda de roles por nombre (activos e inactivos)
 * @param {String} searchTerm - Término de búsqueda
 * @param {Number} page - Número de página
 * @param {Number} limit - Límite de registros
 * @returns {Object} { data: [], total: number, page: number }
 */
const searchRoles = async (searchTerm, page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        const search = `%${searchTerm}%`;

        // Contar total de resultados (activos e inactivos)
        const [countResult] = await database.query(
            "SELECT COUNT(*) as total FROM Roles WHERE Nombre LIKE ?",
            [search]
        );
        const total = countResult[0].total;

        // Obtener resultados con paginación (todos, no filtrar por IsActive)
        const query = `
            SELECT * FROM Roles
            WHERE Nombre LIKE ?
            ORDER BY IsActive DESC, IDRol ASC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await database.query(query, [search, limit, offset]);
        
        // Parsear permisos en cada rol
        const rolesParsed = rows.map(rol => ({
            ...rol,
            Permisos: parsePermisos(rol.Permisos)
        }));
        
        return {
            data: rolesParsed,
            total: total,
            page: page,
            limit: limit,
            pages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("Error en searchRoles:", error.sqlMessage);
        throw error;
    }
};

module.exports = { listRoles, getRolById, createRol, updateRol, deleteRol, toggleRolStatus, searchRoles };