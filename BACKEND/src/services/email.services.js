/**
 * Servicio de email con Nodemailer/Brevo para recuperación de contraseña (código de 6 dígitos)
 */

const nodemailer = require("nodemailer");
require("dotenv").config({ override: true });

const crearTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || "smtp-relay.brevo.com",
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false }, // Brevo cert usa dominio sendinblue legacy
  });

/**
 * Envía email con código de recuperación de contraseña
 * @param {string} email - Email del usuario
 * @param {string} code  - Código de 6 dígitos
 */
const sendPasswordResetEmail = async (email, code) => {
  try {
    const transporter  = crearTransporter();
    const sendToEmail  = process.env.TEST_EMAIL || email;
    const fromEmail    = process.env.EMAIL_FROM || "Hospedaje Digital <elprimo6924@gmail.com>";

    const info = await transporter.sendMail({
      from:    fromEmail,
      to:      sendToEmail,
      subject: "🔐 Código para Recuperar tu Contraseña - Hospedaje Digital",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body          { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container    { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
              .card         { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.1); }
              .header       { text-align: center; border-bottom: 3px solid #e07020; padding-bottom: 20px; margin-bottom: 20px; }
              .header h1    { color: #1a4332; margin: 0; font-size: 28px; }
              .code-box     { background: #fff7ed; border: 2px solid #e07020; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .code         { font-size: 36px; font-weight: bold; color: #e07020; letter-spacing: 5px; font-family: monospace; }
              .warning      { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px; }
              .footer       { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <h1>🔐 Recuperar Contraseña</h1>
                  <p style="color:#666;margin:6px 0 0">Hospedaje Digital</p>
                </div>

                <p>Hola,</p>
                <p>Recibimos una solicitud para recuperar la contraseña de tu cuenta en <strong>Hospedaje Digital</strong>.</p>
                <p>Usa el siguiente código para cambiar tu contraseña:</p>

                <div class="code-box">
                  <div class="code">${code}</div>
                </div>

                <div class="warning">
                  <strong>⏰ Importante:</strong> Este código expira en 30 minutos.
                  Si no solicitaste este cambio, ignora este email.
                </div>

                <p><strong>Pasos:</strong></p>
                <ol>
                  <li>Ingresa este código en la página "Recuperar Contraseña"</li>
                  <li>Escribe tu nueva contraseña</li>
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
      `,
    });

    if (info.messageId) {
      console.log("[Email] Código de recuperación enviado:", info.messageId);
    }
    return { messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Error enviando código de recuperación:", error.message);
    throw error;
  }
};

module.exports = { sendPasswordResetEmail };
