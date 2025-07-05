const puppeteer = require("puppeteer");

// URL a verificar
const URL = "https://www.natividad.org.ar/turnos_embarazadas.php";
const TEXTO_NO_TURNOS =
  "En este momento la parroquia no cuenta con cupos para embarazadas";

(async () => {
  console.log(`[🔍] Iniciando prueba de scraping a: ${URL}`);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    // Ir a la página con más tolerancia (60 segundos)
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Obtener texto del body completo
    const texto = await page.evaluate(() => document.body.innerText);
    console.log("\n=== TEXTO DETECTADO ===\n");
    console.log(texto.slice(0, 1000)); // Mostramos los primeros 1000 caracteres

    if (texto.includes(TEXTO_NO_TURNOS)) {
      console.log("\n[🔴] No hay turnos disponibles.");
    } else {
      console.log("\n[🟢] Podría haber turnos disponibles.");
    }
  } catch (error) {
    console.error("[✖] Error al hacer scraping:", error.message);
  } finally {
    await browser.close();
  }
})();
