require("dotenv").config();
const axios = require("axios");

const PHONE = process.env.PHONE;
const API_KEY = process.env.API_KEY;
const MENSAJE =
  "✅ Prueba exitosa: CallMeBot está enviando mensajes correctamente.";

async function enviarWhatsapp(mensaje) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${encodeURIComponent(
    mensaje
  )}&apikey=${API_KEY}`;
  try {
    const res = await axios.get(url);
    if (res.data.toLowerCase().includes("message sent")) {
      console.log("[✔] WhatsApp enviado correctamente");
    } else {
      console.log("[❓] Respuesta inesperada:", res.data);
    }
  } catch (error) {
    console.error("[✖] Error al enviar WhatsApp:", error.message);
  }
}

enviarWhatsapp(MENSAJE);
