/**
 * Clase personalizada para manejar errores en la aplicación
 */
class CustomError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'CustomError';
  }
}

module.exports = CustomError;
