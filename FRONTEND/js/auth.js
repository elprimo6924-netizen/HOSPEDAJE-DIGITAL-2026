/**
 * Módulo de Autenticación
 * Maneja login, registro y recuperación de contraseña
 */

// Login
async function loginUsuario(email, contrasena) {
    try {
        const apiUrl = window.API_URL || (typeof CONFIG !== 'undefined' && CONFIG.API_URL) || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Email: email,
                Contrasena: contrasena,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.usuario));
            return { success: true, data };
        } else {
            return { success: false, message: data.message || data.error || "Error al iniciar sesión" };
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        return { success: false, message: "No se pudo conectar con el servidor" };
    }
}

// Registro
async function registrarUsuario(userData) {
    try {
        const apiUrl = window.API_URL || (typeof CONFIG !== 'undefined' && CONFIG.API_URL) || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, message: data.error || data.message || "Error al registrar usuario" };
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        return { success: false, message: "Error de conexión con el servidor" };
    }
}
