import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error('❌ Missing Twilio credentials in .env');
    process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * NOTE: Setting the "Command Menu" (the "/" icon in WhatsApp) is done via 
 * the Twilio Messaging Service or Meta Business Manager.
 * 
 * This script provides guidance on how to enable the premium interactive features.
 */

console.log(`
🚀 *WhatsApp Bot Interactivity Guide*

You have 3 ways to make the bot more interactive:

1. COMMAND MENU (The "/" Button)
   - Go to Twilio Console > Messaging > Senders > WhatsApp Senders.
   - Click on your WhatsApp number.
   - Look for "Command Menu" or "Persistent Menu".
   - Add these commands:
     /remind  - Set a reminder
     /recent  - View recent saves
     /dash    - Open dashboard

2. INTERACTIVE BUTTONS
   - To use the clickable buttons I just programmed, you need a 'Content SID'.
   - Go to Twilio Console > Messaging > Content Editor.
   - Create a new 'Quick Reply' template with 3 buttons.
   - Once approved, copy the SID (starts with 'HX...') and add it to your .env:
     TWILIO_CONTENT_SID_MENU=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxx

3. FALLBACK MODE (Already Active)
   - I've programmed a beautiful text-based fallback that includes:
     ✅ Rich Thumbnails (Images of the reel)
     ✅ Immediate "Saving..." acknowledgement
     ✅ Clickable-looking menu blocks
`);

async function checkTwilio() {
    try {
        const account = await client.api.v2010.accounts(TWILIO_ACCOUNT_SID).fetch();
        console.log(`✅ Twilio Account Connected: ${account.friendlyName}`);
        console.log(`✅ Using Sender: ${TWILIO_WHATSAPP_NUMBER}`);
    } catch (err) {
        console.error(`❌ Twilio Connection Failed: ${err.message}`);
    }
}

checkTwilio();
