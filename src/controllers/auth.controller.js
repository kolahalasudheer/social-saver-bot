import asyncHandler from '../middleware/asyncHandler.js';
import { findUserByPhone, saveAuthCode, verifyAuthCode, deleteAuthCode } from '../services/user.repository.js';
import { sendWhatsAppMessage } from '../services/twilio.service.js';

/**
 * 🔐 Auth Controller
 * Handles OTP generation and validation for dashboard login.
 */

// 1. Request OTP
export const requestOTP = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    // Verify user exists in our system
    const user = await findUserByPhone(phone);
    if (!user || !user.is_registered) {
        return res.status(404).json({
            success: false,
            error: 'This number is not registered. Please send a message to the bot first.'
        });
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Save to DB (expires in 5 mins)
    await saveAuthCode(phone, code, 5);

    // Send via WhatsApp
    await sendWhatsAppMessage({
        to: phone,
        body: `🔐 *Dashboard Login*\n\nYour verification code is: *${code}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`
    });

    res.json({ success: true, message: 'OTP sent successfully' });
});

// 2. Verify OTP
export const verifyOTP = asyncHandler(async (req, res) => {
    const { phone, code } = req.body;

    if (!phone || !code) {
        return res.status(400).json({ success: false, error: 'Phone and code are required' });
    }

    const validCode = await verifyAuthCode(phone, code);

    if (!validCode) {
        return res.status(401).json({ success: false, error: 'Invalid or expired code' });
    }

    // Code is valid - cleanup
    await deleteAuthCode(phone);

    res.json({
        success: true,
        message: 'Login successful',
        data: { phone } // In a real app, we'd return a JWT here
    });
});
