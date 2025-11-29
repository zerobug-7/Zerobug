/*

➫ ᥆ᥕᥒᥕᥱr : ᥒk᥆sі
➫ ᑲ᥆𝗍 ᥒᥲmᥱ : zᥱr᥆ᑲᥙg
➫ ᑲᥲsᥱ ᥆ᥕᥒᥱrr : m᥎ᥱᥣᥲsᥱ-᥆𝖿ᥴ

 */
 
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection completed')
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...')
        process.exit(1) // Panel will auto-restart
    }
}, 30_000) // check every 30 seconds

let phoneNumber = "263718544944"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "zᥱr᥆ᑲᥙg"
global.themeemoji = "•"
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}


async function startXeonBotInc() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const XeonBotInc = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })

    store.bind(XeonBotInc.ev)

    // Message handling
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }
            // In private mode, only block non-group messages (allow groups for moderation)
            // Note: XeonBotInc.public is not synced, so we check mode in main.js instead
            // This check is kept for backward compatibility but mainly blocks DMs
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                if (!isGroup) return // Block DMs in private mode, but allow group messages
            }
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Clear message retry cache to prevent memory bloat
            if (XeonBotInc?.msgRetryCounterCache) {
                XeonBotInc.msgRetryCounterCache.clear()
            }

            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, {
                        text: '❌ An error occurred while processing your message.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363403397971008@newsletter',
                                newsletterName: 'zᥱr᥆ᑲᥙg',
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('𝐂𝐚𝐧𝐧𝐨𝐭 𝐮𝐬𝐞 𝐩𝐚𝐢𝐫𝐢𝐧𝐠 𝐜𝐨𝐝𝐞 𝐰𝐢𝐭𝐡 𝐦𝐨𝐛𝐢𝐥𝐞 𝐚𝐩𝐢')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`𝐏𝐋𝐄𝐀𝐒𝐄 𝐓𝐘𝐏𝐄 𝐘𝐎𝐔𝐑 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 𝐍𝐔𝐌𝐁𝐄𝐑\n𝐅𝐎𝐑𝐌𝐀𝐓: 263784533715 (𝐖𝐈𝐓𝐇𝐎𝐔𝐓 + 𝐎𝐑 𝐒𝐏𝐀𝐂𝐄𝐒) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐩𝐡𝐨𝐧𝐞 𝐧𝐮𝐦𝐛𝐞𝐫. 𝐩𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐲𝐨𝐮𝐫 𝐟𝐮𝐥𝐥 𝐢𝐧𝐭𝐞𝐫𝐧𝐚𝐭𝐢𝐨𝐧𝐚𝐥 𝐧𝐮𝐦𝐛𝐞𝐫 (𝐞.𝐠., 15551234567 𝐟𝐨𝐫 𝐔𝐒, 447911123456 𝐟𝐨𝐫 𝐔𝐊, 𝐞𝐭𝐜.) 𝐰𝐢𝐭𝐡𝐨𝐮𝐭 + 𝐨𝐫 𝐬𝐩𝐚𝐜𝐞𝐬.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`𝐙𝐞𝐫𝐨𝐛𝐮𝐠 𝐏𝐚𝐢𝐫𝐢𝐧𝐠 𝐂𝐨𝐝𝐞 🧧 : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\n𝐏𝐋𝐄𝐀𝐒𝐄 𝐄𝐍𝐓𝐄𝐑 𝐓𝐇𝐈𝐒 𝐂𝐎𝐃𝐄 𝐈𝐍 𝐘𝐎𝐔𝐑 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 𝐀𝐏𝐏:\n1. 𝐎𝐏𝐄𝐍 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏\n2. 𝐆𝐎 𝐓𝐎 𝐒𝐄𝐓𝐓𝐈𝐍𝐆 𝐒 > 𝐋𝐈𝐍𝐊𝐄𝐃 𝐃𝐄𝐕𝐈𝐂𝐄 𝐒\n3. 𝐓𝐀𝐏 "𝐋𝐈𝐍𝐊 𝐀 𝐃𝐄𝐕𝐈𝐂𝐄 𝐖𝐈𝐓𝐇 𝐀 𝐏𝐇𝐎𝐍𝐄 𝐍𝐔𝐌𝐁𝐄𝐑"\n4. 𝐄𝐍𝐓𝐄𝐑 𝐓𝐇𝐄 𝐂𝐎𝐃𝐄 𝐒𝐇𝐎𝐖𝐍 𝐀𝐁𝐎𝐕𝐄`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐠𝐞𝐭 𝐩𝐚𝐢𝐫𝐢𝐧𝐠 𝐜𝐨𝐝𝐞. 𝐏𝐥𝐞𝐚𝐬𝐞 𝐜𝐡𝐞𝐜𝐤 𝐲𝐨𝐮𝐫 𝐩𝐡𝐨𝐧𝐞 𝐧𝐮𝐦𝐛𝐞𝐫 𝐚𝐧𝐝 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧.'))
            }
        }, 3000)
    }

    // Connection handling
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿ᥴ᥆ᥒᥒᥱᥴ𝗍ᥱძ 𝗍᥆ ` + JSON.stringify(XeonBotInc.user, null, 2)))

            const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
            await XeonBotInc.sendMessage(botNumber, {
                text: `*zᥱr᥆ᑲᥙg ᥴ᥆ᥒᥒᥱᥴ𝗍ᥱძ sᥙᥴᥴᥱss𝖿ᥙᥣᥣᥡ!*\n\n⏰ *𝗍іmᥱ:* *${new Date().toLocaleString()}*\n✅ *s𝗍ᥲ𝗍ᥙs: ᥆ᥒᥣіᥒᥱ ᥲᥒძ rᥱᥲძᥡ!*
                \n*✅mᥲkᥱ sᥙrᥱ 𝗍᥆ ȷ᥆іᥒ ᥆ᥙr ᥴһᥲᥒᥒᥱᥣ ᑲᥱᥣ᥆ᥕ*`,
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

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || '𝐙𝐞𝐫𝐨𝐛𝐮𝐠'} ]`)}\n\n`))
            console.log(chalk.cyan(`乂 •───────────────• 乂`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} 𝐘𝐎𝐔𝐓𝐔𝐁𝐄 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 𝐍𝐀𝐌𝐄: 𝐊𝐇𝐔𝐋𝐄𝐊𝐀𝐍𝐈 𝐃𝐔𝐃𝐄`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} 𝐆𝐈𝐓𝐁𝐈𝐁: 𝐙𝐞𝐫𝐨𝐛𝐮𝐠-7`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 𝐍𝐔𝐌𝐁𝐄𝐑: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} 𝐂𝐑𝐄𝐃𝐈𝐓: 𝐊𝐇𝐔𝐋𝐄𝐊𝐀𝐍𝐈 𝐃𝐔𝐁𝐄`))
            console.log(chalk.green(`${global.themeemoji || '•'} 𝐙𝐞𝐫𝐨𝐛𝐮𝐠 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲! ✅`))
            console.log(chalk.blue(`𝐙𝐞𝐫𝐨𝐛𝐮𝐠 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: ${settings.version}`))
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                } catch { }
                console.log(chalk.red('𝐙𝐞𝐫𝐨𝐛𝐮𝐠 𝐬𝐞𝐬𝐬𝐢𝐨𝐧 𝐥𝐨𝐠𝐠𝐞𝐝 𝐨𝐮𝐭. 𝐏𝐋𝐄𝐀𝐒𝐄 𝐑𝐄-𝐀𝐔𝐓𝐇𝐄𝐍𝐓𝐈𝐂𝐀𝐓𝐄.'))
                startXeonBotInc()
            } else {
                startXeonBotInc()
            }
        }
    })

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // First: attempt to reject the call if supported
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid);
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '*`📵 Anticall is enabled. Your call was rejected and you will be ᑲᥣ᥆ᥴkᥱძ.`*' });
                    }
                } catch {}
                // Then: block after a short delay to ensure rejection and message are processed
                setTimeout(async () => {
                    try { await XeonBotInc.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignore
        }
    });

    XeonBotInc.ev.on('creds.update', saveCreds)

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
}


// Start the bot with error handling
startXeonBotInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})