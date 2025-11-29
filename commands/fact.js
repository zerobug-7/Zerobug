const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const fact = response.data.text;
        await sock.sendMessage(chatId, { text: fact },{ quoted: message });
    } catch (error) {
        console.error('Error fetching fact:', error);
        await sock.sendMessage(chatId, { text: '`s᥆rrᥡ, і ᥴ᥆ᥙᥣძ ᥒ᥆𝗍 𝖿ᥱ𝗍ᥴһ ᥲ 𝖿ᥲᥴ𝗍 rіgһ𝗍 ᥒ᥆ᥕ`.' },{ quoted: message });
    }
};
