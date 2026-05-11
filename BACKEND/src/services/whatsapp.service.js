const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
  puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] },
});

let clienteListo = false;

client.on("qr", (qr) => {
  console.log("\n📱 Escanea este QR con tu WhatsApp (Vincular dispositivo → Escanear código QR):\n");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  clienteListo = true;
  console.log("✅ WhatsApp conectado y listo para enviar mensajes.");
});

client.on("authenticated", () => {
  console.log("🔐 WhatsApp autenticado correctamente.");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Error de autenticación WhatsApp:", msg);
  clienteListo = false;
});

client.on("disconnected", (reason) => {
  console.warn("⚠️  WhatsApp desconectado:", reason);
  clienteListo = false;
});

client.initialize().catch((err) => {
  console.error("Error al inicializar WhatsApp:", err.message);
});

const formatearNumero = (telefono) => {
  const limpio = telefono.replace(/\D/g, "");
  // Si ya tiene código de país Colombia (57) y 10 dígitos después → ok
  if (limpio.length === 12 && limpio.startsWith("57")) return `${limpio}@c.us`;
  // Si tiene 10 dígitos (número colombiano sin código) → agregar 57
  if (limpio.length === 10) return `57${limpio}@c.us`;
  // Si tiene otro código de país (+X seguido de dígitos)
  if (limpio.length > 10) return `${limpio}@c.us`;
  return null;
};

const WhatsappService = {
  enviarConfirmacionReserva: async ({ clienteNombre, clienteTelefono, reservaId, habitacion, fechaInicio, fechaFin, montoTotal }) => {
    if (!clienteListo) {
      console.warn("WhatsApp aún no está listo, mensaje no enviado.");
      return false;
    }

    const numeroFormateado = formatearNumero(clienteTelefono ?? "");
    if (!numeroFormateado) {
      console.warn(`Teléfono inválido para WhatsApp: "${clienteTelefono}"`);
      return false;
    }

    try {
      const mensaje =
        `✅ *Reserva Confirmada - Hospedaje Digital*\n\n` +
        `Hola *${clienteNombre}*, tu reserva ha sido registrada.\n\n` +
        `📋 *Detalles:*\n` +
        `• Reserva N°: *#${reservaId}*\n` +
        `• Habitación: *${habitacion}*\n` +
        `• Entrada: *${new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" })}*\n` +
        `• Salida: *${new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" })}*\n` +
        `• Total: *$${Number(montoTotal).toLocaleString("es-CO")}*\n\n` +
        `Gracias por elegirnos. 🏨`;

      // Resolver el ID correcto del número (soporta @c.us y @lid)
      const solo = numeroFormateado.replace("@c.us", "");
      const numberId = await client.getNumberId(solo);
      if (!numberId) {
        console.warn(`Número no registrado en WhatsApp: ${clienteTelefono}`);
        return false;
      }

      await client.sendMessage(numberId._serialized, mensaje);
      console.log(`✅ WhatsApp enviado a ${clienteTelefono}`);
      return true;
    } catch (err) {
      console.error("Error enviando WhatsApp:", err.message);
      return false;
    }
  },
};

module.exports = WhatsappService;
