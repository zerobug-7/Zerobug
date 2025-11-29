const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');


async function githubCommand(sock, chatId, message) {
  try {
    const res = await fetch('https://api.github.com/repos/zerobug-7/Zerobug');
    if (!res.ok) throw new Error('Error fetching repository data');
    const json = await res.json();

    let txt = `*乂  zᥱr᥆ᑲᥙg  乂*\n\n`;
    txt += `✩  *ᥒᥲmᥱ* : ${json.name}\n`;
    txt += `✩  *ᥕᥲ𝗍ᥴһᥱrs* : ${json.watchers_count}\n`;
    txt += `✩  *sіzᥱ* : ${(json.size / 1024).toFixed(2)} MB\n`;
    txt += `✩  *ᥣᥲs𝗍 ᥙ⍴ძᥲ𝗍ᥱძ* : ${moment(json.updated_at).format('DD/MM/YY - HH:mm:ss')}\n`;
    txt += `✩  *ᥙrᥣ* : ${json.html_url}\n`;
    txt += `✩  *𝖿᥆rks* : ${json.forks_count}\n`;
    txt += `✩  *s𝗍ᥲrs* : ${json.stargazers_count}\n\n`;
    txt += `💥 *zᥱr᥆ᑲᥙg*`;

    // Use the local asset image
    const imgPath = path.join(__dirname, '../assets/zerobug.jepg');
    const imgBuffer = fs.readFileSync(imgPath);

    await sock.sendMessage(chatId, { image: imgBuffer, caption: txt }, { quoted: message });
  } catch (error) {
    await sock.sendMessage(chatId, { text: '❌ `Error fetching repository information.`' }, { quoted: message });
  }
}

module.exports = githubCommand; 