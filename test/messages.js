require("dotenv").config();
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const MENSAJE = "✅ Prueba exitosa desde test-telegram.js";

async function enviarTelegram() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const res = await axios.post(url, {
      chat_id: CHAT_ID,
      text: MENSAJE,
    });

    if (res.data.ok) {
      console.log("[✔] Mensaje enviado correctamente a Telegram.");
    } else {
      console.error(
        "[✖] Error inesperado en la respuesta de Telegram:",
        res.data
      );
    }
  } catch (error) {
    console.error(
      "[✖] Error al enviar Telegram:",
      error.response?.data || error.message
    );
  }
}

enviarTelegram();
