const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '7963289426:AAFpfGwqIUx_2r87QpG3rgGDAczjjG8YWDI';
const bot = new TelegramBot(token, {polling: true});

const GLONOVA_API = 'https://glonova.in/exif.php';

// Function to format EXIF data
function formatExifData(exif) {
    if (!exif || !exif.success) return null;
    
    const fields = [
        {name: 'Make', key: 'make'},
        {name: 'Model', key: 'model'},
        {name: 'Date', key: 'datetime'},
        {name: 'Exposure', key: 'exposure'},
        {name: 'Aperture', key: 'aperture'},
        {name: 'ISO', key: 'iso'},
        {name: 'Focal Length', key: 'focal_length'},
        {name: 'Lens', key: 'lens'},
        {name: 'Location', key: 'location', prefix: '📍'}
    ];
    
    let message = '📷 EXIF Data Found:\n\n';
    let hasData = false;
    
    fields.forEach(field => {
        if (exif[field.key]) {
            const prefix = field.prefix || '📌';
            message += `${prefix} ${field.name}: ${exif[field.key]}\n`;
            hasData = true;
        }
    });
    
    return hasData ? message : null;
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    
    if (!msg.photo) {
        return bot.sendMessage(chatId, 'Please send me a photo to extract EXIF data.');
    }
    
    try {
        const photo = msg.photo[msg.photo.length - 1];
        const file = await bot.getFile(photo.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        
        const response = await axios.get(GLONOVA_API, {
            params: {url: fileUrl},
            timeout: 10000 // 10 seconds timeout
        });
        
        const formatted = formatExifData(response.data);
        if (formatted) {
            await bot.sendMessage(chatId, formatted, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
        } else {
            await bot.sendMessage(chatId, 'No EXIF data found in this image.');
        }
    } catch (error) {
        console.error('Error:', error.message);
        
        let errorMessage = 'An error occurred while processing the image.';
        if (error.response) {
            errorMessage += `\nAPI Error: ${error.response.status}`;
        } else if (error.request) {
            errorMessage += '\nRequest timed out. Please try again.';
        }
        
        await bot.sendMessage(chatId, errorMessage);
    }
});

// Handle errors
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('EXIF Bot is running...');
