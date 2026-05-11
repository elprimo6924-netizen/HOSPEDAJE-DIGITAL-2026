const CustomError = require("../errors/customError");

/**
 * Valida los datos para crear un nuevo usuario
 * @param {Object} data - Datos del usuario
 * @throws {CustomError} Si hay errores de validación
 */
const validateCreateUsuario = (data) => {
  const { Contrasena, Nombre, Apellido, Email } = data;

  // Campos requeridos
  if (!Contrasena || Contrasena.trim() === "") {
    throw new CustomError(400, "La contraseña es requerida");
  }
  if (!Nombre || Nombre.trim() === "") {
    throw new CustomError(400, "El nombre es requerido");
  }
  if (!Apellido || Apellido.trim() === "") {
    throw new CustomError(400, "El apellido es requerido");
  }
  if (!Email || Email.trim() === "") {
    throw new CustomError(400, "El email es requerido");
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(Email)) {
    throw new CustomError(400, "El formato del email no es válido");
  }

  // Validar longitud mínima de contraseña
  if (Contrasena.length < 4) {
    throw new CustomError(400, "La contraseña debe tener al menos 4 caracteres");
  }

  return true;
};

/**
 * Valida los datos para actualizar un usuario
 * @param {Object} data - Datos del usuario
 * @throws {CustomError} Si hay errores de validación
 */
const validateUpdateUsuario = (data) => {
  const { Nombre, Apellido, Email, IDRol } = data;

  // Si se proporcionan, validar
  if (Nombre && Nombre.trim() === "") {
    throw new CustomError(400, "El nombre no puede estar vacío");
  }
  if (Apellido && Apellido.trim() === "") {
    throw new CustomError(400, "El apellido no puede estar vacío");
  }
  if (Email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      throw new CustomError(400, "El formato del email no es válido");
    }
  }

  return true;
};

/**
 * Valida que el email no esté duplicado (se debe ejecutar contra la BD)
 * @param {String} email - Email a validar
 * @param {Number} excludeId - ID de usuario a excluir (para ediciones)
 * @param {Array} usuariosExistentes - Lista de usuarios existentes
 * @throws {CustomError} Si el email ya existe
 */
const validateEmailUnique = (email, excludeId, usuariosExistentes) => {
  const existe = usuariosExistentes.some(
    (u) => u.Email === email && u.IDUsuario !== excludeId
  );
  if (existe) {
    throw new CustomError(400, "El email ya está registrado");
  }
  return true;
};

module.exports = {
  validateCreateUsuario,
  validateUpdateUsuario,
  validateEmailUnique,
};
