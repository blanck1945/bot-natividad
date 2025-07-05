require("dotenv").config();
const puppeteer = require("puppeteer");
const cron = require("node-cron");
const axios = require("axios");

// CONFIGURACIÓN
const URL = "https://www.natividad.org.ar/turnos_embarazadas.php";
const PHONE = process.env.PHONE;
const API_KEY = process.env.API_KEY;
const MENSAJE =
  "🟢 ¡Hay turnos disponibles para embarazadas en la parroquia Natividad del Señor!";
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
  } catch (error) {
    console.error("[✖] Error al hacer scraping:", error.message);
    await browser.close();
    return false;
  }
}

// Envío de WhatsApp usando CallMeBot
async function enviarWhatsapp(mensaje) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${encodeURIComponent(
    mensaje
  )}&apikey=${API_KEY}`;
  try {
    await axios.get(url);
    console.log(`[✔] WhatsApp enviado: ${mensaje}`);
  } catch (error) {
    console.error("[✖] Error al enviar WhatsApp:", error.message);
  }
}

// CRON: cada 4 minutos
const cronExpresion = "*/4 * * * *";
console.log(`[🛠️] Cron programado: cada 4 minutos (${cronExpresion})`);

// Próxima ejecución inicial
const ahora = new Date();
const proxima = new Date(
  Math.ceil(ahora.getTime() / (4 * 60 * 1000)) * (4 * 60 * 1000)
);
console.log(`[🕒] Próxima ejecución estimada: ${proxima.toLocaleString()}`);

cron.schedule(cronExpresion, async () => {
  const ahora = new Date();
  console.log(`[⏰] Verificando turnos - ${ahora.toLocaleString()}`);

  const hayTurnos = await hayTurnosDisponibles();
  if (hayTurnos) {
    await enviarWhatsapp(MENSAJE);
  } else {
    console.log("[ℹ️] No hay turnos disponibles.");
  }

  // ✅ Calcular exactamente 4 minutos después del cron
  const proxima = new Date(ahora.getTime() + 4 * 60 * 1000);
  console.log(`[🕒] Próxima ejecución estimada: ${proxima.toLocaleString()}`);
  console.log("/* --------------------------------------------- */\n");
});

// ✅ Verificación real 1 minuto después del arranque
setTimeout(async () => {
  console.log("[⏳] Ejecutando verificación inicial (post-arranque)");

  try {
    const test = await hayTurnosDisponibles();

    const mensajeInicio = test
      ? "✅ El bot fue activado correctamente y la verificación inicial se realizó con éxito (hay turnos disponibles)."
      : "✅ El bot fue activado correctamente y la verificación inicial se realizó con éxito (no hay turnos disponibles).";

    await enviarWhatsapp(mensajeInicio);
  } catch (err) {
    const mensajeError =
      "❌ El bot fue activado pero ocurrió un error en la verificación inicial. Revisá los logs.";
    await enviarWhatsapp(mensajeError);
    console.error("[✖] Error durante verificación inicial:", err.message);
  }
}, 60_000);
