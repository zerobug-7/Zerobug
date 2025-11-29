const axios = require('axios');
const { sleep } = require('../lib/myfunc');

async function pairCommand(sock, chatId, message, q) {
    try {
        if (!q) {
            return await sock.sendMessage(chatId, {
                text: "*⍴ᥣᥱᥲsᥱ ⍴r᥆᥎іძᥱ ᥎ᥲᥣіძ ᥕһᥲ𝗍sᥲ⍴⍴ ᥒᥙmᑲᥱr*\n*ᥱ᥊ᥲm⍴ᥣᥱ .⍴ᥲіr 263771xxxxxxx*",
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363403397971008@newsletter',
                        newsletterName: 'zᥱr᥆ᑲᥙg',
                        serverMessageId: -1
                    }
                }
            });
        }

        const numbers = q.split(',')
            .map((v) => v.replace(/[^0-9]/g, ''))
            .filter((v) => v.length > 5 && v.length < 20);

        if (numbers.length === 0) {
            return await sock.sendMessage(chatId, {
                text: "`Invalid number❌️ Please use the correct format`!",
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363403397971008@newsletter',
                        newsletterName: 'zᥱr᥆ᑲᥙg',
                        serverMessageId: -1
                    }
                }
            });
        }

        for (const number of numbers) {
            const whatsappID = number + '@s.whatsapp.net';
            const result = await sock.onWhatsApp(whatsappID);

            if (!result[0]?.exists) {
                return await sock.sendMessage(chatId, {
                    text: `*𝗍һᥲ𝗍 ᥒᥙmᑲᥱr іs ᥒ᥆𝗍 rᥱgіs𝗍ᥱrᥱძ ᥆ᥒ ᥕһᥲ𝗍sᥲ⍴⍴*`,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363403397971008@newsletter',
                            newsletterName: 'zᥱr᥆ᑲᥙg',
                            serverMessageId: -1
                        }
                    }
                });
            }

            await sock.sendMessage(chatId, {
                text: "*ᥕᥲі𝗍 ᥲ m᥆mᥱᥒ𝗍 𝖿᥆r 𝗍һᥱ ᥴ᥆ძᥱ*",
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363161513685998@newsletter',
                        newsletterName: 'zᥱr᥆ᑲᥙg',
                        serverMessageId: -1
                    }
                }
            });

            try {
                const response = await axios.get(`https://knight-bot-paircһһһᥲode.onrender.com/code?number=${number}`);
                
                if (response.data && response.data.code) {
                    const code = response.data.code;
                    if (code === "sᥱr᥎іᥴᥱ ᥙᥒᥲ᥎ᥲіᥣᥲᑲᥣᥱ") {
                        throw new Error('sᥱr᥎іᥴᥱ ᥙᥒᥲ᥎ᥲіᥣᥲᑲᥣᥱ');
                    }
                    
                    await sleep(5000);
                    await sock.sendMessage(chatId, {
                        text: `*ᥡ᥆ᥙr ⍴ᥲіrіᥒg ᥴ᥆ძᥱ*: ${code}`,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363403397971008@newsletter',
                                newsletterName: 'zᥱr᥆ᑲᥙg',
                                serverMessageId: -1
                            }
                        }
                    });
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (apiError) {
                console.error('API Error:', apiError);
                const errorMessage = apiError.message === 'sᥱr᥎іᥴᥱ ᥙᥒᥲ᥎ᥲіᥣᥲᑲᥣᥱ' 
                    ? "sᥱr᥎іᥴᥱ іs ᥴᥙrrᥱᥒ𝗍ᥣᥡ ᥙᥒᥲ᥎ᥲіᥣᥲᑲᥣᥱ. ⍴ᥣᥱᥲsᥱ 𝗍rᥡ ᥲgᥲіᥒ ᥣᥲ𝗍ᥱr."
                    : "𝖿ᥲіᥣᥱძ 𝗍᥆ generate ⍴ᥲіrіᥒg ᥴ᥆ძᥱ. ⍴ᥣᥱᥲsᥱ 𝗍rᥡ ᥲgᥲіᥒ ᥣᥲ𝗍ᥱr.";
                
                await sock.sendMessage(chatId, {
                    text: errorMessage,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363403397971008@newsletter',
                            newsletterName: 'zᥱr᥆ᑲᥙg',
                            serverMessageId: -1
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, {
            text: "`An error occurred. Please try again later.`",
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363403397971008@newsletter',
                    newsletterName: 'zᥱr᥆ᑲᥙg',
                    serverMessageId: -1
                }
            }
        });
    }
}

module.exports = pairCommand; 