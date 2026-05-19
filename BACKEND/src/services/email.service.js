const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const enviarCorreo = async (payload) => {
  if (!resend) {
    console.warn("RESEND_API_KEY no está configurada; se omite el envío de correo.");
    return { data: null, error: null };
  }

  return await resend.emails.send(payload);
};

const EmailService = {
  enviarRecuperacionContrasena: async ({ usuarioNombre, usuarioEmail, nuevaContrasena }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail?.trim());
    if (!emailValido) {
      console.warn(`Correo inválido para recuperación: "${usuarioEmail}"`);
      return false;
    }
    try {
      const { data, error } = await enviarCorreo({
        from: process.env.EMAIL_FROM,
        to: usuarioEmail,
        subject: `Recuperación de contraseña - Hospedaje Digital`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Hospedaje Digital</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #333;">Recuperación de Contraseña</h2>
              <p style="color: #555;">Hola <strong>${usuarioNombre}</strong>, se ha generado una contraseña temporal para tu cuenta.</p>
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #777; margin: 0 0 8px;">Tu nueva contraseña temporal es:</p>
                <p style="font-size: 28px; font-weight: bold; color: #1a73e8; letter-spacing: 6px; margin: 0;">${nuevaContrasena}</p>
              </div>
              <p style="color: #555;">Te recomendamos cambiarla desde tu perfil una vez que ingreses al sistema.</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">© 2026 Hospedaje Digital. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
      });
      if (error) {
        console.error("Error enviando correo de recuperación:", error);
        return false;
      }
      console.log(`Correo de recuperación enviado a ${usuarioEmail} (ID: ${data.id})`);
      return true;
    } catch (err) {
      console.error("Error inesperado en EmailService.enviarRecuperacionContrasena:", err);
      return false;
    }
  },

  enviarConfirmacionReserva: async ({ clienteNombre, clienteEmail, reservaId, habitacion, fechaInicio, fechaFin, montoTotal, paquetes = [], servicios = [] }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail?.trim());
    if (!emailValido) {
      console.warn(`Correo inválido para cliente, no se enviará notificación: "${clienteEmail}"`);
      return false;
    }

    const paquetesRow = paquetes.length
      ? `<tr><td style="padding:8px 0;color:#777;vertical-align:top">Paquetes:</td>
         <td style="padding:8px 0;color:#333"><ul style="margin:0;padding-left:18px">${paquetes.map(p => `<li>${p}</li>`).join('')}</ul></td></tr>`
      : '';
    const serviciosRow = servicios.length
      ? `<tr><td style="padding:8px 0;color:#777;vertical-align:top">Servicios:</td>
         <td style="padding:8px 0;color:#333"><ul style="margin:0;padding-left:18px">${servicios.map(s => `<li>${s}</li>`).join('')}</ul></td></tr>`
      : '';

    try {
      const { data, error } = await enviarCorreo({
        from: process.env.EMAIL_FROM,
        to: clienteEmail,
        subject: `Confirmación de Reserva #${reservaId} - Hospedaje Digital`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px">
            <div style="background:#1a4332;padding:20px;border-radius:8px 8px 0 0;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:24px">Hospedaje Digital</h1>
            </div>
            <div style="padding:30px">
              <h2 style="color:#333">¡Reserva Confirmada!</h2>
              <p style="color:#555">Hola <strong>${clienteNombre}</strong>, tu reserva ha sido registrada exitosamente.</p>
              <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0">
                <h3 style="color:#1a4332;margin-top:0">Detalles de tu reserva</h3>
                <table style="width:100%;border-collapse:collapse">
                  <tr>
                    <td style="padding:8px 0;color:#777;width:40%">Número de reserva:</td>
                    <td style="padding:8px 0;color:#333;font-weight:bold">#${reservaId}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#777">Habitación/Alojamiento:</td>
                    <td style="padding:8px 0;color:#333">${habitacion}</td>
                  </tr>
                  ${paquetesRow}
                  ${serviciosRow}
                  <tr>
                    <td style="padding:8px 0;color:#777">Fecha de entrada:</td>
                    <td style="padding:8px 0;color:#333">${new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" })}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#777">Fecha de salida:</td>
                    <td style="padding:8px 0;color:#333">${new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" })}</td>
                  </tr>
                  <tr style="border-top:1px solid #ddd">
                    <td style="padding:12px 0 8px;color:#777;font-weight:bold">Total a pagar:</td>
                    <td style="padding:12px 0 8px;color:#1a4332;font-weight:bold;font-size:18px">$${Number(montoTotal).toLocaleString("es-CO")}</td>
                  </tr>
                </table>
              </div>
              <p style="color:#555">Si tienes alguna pregunta sobre tu reserva, no dudes en contactarnos.</p>
              <p style="color:#555;margin-bottom:0">Gracias por elegirnos.</p>
            </div>
            <div style="background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center">
              <p style="color:#999;font-size:12px;margin:0">© 2026 Hospedaje Digital. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
      });

      if (error) { console.error("Error enviando correo de confirmación:", error); return false; }
      console.log(`Correo de confirmación enviado a ${clienteEmail} (ID: ${data.id})`);
      return true;
    } catch (err) {
      console.error("Error inesperado en EmailService:", err);
      return false;
    }
  },

  enviarBienvenida: async ({ usuarioNombre, usuarioEmail }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail?.trim());
    if (!emailValido) {
      console.warn(`Correo inválido para bienvenida: "${usuarioEmail}"`);
      return false;
    }
    try {
      const { data, error } = await enviarCorreo({
        from: process.env.EMAIL_FROM,
        to: usuarioEmail,
        subject: `¡Bienvenido a Hospedaje Digital!`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px">
            <div style="background:#1a4332;padding:20px;border-radius:8px 8px 0 0;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:24px">Hospedaje Digital</h1>
            </div>
            <div style="padding:30px">
              <h2 style="color:#333">¡Bienvenido, ${usuarioNombre}!</h2>
              <p style="color:#555">Tu cuenta ha sido creada exitosamente. Ya puedes acceder a la plataforma y realizar reservas.</p>
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:18px;margin:20px 0">
                <p style="margin:0;color:#166534;font-weight:600">¿Qué puedes hacer ahora?</p>
                <ul style="color:#166534;margin:10px 0 0;padding-left:20px">
                  <li>Explorar paquetes y habitaciones disponibles</li>
                  <li>Realizar reservas en línea</li>
                  <li>Gestionar tus reservas desde tu perfil</li>
                </ul>
              </div>
              <p style="color:#555;margin-bottom:0">Si tienes alguna duda, estamos para ayudarte.</p>
            </div>
            <div style="background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center">
              <p style="color:#999;font-size:12px;margin:0">© 2026 Hospedaje Digital. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
      });

      if (error) { console.error("Error enviando correo de bienvenida:", error); return false; }
      console.log(`Correo de bienvenida enviado a ${usuarioEmail} (ID: ${data.id})`);
      return true;
    } catch (err) {
      console.error("Error inesperado en EmailService.enviarBienvenida:", err);
      return false;
    }
  },
};

module.exports = EmailService;
