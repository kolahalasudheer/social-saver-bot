import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/reels';

async function testReminderAPI() {
    try {
        // 1. Fetch all reels to get a valid ID
        console.log('Fetching reels...');
        const reelsRes = await axios.get(BASE_URL);
        const reels = reelsRes.data.data;

        if (!reels || reels.length === 0) {
            console.error('No reels found in database. Please save a reel first.');
            return;
        }

        const targetReel = reels[0];
        console.log(`Testing with reel ID: ${targetReel.id} (Shortcode: ${targetReel.shortcode})`);

        // 2. Set a reminder for 2 minutes from now
        const remindAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
        console.log(`Setting reminder for: ${remindAt}`);

        const reminderRes = await axios.post(`${BASE_URL}/${targetReel.id}/reminders`, {
            remindAt,
            userPhone: targetReel.user_phone
        });

        console.log('✅ Reminder API Response:', JSON.stringify(reminderRes.data, null, 2));

        // 3. (Optional) Check natural language parsing
        console.log('Testing natural language parsing...');
        const nlRes = await axios.post(`${BASE_URL}/${targetReel.id}/reminders`, {
            text: 'in 5 minutes',
            userPhone: targetReel.user_phone
        });
        console.log('✅ NL Reminder Response:', JSON.stringify(nlRes.data, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testReminderAPI();
