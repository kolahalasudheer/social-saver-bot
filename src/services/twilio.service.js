import twilio from "twilio";

/**
 * Get Twilio client (lazy initialization)
 */
function getTwilioClient() {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_NUMBER,
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    throw new Error(
      "Twilio environment variables are missing. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER."
    );
  }

  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Send WhatsApp message
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (without whatsapp:)
 * @param {string} params.body - Message body
 */
async function sendWhatsAppMessage({ to, body }) {
  if (!to || !body) {
    throw new Error("Both 'to' and 'body' are required.");
  }

  const { TWILIO_WHATSAPP_NUMBER } = process.env;
  const formattedTo = to.startsWith("whatsapp:")
    ? to
    : `whatsapp:${to}`;

  const client = getTwilioClient();
  const message = await client.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to: formattedTo,
    body,
  });

  return message;
}

export { sendWhatsAppMessage };
