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

  try {
    const message = await client.messages.create(messageOptions);
    return message;
  } catch (err) {
    if (err.code === 63038 || err.status === 429) {
      console.log("\n--- ⚠️ TWILIO SANDBOX LIMIT REACHED ---");
      console.log(`[DEMO MOCK] Message to: ${to}`);
      if (body) console.log(`[DEMO MOCK] Body: ${body}`);
      if (contentSid) console.log(`[DEMO MOCK] Template: ${contentSid} | Vars: ${JSON.stringify(contentVariables)}`);
      console.log("----------------------------------------\n");

      // Return a fake success object so the calling code continues
      return { sid: "mock_sid_for_demo", status: "sent_via_mock" };
    }
    throw err;
  }
}

export { sendWhatsAppMessage };
