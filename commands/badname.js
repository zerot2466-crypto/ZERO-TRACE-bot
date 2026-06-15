/**
 * ZERO TRACE BOT v5.0 — .badname
 * Kick auto les membres avec un nom interdit dans le groupe
 */
'use strict';
const fs   = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'badname.json');
function load() { try { return fs.readJsonSync(DATA_FILE); } catch { return {}; } }
function save(d) { fs.ensureDirSync(path.dirname(DATA_FILE)); fs.writeJsonSync(DATA_FILE, d, { spaces: 2 }); }

module.exports = {
  name: 'badname',
  description: 'Kick auto les membres dont le nom contient un mot interdit',
  usage: '.badname on | .badname off | .badname add [mot] | .badname del [mot] | .badname list',
  category: 'admin',

  // Vérifie un nouveau membre (appelable depuis handler)
  async checkNewMember(sock, jid, participant, pushName, data) {
    if (!data[jid]?.active || !data[jid]?.words?.length) return false;
    const name = (pushName || participant || '').toLowerCase();
    const bad  = data[jid].words.find(w => name.includes(w.toLowerCase()));
    if (bad) {
      try {
        await sock.groupParticipantsUpdate(jid, [participant], 'remove');
        await sock.sendMessage(jid, { text: `🚫 *BADNAME* : @${participant.split('@')[0]} a été kické car son nom contient un mot interdit (*${bad}*).`, mentions: [participant] });
        return true;
      } catch {}
    }
    return false;
  },

  loadData: load,

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isGroup, isSudo, pushName} = ctx;
    if (!isGroup) { await antiBan.safeSend(sock, jid, { text: '❌ Groupes uniquement.' }, { msgOptions: { quoted: msg } }); return; }
    if (!isSudo)  { await antiBan.safeSend(sock, jid, { text: '❌ Admins uniquement.' }, { msgOptions: { quoted: msg } }); return; }

    const data = load();
    if (!data[jid]) data[jid] = { active: false, words: [] };
    const sub  = args[0]?.toLowerCase();

    if (sub === 'on')  { data[jid].active = true;  save(data); await antiBan.safeSend(sock, jid, { text: '✅ *Badname activé.* Les membres avec un nom interdit seront kickés.' }, { msgOptions: { quoted: msg } }); return; }
    if (sub === 'off') { data[jid].active = false; save(data); await antiBan.safeSend(sock, jid, { text: '🔴 *Badname désactivé.*' }, { msgOptions: { quoted: msg } }); return; }

    if (sub === 'add') {
      const mot = args[1];
      if (!mot) { await antiBan.safeSend(sock, jid, { text: '❌ Usage : .badname add [mot]' }, { msgOptions: { quoted: msg } }); return; }
      if (data[jid].words.includes(mot.toLowerCase())) { await antiBan.safeSend(sock, jid, { text: '⚠️ Ce mot est déjà dans la liste.' }, { msgOptions: { quoted: msg } }); return; }
      data[jid].words.push(mot.toLowerCase()); save(data);
      await antiBan.safeSend(sock, jid, { text: `✅ Mot *${mot}* ajouté à la liste badname.` }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'del' || sub === 'remove') {
      const mot = args[1]?.toLowerCase();
      data[jid].words = data[jid].words.filter(w => w !== mot); save(data);
      await antiBan.safeSend(sock, jid, { text: `🗑️ Mot *${mot}* retiré.` }, { msgOptions: { quoted: msg } });
      return;
    }

    // list
    const words = data[jid].words;
    const status = data[jid].active ? '🟢 Actif' : '🔴 Inactif';
    await antiBan.safeSend(sock, jid, {
      text: `🚫 *BADNAME*\nStatut : ${status}\n\n${words.length ? `Mots interdits :\n${words.map(w => `• ${w}`).join('\n')}` : 'Aucun mot interdit ajouté.'}\n\nCommandes :\n.badname on/off\n.badname add [mot]\n.badname del [mot]`,
    }, { msgOptions: { quoted: msg } });
  },
};
