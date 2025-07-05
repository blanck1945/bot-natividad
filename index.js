require("dotenv").config();
const puppeteer = require("puppeteer");
const cron = require("node-cron");
const axios = require("axios");

// CONFIGURACIÓN
const URL = "https://www.natividad.org.ar/turnos_embarazadas.php";
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const MENSAJE =
  "🟢 ¡Hay turnos disponibles para embarazadas en la parroquia Natividad del Señor!";
const TEXTO_NO_TURNOS =
  "En este momento la parroquia no cuenta con cupos para embarazadas";

// SCRAPING
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

// ENVÍO TELEGRAM
async function enviarTelegram(mensaje) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: "HTML",
    });
    console.log(`[✔] Telegram enviado: ${mensaje}`);
    return true;
  } catch (error) {
    console.error("[✖] Error al enviar Telegram:", error.message);
    return false;
  }
}

// CRON: cada 4 minutos
const cronExpresion = "*/4 * * * *";
console.log(`[🛠️] Cron programado: cada 4 minutos (${cronExpresion})`);

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
    await enviarTelegram(MENSAJE);
  } else {
    console.log("[ℹ️] No hay turnos disponibles.");
  }

  const proxima = new Date(ahora.getTime() + 4 * 60 * 1000);
  console.log(`[🕒] Próxima ejecución estimada: ${proxima.toLocaleString()}`);
  console.log("/* --------------------------------------------- */\n");
});

// MENSAJE DE ACTIVACIÓN (1 minuto post-arranque)
setTimeout(async () => {
  console.log("[⏳] Ejecutando verificación inicial (post-arranque)");

  try {
    const test = await hayTurnosDisponibles();
    console.log(test);
    const mensajeInicio = test
      ? "✅ Bot activo. Verificación inicial exitosa"
      : "❌ Bot inactivo. Verificación inicial fallida";

    await enviarTelegram(mensajeInicio);
  } catch (err) {
    const mensajeError =
      "❌ Bot activo, pero ocurrió un error en la verificación inicial. Revisá los logs.";
    await enviarTelegram(mensajeError);
    console.error("[✖] Error durante verificación inicial:", err.message);
  }
}, 60_000);
