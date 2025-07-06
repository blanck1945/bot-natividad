// server.js
require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3333;

// tu lógica actual
const URL = "https://www.natividad.org.ar/turnos_embarazadas.php";
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const TEXTO_NO_TURNOS =
  "En este momento la parroquia no cuenta con cupos para embarazadas";

async function hayTurnosDisponibles() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    const texto = await page.evaluate(() => document.body.innerText);
    await browser.close();
    return !texto.includes(TEXTO_NO_TURNOS);
  } catch (err) {
    await browser.close();
    throw err;
  }
}

async function enviarTelegram(mensaje) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: CHAT_ID,
    text: mensaje,
  });
}

// Endpoint de verificación (ping/sanity)
app.get("/sanity", (req, res) => {
  res.status(200).send("✅ El servidor está activo.");
});

// endpoint GET que ejecuta todo
app.get("/check-turnos", async (req, res) => {
  console.log(`[⏰] Verificando turnos - ${new Date().toLocaleString()}`);
  try {
    const hay = await hayTurnosDisponibles();
    if (hay) {
      await enviarTelegram("🟢 ¡Hay turnos disponibles para embarazadas!");
    }
    res.send("OK");
  } catch (e) {
    await enviarTelegram("❌ Error en el bot al hacer scraping.");
    res.status(500).send("Error");
  }
});

// endpoint para probar el envío de mensajes
app.get("/test-telegram", async (req, res) => {
  try {
    await enviarTelegram("🧪 Mensaje de prueba del bot");
    res.send("Mensaje de prueba enviado correctamente");
  } catch (e) {
    res.status(500).send("Error al enviar mensaje de prueba");
  }
});

app.listen(PORT, () => {
  console.log(`[🚀] Bot iniciado en el puerto ${PORT}`);
});
