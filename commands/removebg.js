/**
 * ZERO TRACE BOT v5.0 — .removebg v3
 * Supprimer le fond d'une image
 * ✅ downloadMediaMessage (Baileys stable)
 * ✅ Chain : remove.bg (clé) → photoroom.com → bgrem.app → clipdrop
 */
'use strict';
const zts = require('../lib/ztStyle');

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios      = require('axios');
const FormData   = require('form-data');

const BOT_TAG = '> *ZERO TRACE BOT v5.0*';

async function getImageBuffer(sock, msg) {
  const { downloadMedia } = require('../lib/mediaHelper');
  return await downloadMedia(sock, msg, 'image');
}

// ── Provider 1 : remove.bg (clé API) ─────────────────────────────────────────
async function tryRemoveBg(imgBuf) {
  const key = process.env.REMOVEBG_API_KEY;
  if (!key || key.length < 10) return null;
  const form = new FormData();
  form.append('image_file', imgBuf, { filename: 'image.jpg', contentType: 'image/jpeg' });
  form.append('size', 'auto');
  const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
    headers: { 'X-Api-Key': key, ...form.getHeaders() },
    responseType: 'arraybuffer',
    timeout: 30000,
  });
  const buf = Buffer.from(res.data);
  if (buf.length > 1000) return buf;
  return null;
}

// ── Provider 2 : photoroom.com sandbox ───────────────────────────────────────
async function tryPhotoroom(imgBuf) {
  const form = new FormData();
  form.append('image_file', imgBuf, { filename: 'image.jpg', contentType: 'image/jpeg' });
  const res = await axios.post('https://sdk.photoroom.com/v1/segment', form, {
    headers: { ...form.getHeaders() },
    responseType: 'arraybuffer',
    timeout: 25000,
  });
  const buf = Buffer.from(res.data);
  if (buf.length > 1000) return buf;
  return null;
}

// ── Provider 3 : bgrem.app (gratuit, sans clé) ────────────────────────────────
async function tryBgrem(imgBuf) {
  const base64 = imgBuf.toString('base64');
  const res = await axios.post(
    'https://www.bgrem.app/api/remove-background',
    { image: `data:image/jpeg;base64,${base64}` },
    {
      headers: { 'Content-Type': 'application/json', 'Origin': 'https://www.bgrem.app' },
      responseType: 'arraybuffer',
      timeout: 30000,
    }
  );
  const buf = Buffer.from(res.data);
  if (buf.length > 1000) return buf;
  return null;
}

// ── Provider 4 : remove.bg via drexapp (proxy gratuit) ───────────────────────
async function tryDrexapp(imgBuf) {
  const form = new FormData();
  form.append('image', imgBuf, { filename: 'image.jpg', contentType: 'image/jpeg' });
  const res = await axios.post('https://api.drexapp.space/tools/removebg', form, {
    headers: { ...form.getHeaders() },
    responseType: 'arraybuffer',
    timeout: 25000,
  });
  const buf = Buffer.from(res.data);
  if (buf.length > 1000) return buf;
  return null;
}

module.exports = {
  name:    'removebg',
  aliases: ['rmbg', 'nobg', 'transparentbg'],
  usage:   '.removebg (répondre à une image)',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;

    const imgBuf = await getImageBuffer(sock, msg);
    if (!imgBuf) {
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-IMG] ERREUR: Aucune image détectée
Action  : Réponds à une image avec .removebg\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await sock.sendMessage(jid, { react: { text: '🖼️', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-IMG] Suppression d\'arrière-plan...
Providers : remove.bg → Photoroom → Drexapp\`\`\`` }, { msgOptions: { quoted: msg } });

    const providers = [
      { name: 'remove.bg',  fn: () => tryRemoveBg(imgBuf)   },
      { name: 'Photoroom',  fn: () => tryPhotoroom(imgBuf)   },
      { name: 'Drexapp',    fn: () => tryDrexapp(imgBuf)     },
      { name: 'Bgrem',      fn: () => tryBgrem(imgBuf)       },
    ];

    let resultBuf = null;
    let usedProvider = '';

    for (const p of providers) {
      try {
        const buf = await p.fn();
        if (buf) { resultBuf = buf; usedProvider = p.name; break; }
      } catch (e) {
        console.log(`[REMOVEBG] ${p.name} échoué: ${e.message}`);
      }
    }

    if (!resultBuf) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-IMG] ERREUR: Tous les providers ont échoué
Fix      : Ajoute REMOVEBG_API_KEY dans keys.js\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await sock.sendMessage(jid, {
      image: resultBuf,
      caption: `\`\`\`[ZT-IMG] Traitement terminé
Provider : ${usedProvider}
Status   : SUCCESS ✓\`\`\`

> ${zts.sig()}`,
      mimetype: 'image/png',
    }, { quoted: msg });
    await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
  },
};
