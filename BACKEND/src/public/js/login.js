/* LOGIN - Hospedaje Digital */

const BASE_API_URL = "http://localhost:3306/api";
const LOGIN_REDIRECT_PATH = "index.html";
const TRANSITION_DURATION_MS = 700;
const LIGHTNING_INTERVAL_MS = 5000;
const LIGHTNING_CHANCE = 0.7;
const SNOWFLAKE_COUNT = 80;

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorElement = document.getElementById("error");
    const loginButton = document.querySelector("button[onclick='login()']"); // Assuming your login button has this onclick

    if (!email || !password) {
        errorElement.innerText = "Debe ingresar email y contraseña";
        return;
    }

    loginButton.disabled = true; // Disable button to prevent multiple submissions

    // URL CORREGIDA: Se añade '/auth' porque en app.js usas app.use("/api/auth", authRoutes)
    fetch(`${BASE_API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            Email: email,        // Asegúrate que tu backend espere 'Email' con E mayúscula
            Contrasena: password // Asegúrate que tu backend espere 'Contrasena' con C mayúscula
        })
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            // Si el servidor responde con error (400, 401, 404, etc.)
            throw new Error(data.error || "Error en el inicio de sesión");
        }
        return data;
    })
    .then(data => {
        loginButton.disabled = false; // Re-enable button on success
        if (data.token) {
            // Guardamos el token para sesiones futuras
            localStorage.setItem("token", data.token);

            /* Animación de transición */
            document.body.style.transition = `opacity ${TRANSITION_DURATION_MS / 1000}s`;
            document.body.style.opacity = "0";

            setTimeout(() => {
                window.location.href = LOGIN_REDIRECT_PATH;
            }, TRANSITION_DURATION_MS);
        } else {
            errorElement.innerText = "Credenciales incorrectas";
        }
    })
    .catch((err) => {
        loginButton.disabled = false; // Re-enable button on error
        console.error("Error detectado:", err);
        errorElement.innerText = err.message === "Failed to fetch" 
            ? "Error: No se pudo conectar con el servidor (¿está encendido?)" 
            : err.message;
    });
}

/* ==========================================
   EFECTOS VISUALES (Nieve y Relámpagos)
   ========================================== */

/* ❄ NIEVE */
const snowContainer = document.getElementById("snow");
if (snowContainer) {
    for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
        const snow = document.createElement("span");
        snow.innerHTML = "❄";
        snow.style.left = Math.random() * 100 + "%";
        snow.style.animationDuration = (Math.random() * 5 + 5) * 1 + "s";
        snow.style.opacity = Math.random();
        snow.style.fontSize = (Math.random() * 10 + 10) + "px";
        snowContainer.appendChild(snow);
    }
}

/* ⚡ RELÁMPAGOS */
function lightning() {
    const flash = document.getElementById("flash");
    if (flash) {
        flash.style.opacity = 0.8;
        setTimeout(() => {
            flash.style.opacity = 0;
        }, 100);
    }
}

setInterval(() => {
    if (Math.random() > LIGHTNING_CHANCE) {
        lightning();
    }
}, LIGHTNING_INTERVAL_MS);
