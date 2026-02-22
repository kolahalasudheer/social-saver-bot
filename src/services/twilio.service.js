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
 * Send WhatsApp message (Supports Text, Media, and Content Templates)
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (without whatsapp:)
 * @param {string} params.body - Message body (optional if contentSid is used)
 * @param {string} [params.mediaUrl] - Optional URL to an image/video
 * @param {string} [params.contentSid] - Optional Twilio Content SID for interactive buttons/lists
 * @param {Object} [params.contentVariables] - Optional variables for the content template
 */
async function sendWhatsAppMessage({ to, body, mediaUrl, contentSid, contentVariables }) {
  if (!to || (!body && !contentSid)) {
    throw new Error("Phone number and either 'body' or 'contentSid' are required.");
  }

  const { TWILIO_WHATSAPP_NUMBER } = process.env;
  const formattedTo = to.startsWith("whatsapp:")
    ? to
    : `whatsapp:${to}`;

  const client = getTwilioClient();

  const messageOptions = {
    from: TWILIO_WHATSAPP_NUMBER,
    to: formattedTo,
  };

  if (body) messageOptions.body = body;
  if (mediaUrl) messageOptions.mediaUrl = [mediaUrl];
  if (contentSid) {
    messageOptions.contentSid = contentSid;
    if (contentVariables) {
      messageOptions.contentVariables = JSON.stringify(contentVariables);
    }
  }

  const message = await client.messages.create(messageOptions);
  return message;
}

export { sendWhatsAppMessage };
