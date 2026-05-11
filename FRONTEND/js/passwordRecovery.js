/**
 * Lógica para la página de recuperación de contraseña
 */

let currentStep = 1;
let recoveryEmail = '';
let recoveryToken = '';

// Elementos del DOM
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const stepDescription = document.getElementById('stepDescription');

const step1Form = document.getElementById('step1Form');
const step2Form = document.getElementById('step2Form');
const step3Form = document.getElementById('step3Form');

const step1Message = document.getElementById('step1Message');
const step2Message = document.getElementById('step2Message');
const step3Message = document.getElementById('step3Message');

const step1Btn = document.getElementById('step1Btn');
const step2Btn = document.getElementById('step2Btn');
const step3Btn = document.getElementById('step3Btn');

const step2Back = document.getElementById('step2Back');
const step3Back = document.getElementById('step3Back');

const emailInput = document.getElementById('email1');
const codeInput = document.getElementById('code');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

/**
 * Mostrar mensaje en la sección actual
 */
function showMessage(messageEl, text, type = 'success') {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
}

/**
 * Cambiar al siguiente paso
 */
function goToStep(step) {
    currentStep = step;
    
    // Ocultar todos los pasos
    step1.classList.remove('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    
    // Mostrar el paso actual
    if (step === 1) step1.classList.add('active');
    if (step === 2) step2.classList.add('active');
    if (step === 3) step3.classList.add('active');
    
    // Actualizar descripción
    if (step === 1) stepDescription.textContent = 'Ingresa tu correo para comenzar';
    if (step === 2) stepDescription.textContent = 'Ingresa el código de 6 dígitos';
    if (step === 3) stepDescription.textContent = 'Crea tu nueva contraseña';
    
    // Limpiar mensajes
    step1Message.textContent = '';
    step2Message.textContent = '';
    step3Message.textContent = '';
    step1Message.className = 'message';
    step2Message.className = 'message';
    step3Message.className = 'message';
}

/**
 * PASO 1: Solicitar código
 */
step1Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showMessage(step1Message, '❌ Por favor ingresa tu correo electrónico', 'error');
        return;
    }
    
    try {
        step1Btn.disabled = true;
        step1Btn.textContent = '⏳ Enviando...';
        
        // Llamar al API usando window.apiRequest
        if (typeof window.apiRequest !== 'function') {
            throw new Error('API no disponible. Por favor recarga la página.');
        }
        
        const response = await window.apiRequest('/password-reset/forgot-password', {
            method: 'POST',
            body: { email }
        });
        
        recoveryEmail = email;
        showMessage(step1Message, '✓ Código enviado a tu correo. Revisa tu bandeja de entrada.', 'success');
        setTimeout(() => {
            goToStep(2);
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        showMessage(step1Message, `❌ ${error.message || 'Error al enviar el código'}`, 'error');
        step1Btn.disabled = false;
        step1Btn.textContent = 'Enviar Código';
    }
});

/**
 * PASO 2: Verificar código
 */
step2Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const code = codeInput.value.trim();
    
    if (!code || code.length !== 6) {
        showMessage(step2Message, '❌ Por favor ingresa un código de 6 dígitos', 'error');
        return;
    }
    
    if (!/^\d{6}$/.test(code)) {
        showMessage(step2Message, '❌ El código debe contener solo números', 'error');
        return;
    }
    
    try {
        step2Btn.disabled = true;
        step2Btn.textContent = '⏳ Verificando...';
        
        // Llamar al API
        if (typeof window.apiRequest !== 'function') {
            throw new Error('API no disponible. Por favor recarga la página.');
        }
        
        const response = await window.apiRequest('/password-reset/verify-code', {
            method: 'POST',
            body: {
                email: recoveryEmail,
                code: code
            }
        });
        
        // El servidor devuelve el token en la respuesta
        recoveryToken = response.token;
        
        if (!recoveryToken) {
            throw new Error('No se recibió token del servidor');
        }
        
        showMessage(step2Message, '✓ Código verificado. Procede a cambiar tu contraseña.', 'success');
        setTimeout(() => {
            goToStep(3);
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        showMessage(step2Message, `❌ ${error.message || 'Código inválido o expirado'}`, 'error');
        step2Btn.disabled = false;
        step2Btn.textContent = 'Verificar';
    }
});

/**
 * PASO 3: Cambiar contraseña
 */
step3Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validaciones
    if (!newPassword || newPassword.length < 6) {
        showMessage(step3Message, '❌ La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage(step3Message, '❌ Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        step3Btn.disabled = true;
        step3Btn.textContent = '⏳ Cambiando...';
        
        // Llamar al API con el token
        if (typeof window.apiRequest !== 'function') {
            throw new Error('API no disponible. Por favor recarga la página.');
        }
        
        const response = await window.apiRequest('/password-reset/reset-password', {
            method: 'POST',
            body: {
                token: recoveryToken,
                newPassword: newPassword
            }
        });
        
        showMessage(step3Message, '✓ ¡Contraseña cambiada exitosamente!', 'success');
        
        setTimeout(() => {
            // Redirigir al login después de 2 segundos
            window.location.href = '../login.html';
        }, 2000);
    } catch (error) {
        console.error('Error:', error);
        showMessage(step3Message, `❌ ${error.message || 'Error al cambiar la contraseña'}`, 'error');
        step3Btn.disabled = false;
        step3Btn.textContent = 'Cambiar Contraseña';
    }
});

/**
 * Botones para volver atrás
 */
step2Back.addEventListener('click', () => {
    codeInput.value = '';
    goToStep(1);
});

step3Back.addEventListener('click', () => {
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
    goToStep(2);
});

/**
 * Permitir solo números en el input de código
 */
codeInput.addEventListener('keydown', (e) => {
    // Permitir teclas de control y números
    if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
    }
});

/**
 * Convertir a mayúsculas para el código
 */
codeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^\d]/g, '');
});
