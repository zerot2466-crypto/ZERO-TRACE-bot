const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const config = require('./config.js');

class TelegramBotController {
    constructor(token, whatsAppManager) {
        this.bot = new TelegramBot(token, { polling: true });
        this.whatsAppManager = whatsAppManager;
        this.ownerId = String(config.OWNER_TELEGRAM_ID);
        this.requiredChannels = config.REQUIRED_CHANNELS;
        this.pendingAction = new Map(); // chatId -> { type, userId } — attend le prochain message (numéro / texte à diffuser / photo)
        this.setupListeners();
    }

    async checkMembership(chatId, userId) {
        // Owner bypasses channel membership check
        if (String(userId) === String(this.ownerId)) return true;

        for (const channel of this.requiredChannels) {
            try {
                const member = await this.bot.getChatMember(channel.id, userId);

                if (!["member", "administrator", "creator"].includes(member.status)) {
                    const joinButtons = this.requiredChannels.map(ch => ([
                        { text: `➡️ Join ${ch.type}`, url: ch.link }
                    ]));

                    await this.bot.sendMessage(
                        chatId,
                        `*Access Denied!* 🚫\n\n` +
                        `You must join all required channels/groups to use this bot.\n\n` +
                        `After joining, type /start again.`,
                        {
                            parse_mode: "Markdown",
                            reply_markup: { inline_keyboard: joinButtons }
                        }
                    );

                    return false;
                }

            } catch (error) {
                console.error(`Error checking membership for ${channel.id}:`, error.message);

                await this.bot.sendMessage(
                    chatId,
                    `⚠️ *Verification Failed*\n\n` +
                    `I couldn't verify your membership for:\n` +
                    `${channel.type.toUpperCase()}: ${channel.link}\n\n` +
                    `Make sure:\n` +
                    `• You have joined it\n` +
                    `• The bot is an admin there\n` +
                    `• The chat is not fully private`,
                    { parse_mode: "Markdown" }
                );

                return false;
            }
        }

        return true;
    }

    // ═══════════════════════════════════════
    // MENU — design + clavier de boutons
    // ═══════════════════════════════════════

    buildMenuKeyboard(isOwner) {
        const rows = [
            [{ text: "🔗 Pairer", callback_data: "pair" }, { text: "🗑️ Dépairer", callback_data: "delpair" }],
            [{ text: "⏸️ Stop", callback_data: "stop" }, { text: "▶️ Reprendre", callback_data: "resume" }, { text: "🔄 Redémarrer", callback_data: "restart" }]
        ];
        if (isOwner) {
            rows.push([{ text: "📋 Sessions", callback_data: "listpair" }, { text: "📢 Diffuser", callback_data: "broadcast" }]);
            rows.push([{ text: "🖼️ Photo du bot", callback_data: "setphoto" }]);
        }
        return rows;
    }

    async sendMenu(chatId, from) {
        const userId = from.id;
        const userTag = from.username ? `@${from.username}` : from.first_name;
        const isOwner = String(userId) === this.ownerId;

        const runtimeMs = process.uptime() * 1000;
        const days = Math.floor(runtimeMs / (24 * 60 * 60 * 1000));
        const hours = Math.floor((runtimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((runtimeMs % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((runtimeMs % (60 * 1000)) / 1000);

        let runtimeString = '';
        if (days > 0) runtimeString += `${days}d `;
        if (hours > 0) runtimeString += `${hours}h `;
        if (minutes > 0) runtimeString += `${minutes}m `;
        runtimeString += `${seconds}s`;

        const caption =
`*『 ◈ ${config.botName || 'ZERO TRACE'} ◈ 』*
_Aucune trace. Aucune limite. Juste le résultat._
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

👤 ${userTag}  ·  🆔 \`${userId}\`
⏱️ ${runtimeString}

▸ Choisis une action ci-dessous 👇`;

        const options = {
            caption,
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: this.buildMenuKeyboard(isOwner) }
        };

        try {
            const imagePath = path.join(__dirname, 'media', 'zero_profile.jpg');
            const photoBuffer = fs.readFileSync(imagePath);
            await this.bot.sendPhoto(chatId, photoBuffer, options);
        } catch (imageError) {
            await this.bot.sendMessage(chatId, caption, { parse_mode: "Markdown", reply_markup: options.reply_markup });
        }
    }

    // ═══════════════════════════════════════
    // ACTIONS — partagées entre commandes texte et boutons
    // ═══════════════════════════════════════

    async handlePair(chatId, userId, rawNumber) {
        const whatsappNumber = (rawNumber || '').replace(/[^0-9]/g, '');

        if (this.whatsAppManager.clients.size >= config.MAX_PAIRED_USERS) {
            return this.bot.sendMessage(chatId, "⚠️ *Pairing Limit Reached!*\n\nSorry, we cannot accept new bot pairings at this time. Please try again later.", { parse_mode: "Markdown" });
        }
        if (!whatsappNumber) {
            return this.bot.sendMessage(chatId, "Numéro invalide.\n*Exemple :* `2349012345678`", { parse_mode: "Markdown" });
        }

        try {
            this.bot.sendMessage(chatId, "🔄 Requesting pairing code... Please wait.");
            const code = await this.whatsAppManager.pair(userId, whatsappNumber);
            if (code) {
                this.bot.sendMessage(chatId, `✅ *Your Pairing Code Is Ready!*

Please go to WhatsApp on your phone:
1. Tap *Settings* > *Linked Devices* > *Link a device*.
2. Choose *Link with phone number instead*.
3. Enter the following code: \`${code}\`

The code is valid for a short time.`, { parse_mode: "Markdown" });
            } else {
                this.bot.sendMessage(chatId, "✅ Bot is already paired and is now connecting. You will be notified when it's online.");
            }
        } catch (error) {
            this.bot.sendMessage(chatId, `❌ *Pairing Failed:*\n${error.message}`);
        }
    }

    async handleDelpair(chatId, userId) {
        try {
            await this.whatsAppManager.logout(userId);
            this.bot.sendMessage(chatId, "✅ Successfully unpaired your bot and deleted the session.");
        } catch (error) {
            this.bot.sendMessage(chatId, `❌ *Unpairing Failed:*\n${error.message}`);
        }
    }

    async handleStop(chatId, userId) {
        const stopped = await this.whatsAppManager.stopSession(userId);
        this.bot.sendMessage(chatId, stopped
            ? "⏸️ Session WhatsApp arrêtée. Ton pairing reste actif — appuie sur ▶️ Reprendre pour la relancer."
            : "ℹ️ Aucune session active à arrêter.");
    }

    async handleResume(chatId, userId) {
        try {
            this.bot.sendMessage(chatId, "🔄 Reprise de la session...");
            await this.whatsAppManager.startStoppedSession(userId);
            this.bot.sendMessage(chatId, "✅ Session relancée.");
        } catch (error) {
            this.bot.sendMessage(chatId, `❌ Échec :\n${error.message}`);
        }
    }

    async handleRestart(chatId, userId) {
        try {
            this.bot.sendMessage(chatId, "🔄 Redémarrage de la session...");
            await this.whatsAppManager.restartSession(userId);
            this.bot.sendMessage(chatId, "✅ Session redémarrée.");
        } catch (error) {
            this.bot.sendMessage(chatId, `❌ Échec :\n${error.message}`);
        }
    }

    async handleListpair(chatId) {
        const list = this.whatsAppManager.listPairs();
        this.bot.sendMessage(chatId, list, { parse_mode: "Markdown" });
    }

    async handleBroadcast(chatId, message) {
        if (!message) {
            return this.bot.sendMessage(chatId, "Message vide, rien à diffuser.");
        }
        this.bot.sendMessage(chatId, "📢 Broadcasting message to all paired bots... Please wait.");
        const result = await this.whatsAppManager.broadcast(message);
        this.bot.sendMessage(chatId, result, { parse_mode: "Markdown" });
    }

    async handleSetphoto(chatId, photoMsg) {
        try {
            await this.bot.sendMessage(chatId, "🔄 Mise à jour de la photo de profil...");

            const fileId = photoMsg.photo[photoMsg.photo.length - 1].file_id;
            const file = await this.bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

            const imageResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(imageResponse.data);

            const form = new FormData();
            form.append('photo', JSON.stringify({ type: 'static', photo: 'attach://newphoto' }));
            form.append('newphoto', imageBuffer, { filename: 'profile.jpg', contentType: 'image/jpeg' });

            await axios.post(
                `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/setMyProfilePhoto`,
                form,
                { headers: form.getHeaders() }
            );

            const localPath = path.join(__dirname, 'media', 'zero_profile.jpg');
            await fs.writeFile(localPath, imageBuffer);

            this.bot.sendMessage(chatId, "✅ Photo de profil Telegram mise à jour !");
        } catch (error) {
            console.error("setMyProfilePhoto error:", error.response?.data || error.message);
            const detail = error.response?.data?.description || error.message;
            this.bot.sendMessage(chatId, `❌ Échec de la mise à jour :\n${detail}`);
        }
    }

    // ═══════════════════════════════════════
    // LISTENERS
    // ═══════════════════════════════════════

    setupListeners() {
        this.bot.onText(/\/start/, async (msg) => {
            if (!await this.checkMembership(msg.chat.id, msg.from.id)) return;
            await this.sendMenu(msg.chat.id, msg.from);
        });

        this.bot.onText(/\/menu/, async (msg) => {
            if (!await this.checkMembership(msg.chat.id, msg.from.id)) return;
            await this.sendMenu(msg.chat.id, msg.from);
        });

        // --- Commandes texte (toujours disponibles) ---
        this.bot.onText(/\/pair (.+)/, async (msg, match) => {
            if (!await this.checkMembership(msg.chat.id, msg.from.id)) return;
            await this.handlePair(msg.chat.id, msg.from.id, match[1]);
        });

        this.bot.onText(/\/delpair/, async (msg) => {
            if (!await this.checkMembership(msg.chat.id, msg.from.id)) return;
            await this.handleDelpair(msg.chat.id, msg.from.id);
        });

        this.bot.onText(/\/stop$/, async (msg) => {
            if (!await this.checkMembership(msg.chat.id, msg.from.id)) return;
            await this.handleStop(msg.chat.id, msg.from.id);
        });

        this.bot.onText(/\/resume$/, async (msg) => {
            if (!await this.checkMembership(msg.chat.id, msg.from.id)) return;
            await this.handleResume(msg.chat.id, msg.from.id);
        });

        this.bot.onText(/\/restart$/, async (msg) => {
            if (!await this.checkMembership(msg.chat.id, msg.from.id)) return;
            await this.handleRestart(msg.chat.id, msg.from.id);
        });

        this.bot.onText(/\/listpair/, async (msg) => {
            if (String(msg.from.id) !== this.ownerId) return;
            await this.handleListpair(msg.chat.id);
        });

        this.bot.onText(/\/broadcast (.+)/, async (msg, match) => {
            if (String(msg.from.id) !== this.ownerId) return;
            await this.handleBroadcast(msg.chat.id, match[1]);
        });

        this.bot.onText(/\/setphoto/, async (msg) => {
            if (String(msg.from.id) !== this.ownerId) return;
            const photoMsg = msg.photo ? msg : (msg.reply_to_message?.photo ? msg.reply_to_message : null);
            if (!photoMsg) {
                return this.bot.sendMessage(msg.chat.id, "📸 Envoie une photo avec la légende /setphoto, ou réponds à une photo avec /setphoto.");
            }
            await this.handleSetphoto(msg.chat.id, photoMsg);
        });

        // --- Boutons cliquables ---
        this.bot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const userId = query.from.id;
            const data = query.data;
            const isOwner = String(userId) === this.ownerId;

            this.bot.answerCallbackQuery(query.id).catch(() => {});

            if (!await this.checkMembership(chatId, userId)) return;

            switch (data) {
                case 'pair':
                    this.pendingAction.set(chatId, { type: 'pair', userId });
                    this.bot.sendMessage(chatId, "📱 Envoie ton numéro WhatsApp (avec l'indicatif pays, sans le +).\nExemple : `2349012345678`", { parse_mode: "Markdown" });
                    break;
                case 'delpair':
                    await this.handleDelpair(chatId, userId);
                    break;
                case 'stop':
                    await this.handleStop(chatId, userId);
                    break;
                case 'resume':
                    await this.handleResume(chatId, userId);
                    break;
                case 'restart':
                    await this.handleRestart(chatId, userId);
                    break;
                case 'listpair':
                    if (!isOwner) return;
                    await this.handleListpair(chatId);
                    break;
                case 'broadcast':
                    if (!isOwner) return;
                    this.pendingAction.set(chatId, { type: 'broadcast', userId });
                    this.bot.sendMessage(chatId, "📢 Envoie le message à diffuser à tous les utilisateurs pairés.");
                    break;
                case 'setphoto':
                    if (!isOwner) return;
                    this.pendingAction.set(chatId, { type: 'setphoto', userId });
                    this.bot.sendMessage(chatId, "📸 Envoie la nouvelle photo de profil.");
                    break;
            }
        });

        // --- Suite d'une action lancée par bouton (numéro / message / photo attendus) ---
        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const pending = this.pendingAction.get(chatId);
            if (!pending) return;

            if (msg.text && msg.text.startsWith('/')) {
                this.pendingAction.delete(chatId);
                return; // l'utilisateur a tapé une autre commande, on annule l'attente
            }

            this.pendingAction.delete(chatId);

            if (pending.type === 'pair') {
                await this.handlePair(chatId, pending.userId, msg.text);
            } else if (pending.type === 'broadcast' && String(pending.userId) === this.ownerId) {
                await this.handleBroadcast(chatId, msg.text);
            } else if (pending.type === 'setphoto' && String(pending.userId) === this.ownerId) {
                if (!msg.photo) {
                    this.bot.sendMessage(chatId, "⚠️ Ce n'est pas une photo — réessaie via le bouton 🖼️ Photo du bot.");
                    return;
                }
                await this.handleSetphoto(chatId, msg);
            }
        });
    }
}

module.exports = TelegramBotController;
