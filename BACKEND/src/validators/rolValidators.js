const CustomError = require("../errors/customError");

// IDs de roles protegidos que no se pueden eliminar ni desactivar
const PROTECTED_ROLE_IDS = [1, 2]; // 1 = Administrador, 2 = Cliente

/**
 * Valida que no se intente eliminar un rol protegido
 * @param {Number} rolId - ID del rol a validar
 * @throws {CustomError} Si es un rol protegido
 */
const validateRoleNotProtected = (rolId) => {
  if (PROTECTED_ROLE_IDS.includes(parseInt(rolId))) {
    throw new CustomError(
      403,
      "No se puede eliminar el rol Administrador o Cliente"
    );
  }
  return true;
};

/**
 * Valida que no se intente desactivar un rol protegido
 * @param {Number} rolId - ID del rol a desactivar
 * @throws {CustomError} Si es un rol protegido
 */
const validateRoleNotProtectedToggle = (rolId) => {
  if (PROTECTED_ROLE_IDS.includes(parseInt(rolId))) {
    throw new CustomError(
      403,
      "No se puede desactivar el rol Administrador o Cliente"
    );
  }
  return true;
};

/**
 * Valida los datos para crear un nuevo rol
 * @param {Object} data - Datos del rol
 * @throws {CustomError} Si hay errores de validación
 */
const validateCreateRol = (data) => {
  const { NombreRol, IsActive } = data;

  if (!NombreRol || NombreRol.trim() === "") {
    throw new CustomError(400, "El nombre del rol es requerido");
  }

  if (NombreRol.trim().length < 3) {
    throw new CustomError(400, "El nombre del rol debe tener al menos 3 caracteres");
  }

  if (IsActive === undefined || typeof IsActive !== "number" || ![0, 1].includes(IsActive)) {
    throw new CustomError(400, "El estado del rol (IsActive) es requerido y debe ser 0 o 1.");
  }
  return true;
};

/**
 * Valida los datos para actualizar un rol
 * @param {Object} data - Datos del rol
 * @throws {CustomError} Si hay errores de validación
 */
const validateUpdateRol = (data) => {
  const { NombreRol, IsActive } = data;

  if (NombreRol && NombreRol.trim() === "") {
    throw new CustomError(400, "El nombre del rol no puede estar vacío");
  }

  if (NombreRol && NombreRol.trim().length < 3) {
    throw new CustomError(400, "El nombre del rol debe tener al menos 3 caracteres");
  }

  if (IsActive !== undefined && (typeof IsActive !== "number" || ![0, 1].includes(IsActive))) {
    throw new CustomError(400, "El estado del rol (IsActive) debe ser 0 o 1.");
  }
  return true;
};

/**
 * Valida que el nombre del rol no esté duplicado
 * @param {String} nombre - Nombre del rol
 * @param {Number} excludeId - ID de rol a excluir (para ediciones)
 * @param {Array} rolesExistentes - Lista de roles existentes
 * @throws {CustomError} Si el nombre ya existe
 */
const validateRolNameUnique = (nombreRol, excludeId, rolesExistentes) => {
  const existe = rolesExistentes.some(
    (r) => r.Nombre.toLowerCase() === nombreRol.toLowerCase() && r.IDRol !== excludeId
  );
  if (existe) {
    throw new CustomError(400, "Ya existe un rol con ese nombre");
  }
  return true;
};

module.exports = {
  validateRoleNotProtected,
  validateRoleNotProtectedToggle,
  validateCreateRol,
  validateUpdateRol,
  validateRolNameUnique,
  PROTECTED_ROLE_IDS,
};
