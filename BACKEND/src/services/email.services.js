/**
 * Servicio de email con Resend para recuperación de contraseña
 */

const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía email con código de recuperación de contraseña
 * @param {string} email - Email del usuario
 * @param {string} code - Código de 6 dígitos
 * @returns {Promise}
 */
const sendPasswordResetEmail = async (email, code) => {
    try {
        // Email remitente: usa tu dominio verificado si tienes uno, o onboarding@resend.dev para pruebas
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        
        // Email destino: usa RESEND_TEST_EMAIL solo si quieres forzar un email de prueba
        // Si no está configurado, envía al email real del usuario
        const sendToEmail = process.env.RESEND_TEST_EMAIL || email;

        const response = await resend.emails.send({
            from: fromEmail,
            to: [sendToEmail],
            subject: '🔐 Código para Recuperar tu Contraseña - Hospedaje Digital',
            html: `
                <!DOCTYPE html>
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
                            .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px; }
                            .header h1 { color: #3b82f6; margin: 0; font-size: 28px; }
                            .code-box { background: #f0f4ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                            .code { font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 5px; font-family: monospace; }
                            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px; }
                            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="card">
                                <div class="header">
                                    <h1>🔐 Recuperar Contraseña</h1>
                                </div>
                                
                                <p>Hola,</p>
                                <p>Recibimos una solicitud para recuperar la contraseña de tu cuenta en <strong>Hospedaje Digital</strong>.</p>
                                
                                <p>Usa el siguiente código para cambiar tu contraseña:</p>
                                
                                <div class="code-box">
                                    <div class="code">${code}</div>
                                </div>
                                
                                <div class="warning">
                                    <strong>⏰ Importante:</strong> Este código expira en 30 minutos. Si no solicitaste este cambio, ignora este email.
                                </div>
                                
                                <p><strong>Pasos:</strong></p>
                                <ol>
                                    <li>Ingresa este código en nuestra app en la página de "Recuperar Contraseña"</li>
                                    <li>Ingresa tu nueva contraseña</li>
                                    <li>¡Listo! Podrás iniciar sesión con tu nueva contraseña</li>
                                </ol>
                                
                                <div class="footer">
                                    <p>Este es un email automático. No respondas a este mensaje.</p>
                                    <p>© 2026 Hospedaje Digital. Todos los derechos reservados.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
            `
        });

        console.log('✅ Email enviado:', response.id);
        return response;
    } catch (error) {
        console.error('❌ Error enviando email:', error.message);
        throw error;
    }
};

module.exports = { sendPasswordResetEmail };
