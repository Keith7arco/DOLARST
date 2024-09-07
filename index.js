const dotenv = require('dotenv');
const twilio = require('twilio');
const axios = require('axios');

// Cargar variables de entorno
dotenv.config();

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const DESTINATION_WHATSAPP_NUMBER = process.env.DESTINATION_WHATSAPP_NUMBER;

// Umbral del valor del dólar
const DOLLAR_THRESHOLD = 3.90;

// API de BCRP para obtener el tipo de cambio del dólar
const BCRP_API_URL_DOL = 'https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04637PD/json';

// Función para obtener el tipo de cambio del dólar desde la API de BCRP
async function obtener_tipo_cambio() {
  try {
    const response = await axios.get(BCRP_API_URL_DOL);
    const data = response.data;
    if (data && data.periods) {
      // Obtiene el valor más reciente del tipo de cambio
      return parseFloat(data.periods[data.periods.length - 1].values[0]);
    }
  } catch (error) {
    console.error('Error al obtener el tipo de cambio:', error);
  }
  return null;
}

// Función para enviar un mensaje de WhatsApp usando Twilio
async function enviar_mensaje_whatsapp(mensaje) {
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
async function verificar_dolar() {
  const tipo_cambio = await obtener_tipo_cambio();
  if (tipo_cambio !== null) {
    console.log(`El tipo de cambio actual es: ${tipo_cambio}`);
    if (tipo_cambio < DOLLAR_THRESHOLD) {
      const mensaje = `Alerta: El dólar ha bajado a ${tipo_cambio}.`;
      await enviar_mensaje_whatsapp(mensaje);
    } else {
      console.log('El dólar aún no ha bajado lo suficiente.');
    }
  } else {
    console.log('Error al obtener el tipo de cambio.');
  }
}

// Ejecutar la función
verificar_dolar();
