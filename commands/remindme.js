/**
 * .remindme — Rappel programmé
 */
const reminders = new Map();
function parseTime(str) {
  const match = str.match(/^(\d+)(s|m|h)$/i);
  if (!match) return null;
  const val  = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 's') return val * 1000;
  if (unit === 'm') return val * 60 * 1000;
  if (unit === 'h') return val * 3600 * 1000;
  return null;
}
module.exports = {
  name: 'remindme',
  description: 'Créer un rappel temporisé',
  usage: '.remindme [temps: 10m/2h/30s] [message]',
  category: 'util',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName, sender } = ctx;
    if (!args[0] || !args[1]) {
      await antiBan.safeSend(sock, jid, {
        text: '⏰ *RAPPEL*\n\nUsage : .remindme [temps] [message]\nEx : .remindme 10m Réunion importante\nEx : .remindme 2h Appeler maman',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const delay = parseTime(args[0]);
    if (!delay || delay > 24 * 3600 * 1000) {
      await antiBan.safeSend(sock, jid, { text: '❌ Temps invalide. Ex: 30s, 10m, 2h (max 24h)' }, { msgOptions: { quoted: msg } });
      return;
    }
    const reminder = args.slice(1).join(' ');
    const when     = new Date(Date.now() + delay);
    const whenStr  = when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    await antiBan.safeSend(sock, jid, {
      text: `✅ Rappel enregistré !\n\n⏰ Dans ${args[0]} (à ~${whenStr})\n📝 Message : ${reminder}\n\n> Je t'enverrai un message à ce moment-là.`,
    }, { msgOptions: { quoted: msg } });
    setTimeout(async () => {
      try {
        await sock.sendMessage(jid, {
          text: `⏰ *RAPPEL !*\n\n@${sender.split('@')[0]}, tu voulais te souvenir de :\n\n"${reminder}"\n\n> ZERO TRACE BOT v5.0`,
          mentions: [sender],
        });
      } catch (e) {}
    }, delay);
  },
};
