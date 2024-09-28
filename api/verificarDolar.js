const axios = require('axios');
require('dotenv').config({ path: '../.env' });

// Configuración de Twilio
const TELEGRAM_BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID  = process.env.TELEGRAM_CHAT_ID;

// Umbral del valor del dólar
const DOLLAR_THRESHOLD = 3.80;

// API de BCRP para obtener el tipo de cambio del dólar
const BCRP_API_URL_DOL = 'https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04637PD/json';

async function obtenerTipoCambio() {
  try {
    const response = await axios.get(BCRP_API_URL_DOL);
    const data = response.data;
    if (data && data.periods && data.periods.length > 0) {
      const tipoCambio = parseFloat(data.periods[data.periods.length - 1].values[0]);
      return tipoCambio;
    }
  } catch (error) {
    console.error('Error al obtener el tipo de cambio:', error);
  }
  return null;
}

async function enviarMensajeTelegram(mensaje) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await axios.post(url,{
      chat_id: TELEGRAM_CHAT_ID,
      text: mensaje
    });
    console.log(`Mensaje enviado: ${response.data.result.text}`);
  } catch (error) {
    console.error('Error al enviar el mensaje de Telegram:', error);
  }
}

async function verificarDolar() {
  try {
    const tipoCambio = await obtenerTipoCambio();
    if (tipoCambio !== null) {
      console.log(`El tipo de cambio actual es: ${tipoCambio}`);
      if (tipoCambio <= DOLLAR_THRESHOLD) {
        const mensaje = `Alerta: El dólar ha bajado a ${tipoCambio}.`;
        await enviarMensajeTelegram(mensaje);
      } else {
        console.log('El dólar aún no ha bajado lo suficiente.');
        await enviarMensajeTelegram(mensaje);
      }
    } else {
      console.log('Error al obtener el tipo de cambio.');
    }
  } catch (error) {
    console.error('Error en la función verificarDolar:', error);
  }
}

// Exporta la función para que Vercel pueda ejecutarla
module.exports = async (req, res) => {
  await verificarDolar();
  res.status(200).send('Proceso completado.');
};
