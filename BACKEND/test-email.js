/**
 * test-email.js — Prueba los envíos de email con Nodemailer + Brevo SMTP
 *
 * Uso:
 *   cd BACKEND
 *   node test-email.js
 */

require("dotenv").config();
const EmailService           = require("./src/services/email.service");
const { sendPasswordResetEmail } = require("./src/services/email.services");

const DESTINATARIO = process.env.ADMIN_EMAIL || "elprimo6924@gmail.com";

const sep = (titulo) => console.log(`\n${"─".repeat(50)}\n▶  ${titulo}\n${"─".repeat(50)}`);

(async () => {
  console.log("🧪  Test de emails — Hospedaje Digital");
  console.log(`📧  Destinatario: ${DESTINATARIO}`);
  console.log(`🌐  SMTP host:    ${process.env.EMAIL_HOST}`);
  console.log(`👤  SMTP user:    ${process.env.EMAIL_USER}\n`);

  /* 1. Bienvenida */
  sep("1 — enviarBienvenida");
  const r1 = await EmailService.enviarBienvenida({
    usuarioNombre: "Roberto Test",
    usuarioEmail:  DESTINATARIO,
  });
  console.log("Resultado:", r1 ? "✅ OK" : "❌ FALLÓ");

  /* 2. Recuperación de contraseña (legacy) */
  sep("2 — enviarRecuperacionContrasena");
  const r2 = await EmailService.enviarRecuperacionContrasena({
    usuarioNombre:  "Roberto Test",
    usuarioEmail:   DESTINATARIO,
    nuevaContrasena: "Temp@2026!",
  });
  console.log("Resultado:", r2 ? "✅ OK" : "❌ FALLÓ");

  /* 3. Recuperación de contraseña (token) */
  sep("3 — enviarRecuperacionPassword");
  const r3 = await EmailService.enviarRecuperacionPassword(DESTINATARIO, "847261");
  console.log("Resultado:", r3 ? "✅ OK" : "❌ FALLÓ");

  /* 4. Confirmación de reserva */
  sep("4 — enviarConfirmacionReserva");
  const r4 = await EmailService.enviarConfirmacionReserva({
    clienteNombre: "Roberto Test",
    clienteEmail:  DESTINATARIO,
    reservaId:     "TEST-001",
    habitacion:    "Suite Premium 201",
    fechaInicio:   "2026-06-10",
    fechaFin:      "2026-06-15",
    montoTotal:    850000,
    paquetes:      ["Escapada Romántica"],
    servicios:     ["Spa y Masajes", "Desayuno incluido"],
  });
  console.log("Resultado:", r4 ? "✅ OK" : "❌ FALLÓ");

  /* 5. Cancelación de reserva */
  sep("5 — enviarCancelacionReserva");
  const r5 = await EmailService.enviarCancelacionReserva({
    clienteNombre:     "Roberto Test",
    clienteEmail:      DESTINATARIO,
    reservaId:         "TEST-001",
    habitacion:        "Suite Premium 201",
    fechaInicio:       "2026-06-10",
    fechaFin:          "2026-06-15",
    montoTotal:        850000,
    motivoCancelacion: "Solicitud del cliente",
  });
  console.log("Resultado:", r5 ? "✅ OK" : "❌ FALLÓ");

  /* 6. Notificación admin */
  sep("6 — notificarAdminNuevaReserva");
  const r6 = await EmailService.notificarAdminNuevaReserva({
    clienteNombre: "Roberto Test",
    clienteEmail:  DESTINATARIO,
    reservaId:     "TEST-001",
    habitacion:    "Suite Premium 201",
    fechaInicio:   "2026-06-10",
    fechaFin:      "2026-06-15",
    montoTotal:    850000,
    paquetes:      ["Escapada Romántica"],
    servicios:     ["Spa y Masajes"],
  });
  console.log("Resultado:", r6 ? "✅ OK" : "❌ FALLÓ");

  /* 7. Código de reset (email.services.js) */
  sep("7 — sendPasswordResetEmail");
  try {
    const r7 = await sendPasswordResetEmail(DESTINATARIO, "394827");
    console.log("Resultado: ✅ OK  (messageId:", r7.messageId, ")");
  } catch (e) {
    console.log("Resultado: ❌ FALLÓ →", e.message);
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log("✔  Test completo. Revisa tu bandeja de entrada.");
  console.log(`${"═".repeat(50)}\n`);
})();
