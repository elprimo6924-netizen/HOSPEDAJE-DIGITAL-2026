const nodemailer = require("nodemailer");

/* ── Transporter Brevo SMTP ── */
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

const enviarCorreo = async (payload) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[Email] Credenciales SMTP no configuradas; se omite el envío.");
    return { messageId: null };
  }
  const transporter = crearTransporter();
  return await transporter.sendMail(payload);
};

/* ── Paleta visual compartida ── */
const HEADER_BG  = "#1a4332";
const ACCENT     = "#e07020";
const FOOTER_BG  = "#f5f5f5";
const FOOTER_TXT = "© 2026 Hospedaje Digital. Todos los derechos reservados.";

const header = (titulo) => `
  <div style="background:${HEADER_BG};padding:20px;border-radius:8px 8px 0 0;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:24px">Hospedaje Digital</h1>
    <p  style="color:rgba(255,255,255,.7);margin:6px 0 0;font-size:14px">${titulo}</p>
  </div>`;

const footer = () => `
  <div style="background:${FOOTER_BG};padding:15px;border-radius:0 0 8px 8px;text-align:center">
    <p style="color:#999;font-size:12px;margin:0">${FOOTER_TXT}</p>
  </div>`;

const wrap = (contenido) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
              padding:20px;border:1px solid #e0e0e0;border-radius:8px">
    ${contenido}
  </div>`;

/* ══════════════════════════════════════════════════
   EmailService — todas las funciones exportadas
══════════════════════════════════════════════════ */
const EmailService = {

  /* ── Bienvenida ── */
  enviarBienvenida: async ({ usuarioNombre, usuarioEmail }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail?.trim());
    if (!emailValido) {
      console.warn(`[Email] Correo inválido para bienvenida: "${usuarioEmail}"`);
      return false;
    }
    try {
      const info = await enviarCorreo({
        from:    process.env.EMAIL_FROM,
        to:      usuarioEmail,
        subject: "¡Bienvenido a Hospedaje Digital!",
        html: wrap(`
          ${header("Tu cuenta ha sido creada")}
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
          ${footer()}
        `),
      });
      console.log(`[Email] Bienvenida enviada a ${usuarioEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error("[Email] Error en enviarBienvenida:", err.message);
      return false;
    }
  },

  /* ── Recuperación de contraseña (flujo legacy: contraseña temporal) ── */
  enviarRecuperacionContrasena: async ({ usuarioNombre, usuarioEmail, nuevaContrasena }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail?.trim());
    if (!emailValido) {
      console.warn(`[Email] Correo inválido para recuperación: "${usuarioEmail}"`);
      return false;
    }
    try {
      const info = await enviarCorreo({
        from:    process.env.EMAIL_FROM,
        to:      usuarioEmail,
        subject: "Recuperación de contraseña - Hospedaje Digital",
        html: wrap(`
          ${header("Recuperación de contraseña")}
          <div style="padding:30px">
            <h2 style="color:#333">Recuperación de Contraseña</h2>
            <p style="color:#555">Hola <strong>${usuarioNombre}</strong>, se ha generado una contraseña temporal para tu cuenta.</p>
            <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
              <p style="color:#777;margin:0 0 8px">Tu nueva contraseña temporal es:</p>
              <p style="font-size:28px;font-weight:bold;color:${ACCENT};letter-spacing:6px;margin:0">${nuevaContrasena}</p>
            </div>
            <p style="color:#555">Te recomendamos cambiarla desde tu perfil una vez que ingreses al sistema.</p>
          </div>
          ${footer()}
        `),
      });
      console.log(`[Email] Recuperación enviada a ${usuarioEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error("[Email] Error en enviarRecuperacionContrasena:", err.message);
      return false;
    }
  },

  /* ── Recuperación de contraseña (flujo nuevo: enlace/token) ── */
  enviarRecuperacionPassword: async (email, token) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim());
    if (!emailValido) {
      console.warn(`[Email] Correo inválido para reset token: "${email}"`);
      return false;
    }
    try {
      const info = await enviarCorreo({
        from:    process.env.EMAIL_FROM,
        to:      email,
        subject: "🔐 Código de recuperación - Hospedaje Digital",
        html: wrap(`
          ${header("Recuperar contraseña")}
          <div style="padding:30px">
            <p style="color:#555">Recibimos una solicitud para recuperar la contraseña de tu cuenta.</p>
            <p style="color:#555">Usa el siguiente código para continuar:</p>
            <div style="background:#fff7ed;border:2px solid ${ACCENT};padding:20px;border-radius:8px;text-align:center;margin:20px 0">
              <p style="font-size:36px;font-weight:bold;color:${ACCENT};letter-spacing:6px;margin:0;font-family:monospace">${token}</p>
            </div>
            <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:4px">
              <strong>⏰ Importante:</strong> Este código expira en 30 minutos. Si no solicitaste este cambio, ignora este email.
            </div>
          </div>
          ${footer()}
        `),
      });
      console.log(`[Email] Token de recuperación enviado a ${email} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error("[Email] Error en enviarRecuperacionPassword:", err.message);
      return false;
    }
  },

  /* ── Confirmación de reserva ── */
  enviarConfirmacionReserva: async ({
    clienteNombre,
    clienteEmail,
    reservaId,
    habitacion,
    fechaInicio,
    fechaFin,
    montoTotal,
    paquetes  = [],
    servicios = [],
  }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail?.trim());
    if (!emailValido) {
      console.warn(`[Email] Correo inválido para confirmación de reserva: "${clienteEmail}"`);
      return false;
    }

    const paquetesRow = paquetes.length
      ? `<tr><td style="padding:8px 0;color:#777;vertical-align:top">Paquetes:</td>
         <td style="padding:8px 0;color:#333"><ul style="margin:0;padding-left:18px">${paquetes.map((p) => `<li>${p}</li>`).join("")}</ul></td></tr>`
      : "";
    const serviciosRow = servicios.length
      ? `<tr><td style="padding:8px 0;color:#777;vertical-align:top">Servicios:</td>
         <td style="padding:8px 0;color:#333"><ul style="margin:0;padding-left:18px">${servicios.map((s) => `<li>${s}</li>`).join("")}</ul></td></tr>`
      : "";

    try {
      const info = await enviarCorreo({
        from:    process.env.EMAIL_FROM,
        to:      clienteEmail,
        subject: `Confirmación de Reserva #${reservaId} - Hospedaje Digital`,
        html: wrap(`
          ${header("¡Reserva confirmada!")}
          <div style="padding:30px">
            <h2 style="color:#333">¡Reserva Confirmada!</h2>
            <p style="color:#555">Hola <strong>${clienteNombre}</strong>, tu reserva ha sido registrada exitosamente.</p>
            <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0">
              <h3 style="color:${HEADER_BG};margin-top:0">Detalles de tu reserva</h3>
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
                  <td style="padding:12px 0 8px;color:${HEADER_BG};font-weight:bold;font-size:18px">$${Number(montoTotal).toLocaleString("es-CO")}</td>
                </tr>
              </table>
            </div>
            <p style="color:#555">Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p style="color:#555;margin-bottom:0">Gracias por elegirnos.</p>
          </div>
          ${footer()}
        `),
      });
      console.log(`[Email] Confirmación de reserva enviada a ${clienteEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error("[Email] Error en enviarConfirmacionReserva:", err.message);
      return false;
    }
  },

  /* ── Cancelación de reserva ── */
  enviarCancelacionReserva: async ({
    clienteNombre,
    clienteEmail,
    reservaId,
    habitacion,
    fechaInicio,
    fechaFin,
    montoTotal,
    motivoCancelacion = "",
  }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail?.trim());
    if (!emailValido) {
      console.warn(`[Email] Correo inválido para cancelación de reserva: "${clienteEmail}"`);
      return false;
    }
    try {
      const info = await enviarCorreo({
        from:    process.env.EMAIL_FROM,
        to:      clienteEmail,
        subject: `Cancelación de Reserva #${reservaId} - Hospedaje Digital`,
        html: wrap(`
          ${header("Cancelación de reserva")}
          <div style="padding:30px">
            <h2 style="color:#333">Reserva Cancelada</h2>
            <p style="color:#555">Hola <strong>${clienteNombre}</strong>, te informamos que la reserva <strong>#${reservaId}</strong> ha sido cancelada.</p>
            <div style="background:#fff1f1;border:1px solid #fca5a5;border-radius:8px;padding:20px;margin:20px 0">
              <h3 style="color:#dc2626;margin-top:0">Datos de la reserva cancelada</h3>
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="padding:8px 0;color:#777;width:40%">Número de reserva:</td>
                  <td style="padding:8px 0;color:#333;font-weight:bold">#${reservaId}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#777">Habitación:</td>
                  <td style="padding:8px 0;color:#333">${habitacion}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#777">Fecha de entrada:</td>
                  <td style="padding:8px 0;color:#333">${new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" })}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#777">Fecha de salida:</td>
                  <td style="padding:8px 0;color:#333">${new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" })}</td>
                </tr>
                <tr style="border-top:1px solid #fca5a5">
                  <td style="padding:8px 0;color:#777;font-weight:bold">Monto:</td>
                  <td style="padding:8px 0;color:#dc2626;font-weight:bold">$${Number(montoTotal).toLocaleString("es-CO")}</td>
                </tr>
                ${motivoCancelacion ? `<tr><td style="padding:8px 0;color:#777">Motivo:</td><td style="padding:8px 0;color:#555">${motivoCancelacion}</td></tr>` : ""}
              </table>
            </div>
            <p style="color:#555">Si crees que esto es un error o necesitas ayuda, contáctanos.</p>
          </div>
          ${footer()}
        `),
      });
      console.log(`[Email] Cancelación enviada a ${clienteEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error("[Email] Error en enviarCancelacionReserva:", err.message);
      return false;
    }
  },

  /* ── Notificación al admin: nueva reserva ── */
  notificarAdminNuevaReserva: async ({
    clienteNombre,
    clienteEmail,
    reservaId,
    habitacion,
    fechaInicio,
    fechaFin,
    montoTotal,
    paquetes  = [],
    servicios = [],
  }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("[Email] ADMIN_EMAIL no configurado; se omite notificación al admin.");
      return false;
    }
    try {
      const paqList  = paquetes.length  ? `<li><strong>Paquetes:</strong>  ${paquetes.join(", ")}</li>`  : "";
      const svcList  = servicios.length ? `<li><strong>Servicios:</strong> ${servicios.join(", ")}</li>` : "";
      const info = await enviarCorreo({
        from:    process.env.EMAIL_FROM,
        to:      adminEmail,
        subject: `🛎️ Nueva reserva #${reservaId} — ${clienteNombre}`,
        html: wrap(`
          ${header("Nueva reserva recibida")}
          <div style="padding:30px">
            <h2 style="color:#333">Nueva Reserva #${reservaId}</h2>
            <p style="color:#555">Se ha registrado una nueva reserva en el sistema.</p>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0">
              <ul style="color:#374151;margin:0;padding-left:20px;line-height:2">
                <li><strong>Cliente:</strong>    ${clienteNombre} (${clienteEmail})</li>
                <li><strong>Habitación:</strong> ${habitacion}</li>
                ${paqList}
                ${svcList}
                <li><strong>Entrada:</strong>   ${new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" })}</li>
                <li><strong>Salida:</strong>    ${new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" })}</li>
                <li><strong>Total:</strong>     <span style="color:${HEADER_BG};font-weight:bold">$${Number(montoTotal).toLocaleString("es-CO")}</span></li>
              </ul>
            </div>
            <p style="color:#555;margin-bottom:0">Accede al panel de administración para gestionar esta reserva.</p>
          </div>
          ${footer()}
        `),
      });
      console.log(`[Email] Notificación admin enviada a ${adminEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error("[Email] Error en notificarAdminNuevaReserva:", err.message);
      return false;
    }
  },

  /* ── Servicios adicionales agregados — cliente ── */
  enviarServiciosAgregados: async ({
    clienteNombre,
    clienteEmail,
    reservaId,
    serviciosAgregados = [],
    costoAdicional,
    metodoPago,
    linkSubir,
  }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail?.trim());
    if (!emailValido) {
      console.warn(`[Email] Correo inválido para servicios agregados: "${clienteEmail}"`);
      return false;
    }
    const esTransferencia = Number(metodoPago) === 2;
    const svcList = serviciosAgregados.length
      ? `<ul style="color:#374151;margin:10px 0;padding-left:20px;line-height:1.9">
           ${serviciosAgregados.map(s => `<li>${s}</li>`).join('')}
         </ul>`
      : '';
    const bloqueComprobante = esTransferencia ? `
      <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:8px;
                  padding:18px;margin:20px 0;text-align:center">
        <p style="margin:0 0 8px;color:#78350f;font-weight:700;font-size:15px">
          📎 Acción requerida: sube tu comprobante de pago
        </p>
        <p style="margin:0 0 16px;color:#92400e;font-size:13px">
          Para confirmar la adición de servicios debes adjuntar el desprendible de la transferencia.
          Un administrador lo revisará y confirmará los cambios.
        </p>
        <a href="${linkSubir}"
           style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;
                  padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px">
          Subir comprobante de pago
        </a>
        <p style="color:#94a3b8;font-size:11px;margin-top:12px">
          Si el botón no funciona: <span style="color:${ACCENT}">${linkSubir}</span>
        </p>
      </div>` : `
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px;margin:16px 0">
        <p style="margin:0;color:#166534;font-size:13px">
          ✅ Los servicios han sido registrados. Puedes pagarlos en efectivo al momento del check-in.
        </p>
      </div>`;
    try {
      const info = await enviarCorreo({
        from:    process.env.EMAIL_FROM,
        to:      clienteEmail,
        subject: `Servicios adicionales — Reserva #${reservaId} | Hospedaje Digital`,
        html: wrap(`
          ${header("Servicios adicionales añadidos")}
          <div style="padding:30px">
            <h2 style="color:#333">Hola, ${clienteNombre || 'cliente'}</h2>
            <p style="color:#555">Se han registrado los siguientes servicios adicionales en tu reserva <strong>#${reservaId}</strong>:</p>
            <div style="background:#f5f5f5;border-radius:8px;padding:18px;margin:16px 0">
              <strong style="color:${HEADER_BG}">Servicios añadidos:</strong>
              ${svcList}
              ${costoAdicional ? `<p style="margin:8px 0 0;color:#555">
                <strong>Costo adicional:</strong>
                <span style="color:${HEADER_BG};font-weight:bold;font-size:16px">
                  $${Number(costoAdicional).toLocaleString('es-CO')}
                </span></p>` : ''}
              <p style="margin:6px 0 0;color:#555">
                <strong>Método de pago:</strong> ${esTransferencia ? '🏦 Transferencia bancaria' : '💵 Efectivo'}
              </p>
            </div>
            ${bloqueComprobante}
          </div>
          ${footer()}
        `),
      });
      console.log(`[Email] Servicios agregados enviado a ${clienteEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error("[Email] Error en enviarServiciosAgregados:", err.message);
      return false;
    }
  },

  /* ── Notificación admin: servicios adicionales pendientes de verificación ── */
  notificarAdminServiciosAgregados: async ({
    clienteNombre,
    clienteEmail,
    reservaId,
    serviciosAgregados = [],
    costoAdicional,
  }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("[Email] ADMIN_EMAIL no configurado; se omite notificación admin servicios.");
      return false;
    }
    const svcList = serviciosAgregados.map(s => `<li>${s}</li>`).join('');
    try {
      const info = await enviarCorreo({
        from:    process.env.EMAIL_FROM,
        to:      adminEmail,
        subject: `⚠️ Servicios adicionales pendientes de verificación — Reserva #${reservaId}`,
        html: wrap(`
          ${header("Verificación de pago requerida")}
          <div style="padding:30px">
            <h2 style="color:#333">Servicios adicionales — Reserva #${reservaId}</h2>
            <p style="color:#555">El cliente <strong>${clienteNombre}</strong> ha agregado servicios adicionales
               y realizó el pago por <strong>transferencia bancaria</strong>. Se requiere verificación del comprobante.</p>
            <div style="background:#fff7ed;border:2px solid ${ACCENT};border-radius:8px;padding:20px;margin:20px 0">
              <ul style="color:#374151;margin:0;padding-left:20px;line-height:2">
                <li><strong>Cliente:</strong> ${clienteNombre} (${clienteEmail})</li>
                <li><strong>Reserva:</strong> #${reservaId}</li>
                <li><strong>Servicios agregados:</strong>
                  <ul style="margin:4px 0;padding-left:16px">${svcList}</ul>
                </li>
                ${costoAdicional ? `<li><strong>Costo adicional:</strong>
                  <span style="color:${HEADER_BG};font-weight:bold">
                    $${Number(costoAdicional).toLocaleString('es-CO')}
                  </span></li>` : ''}
                <li><strong>Método de pago:</strong> 🏦 Transferencia bancaria</li>
              </ul>
            </div>
            <p style="color:#555;margin-bottom:0">
              Accede al panel de administración para revisar el comprobante y confirmar la reserva.
            </p>
          </div>
          ${footer()}
        `),
      });
      console.log(`[Email] Notif admin servicios enviada a ${adminEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error("[Email] Error en notificarAdminServiciosAgregados:", err.message);
      return false;
    }
  },

  /* ── Pendiente comprobante — pago con tarjeta (30 minutos) ── */
  enviarPendienteComprobante: async ({ clienteNombre, clienteEmail, reservaId, linkSubir, fechaInicio, fechaFin, montoTotal }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail?.trim());
    if (!emailValido) {
      console.warn(`[Email] Correo inválido para pendiente comprobante: "${clienteEmail}"`);
      return false;
    }
    try {
      const info = await enviarCorreo({
        from:    process.env.EMAIL_FROM,
        to:      clienteEmail,
        subject: `⏳ Reserva #${reservaId} pendiente — sube tu comprobante en 5 minutos`,
        html: wrap(`
          ${header("Confirmación de reserva pendiente")}
          <div style="padding:30px">
            <h2 style="color:#333">Hola, ${clienteNombre || 'cliente'}</h2>
            <p style="color:#555;line-height:1.6">
              Tu reserva <strong>#${reservaId}</strong> ha sido registrada exitosamente.<br>
              Para confirmarla, debes subir el <strong>comprobante de pago</strong> dentro de los próximos <strong style="color:#b45309">5 minutos</strong>.
            </p>
            <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:8px;padding:18px;margin:20px 0;text-align:center">
              <p style="margin:0 0 6px;color:#78350f;font-weight:700;font-size:15px">⏰ Tiempo límite: 5 minutos</p>
              <p style="margin:0;color:#92400e;font-size:13px">Si no subes el comprobante antes de que venza el plazo (5 minutos), la reserva será cancelada automáticamente y la habitación quedará disponible nuevamente.</p>
            </div>
            <ul style="color:#555;padding-left:20px;line-height:2">
              <li><strong>Reserva:</strong>    #${reservaId}</li>
              ${fechaInicio  ? `<li><strong>Entrada:</strong>    ${fechaInicio}</li>`  : ''}
              ${fechaFin     ? `<li><strong>Salida:</strong>     ${fechaFin}</li>`     : ''}
              ${montoTotal   ? `<li><strong>Total:</strong>      $${Number(montoTotal).toLocaleString('es-CO')}</li>` : ''}
            </ul>
            <div style="text-align:center;margin:28px 0 10px">
              <a href="${linkSubir}"
                 style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;
                        padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;
                        box-shadow:0 4px 14px rgba(224,112,32,.4)">
                📎 Subir comprobante de pago
              </a>
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:18px">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <span style="color:${ACCENT}">${linkSubir}</span>
            </p>
          </div>
          ${footer()}
        `),
      });
      console.log(`[Email] Pendiente comprobante enviado a ${clienteEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error("[Email] Error en enviarPendienteComprobante:", err.message);
      return false;
    }
  },
};

module.exports = EmailService;
