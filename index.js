require('dotenv').config();
const axios = require('axios');
const twilio = require('twilio');

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const DESTINATION_WHATSAPP_NUMBER = process.env.DESTINATION_WHATSAPP_NUMBER;

// Umbral del valor del dólar
const DOLLAR_THRESHOLD = 3.70;

// API de BCRP para obtener el tipo de cambio del dólar
const BCRP_API_URL_DOL = 'https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04637PD/json';

// Función para obtener el tipo de cambio del dólar desde la API de BCRP
async function obtenerTipoCambio() {
  try {
    const response = await axios.get(BCRP_API_URL_DOL);
    const data = response.data;
    if (data && data.periods && data.periods.length > 0) {
      // Obtiene el valor más reciente del tipo de cambio
      const tipoCambio = parseFloat(data.periods[data.periods.length - 1].values[0]);
      return tipoCambio;
    }
  } catch (error) {
    console.error('Error al obtener el tipo de cambio:', error);
  }
  return null;
}

// Función para enviar un mensaje de WhatsApp usando Twilio
async function enviarMensajeWhatsApp(mensaje) {
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  try {
    const message = await client.messages.create({
      body: mensaje,
      from: TWILIO_WHATSAPP_NUMBER,
      to: DESTINATION_WHATSAPP_NUMBER
    });
    console.log(`Mensaje enviado: ${message.sid}`);
  } catch (error) {
    console.error('Error al enviar el mensaje de WhatsApp:', error);
  }
}

// Función principal
async function verificarDolar() {
  const tipoCambio = await obtenerTipoCambio();
  if (tipoCambio !== null) {
    console.log(`El tipo de cambio actual es: ${tipoCambio}`);
    if (tipoCambio < DOLLAR_THRESHOLD) {
      const mensaje = `Alerta: El dólar ha bajado a ${tipoCambio}.`;
      await enviarMensajeWhatsApp(mensaje);
    } else {
      console.log('El dólar aún no ha bajado lo suficiente.');
    }
  } else {
    console.log('Error al obtener el tipo de cambio.');
  }
}

// Exportar la función para que Vercel pueda invocarla
module.exports = async (req, res) => {
  await verificarDolar();
  res.status(200).send('Proceso completado.');
};