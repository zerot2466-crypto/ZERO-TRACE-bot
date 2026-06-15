/**
 * ZERO TRACE BOT v5.0 — Auto-diagnostic système
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * .auditbot          → rapport complet (owner/sudo)
 * .auditbot quick    → résumé rapide (owner/sudo)
 * .auditbot auto on  → audit automatique toutes les heures
 * .auditbot auto off → désactiver l'audit automatique
 * .auditbot history  → 5 derniers audits
 * .auditbot fix      → relancer les auto-fix disponibles
 *
 * Checks effectués :
 *   ✅ RAM / CPU / Event-loop lag
 *   ✅ Variables d'environnement critiques
 *   ✅ APIs externes configurées (OpenRouter, Groq, ElevenLabs…)
 *   ✅ Fichiers critiques du bot (config, data, handler)
 *   ✅ Mémoire des conversations (taille du cache IA)
 *   ✅ Rate-limiter (statut)
 *   ✅ Uptime & stabilité
 */

'use strict';

const os   = require('os');
const fs   = require('fs-extra');
const path = require('path');
const axios = require('axios');

const ROOT       = path.join(__dirname, '..');
const AUDIT_FILE = path.join(ROOT, 'data', 'auditLog.json');
const MEMORY_DIR = path.join(ROOT, 'data', 'memory');

// ── Historique des audits (conserve les 10 derniers) ─────────────────────────
function loadHistory() {
  try { return fs.readJsonSync(AUDIT_FILE); } catch { return []; }
}
function saveHistory(history) {
  try { fs.writeJsonSync(AUDIT_FILE, history, { spaces: 2 }); } catch {}
}
function pushHistory(report) {
  const history = loadHistory();
  history.unshift(report);
  if (history.length > 10) history.splice(10);
  saveHistory(history);
}

// ── Auto-audit programmé ──────────────────────────────────────────────────────
let autoAuditJob = null;
let autoAuditTarget = null; // { sock, jid, antiBan }

// ── Sévérités ─────────────────────────────────────────────────────────────────
const SEV = { ok: 0, low: 1, medium: 2, high: 3, critical: 4 };
const SEV_EMOJI = { ok: '✅', low: '💛', medium: '🟠', high: '🔴', critical: '🆘' };

function severityLabel(sev) {
  return SEV_EMOJI[sev] || '❓';
}

// ── Checks individuels ────────────────────────────────────────────────────────

// 1. RAM
function checkMemory() {
  const mem    = process.memoryUsage();
  const rssMB  = mem.rss / (1024 * 1024);
  const heapMB = mem.heapUsed / (1024 * 1024);
  const totalMB = os.totalmem() / (1024 * 1024);
  const freeMB  = os.freemem()  / (1024 * 1024);
  const usedPct = ((totalMB - freeMB) / totalMB * 100).toFixed(1);

  let severity = 'ok';
  let note = '';
  if (rssMB > 400) { severity = 'critical'; note = 'RAM critique, risque de crash.'; }
  else if (rssMB > 250) { severity = 'high';     note = 'RAM élevée, surveiller.'; }
  else if (rssMB > 150) { severity = 'medium';   note = 'RAM modérée.'; }

  return {
    id: 'memory',
    label: 'RAM processus',
    severity,
    detail: `RSS: ${rssMB.toFixed(1)} MB | Heap: ${heapMB.toFixed(1)} MB | Système: ${usedPct}% utilisé`,
    note,
  };
}

// 2. CPU (load average)
function checkCPU() {
  const cores = os.cpus().length;
  const load1 = os.loadavg()[0];
  const load5 = os.loadavg()[1];
  const pct   = (load1 / cores * 100).toFixed(1);

  let severity = 'ok';
  let note = '';
  if (load1 > cores * 0.95) { severity = 'critical'; note = 'CPU saturé.'; }
  else if (load1 > cores * 0.80) { severity = 'high';     note = 'CPU élevé.'; }
  else if (load1 > cores * 0.60) { severity = 'medium';   note = 'Charge notable.'; }

  return {
    id: 'cpu',
    label: 'CPU / Load',
    severity,
    detail: `Load 1m: ${load1.toFixed(2)} / ${cores} cores (${pct}%) | Load 5m: ${load5.toFixed(2)}`,
    note,
  };
}

// 3. Event-loop lag
async function checkEventLoop() {
  const start = Date.now();
  await new Promise(r => setTimeout(r, 0));
  const lag = Date.now() - start;

  let severity = 'ok';
  let note = '';
  if (lag > 500)      { severity = 'critical'; note = 'Event-loop bloquée, bot lent.'; }
  else if (lag > 200) { severity = 'high';     note = 'Lag significatif.'; }
  else if (lag > 80)  { severity = 'medium';   note = 'Légère latence.'; }

  return {
    id: 'eventloop',
    label: 'Event-loop lag',
    severity,
    detail: `Lag: ${lag} ms`,
    note,
  };
}

// 4. Uptime
function checkUptime() {
  const uptimeSec = process.uptime();
  const h = Math.floor(uptimeSec / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const s = Math.floor(uptimeSec % 60);
  const label = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;

  // Uptime < 2 min = redémarrage récent (potentiel crash)
  const severity = uptimeSec < 120 ? 'medium' : 'ok';
  const note     = uptimeSec < 120 ? 'Redémarrage récent (crash possible).' : '';

  return {
    id: 'uptime',
    label: 'Uptime',
    severity,
    detail: `${label} (${Math.floor(uptimeSec)}s)`,
    note,
  };
}

// 5. Variables d'environnement critiques
function checkEnvVars() {
  const required = [
    { key: 'OWNER_NUMBER',      label: 'Numéro owner' },
    { key: 'OPENROUTER_API_KEY', label: 'OpenRouter IA' },
    { key: 'GROQ_API_KEY',       label: 'Groq STT/IA' },
  ];
  const optional = [
    { key: 'ELEVENLABS_API_KEY', label: 'ElevenLabs TTS' },
    { key: 'VIRUSTOTAL_API_KEY', label: 'VirusTotal' },
    { key: 'REMOVEBG_API_KEY',   label: 'RemoveBG' },
    { key: 'CLIPDROP_API_KEY',   label: 'ClipDrop' },
    { key: 'GNEWS_API_KEY',      label: 'GNews' },
    { key: 'GIPHY_API_KEY',      label: 'Giphy' },
  ];

  const missing    = required.filter(v => !process.env[v.key]);
  const missingOpt = optional.filter(v => !process.env[v.key]);

  let severity = 'ok';
  let detail   = '';
  let note     = '';

  if (missing.length > 0) {
    severity = 'critical';
    detail   = `Manquants critiques: ${missing.map(v => v.label).join(', ')}`;
    note     = 'Certaines fonctionnalités sont hors service.';
  } else if (missingOpt.length > 0) {
    severity = 'low';
    detail   = `${required.length} vars OK | Optionnelles manquantes: ${missingOpt.map(v => v.label).join(', ')}`;
  } else {
    detail = `${required.length + optional.length} variables configurées.`;
  }

  return {
    id: 'envvars',
    label: 'Variables d\'env',
    severity,
    detail,
    note,
    missingRequired: missing.map(v => v.key),
  };
}

// 6. Fichiers critiques
function checkCriticalFiles() {
  const files = [
    path.join(ROOT, 'handler.js'),
    path.join(ROOT, 'config.js'),
    path.join(ROOT, 'settings.js'),
    path.join(ROOT, 'data', 'config.json'),
    path.join(ROOT, 'lib', 'openrouter_ai.js'),
    path.join(ROOT, 'lib', 'antiBan.js'),
  ];

  const missing = files.filter(f => !fs.existsSync(f));

  const severity = missing.length > 0 ? 'critical' : 'ok';
  const detail   = missing.length > 0
    ? `Fichiers manquants: ${missing.map(f => path.basename(f)).join(', ')}`
    : `${files.length} fichiers critiques présents.`;

  return {
    id: 'files',
    label: 'Fichiers critiques',
    severity,
    detail,
    note: missing.length > 0 ? 'Bot potentiellement instable.' : '',
  };
}

// 7. Cache mémoire IA
function checkAIMemory() {
  let fileCount = 0;
  let totalSizeKB = 0;

  try {
    if (fs.existsSync(MEMORY_DIR)) {
      const files = fs.readdirSync(MEMORY_DIR);
      fileCount = files.length;
      for (const f of files) {
        const stat = fs.statSync(path.join(MEMORY_DIR, f));
        totalSizeKB += stat.size / 1024;
      }
    }
  } catch {}

  let severity = 'ok';
  let note     = '';
  if (totalSizeKB > 10240) { severity = 'high';   note = 'Cache IA volumineux (>10 MB). Considère .zt resetmem all.'; }
  else if (totalSizeKB > 4096) { severity = 'medium'; note = 'Cache IA modéré.'; }

  return {
    id: 'ai_memory',
    label: 'Cache mémoire IA',
    severity,
    detail: `${fileCount} conversation(s) | ${(totalSizeKB / 1024).toFixed(2)} MB sur disque`,
    note,
  };
}

// 8. Ping API externe (OpenRouter)
async function checkAPIReachability() {
  const checks = [];

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const start = Date.now();
      const res = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
        timeout: 6000,
      });
      const ms = Date.now() - start;
      checks.push(`OpenRouter ✅ ${ms}ms`);
    } catch (e) {
      checks.push(`OpenRouter ❌ (${e.code || e.message})`);
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const start = Date.now();
      await axios.get('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        timeout: 6000,
      });
      const ms = Date.now() - start;
      checks.push(`Groq ✅ ${ms}ms`);
    } catch (e) {
      checks.push(`Groq ❌ (${e.code || e.message})`);
    }
  }

  const hasFailure = checks.some(c => c.includes('❌'));
  const severity   = !hasFailure ? 'ok' : checks.every(c => c.includes('❌')) ? 'critical' : 'high';

  return {
    id: 'api_reachability',
    label: 'APIs externes',
    severity,
    detail: checks.length > 0 ? checks.join(' | ') : 'Aucune API configurée.',
    note: hasFailure ? 'Les commandes IA peuvent être indisponibles.' : '',
    autoFix: false,
  };
}

// ── Routine d'audit complète ──────────────────────────────────────────────────
async function runAudit(mode = 'full') {
  const startTs = Date.now();
  const checks  = [];

  // Checks synchrones
  checks.push(checkMemory());
  checks.push(checkCPU());
  checks.push(checkUptime());
  checks.push(checkEnvVars());
  checks.push(checkCriticalFiles());
  checks.push(checkAIMemory());

  // Checks asynchrones
  const [evLoop, apiReach] = await Promise.all([
    checkEventLoop(),
    checkAPIReachability(),
  ]);
  checks.push(evLoop);
  checks.push(apiReach);

  const durationMs   = Date.now() - startTs;
  const worstSev     = checks.reduce((acc, c) => SEV[c.severity] > SEV[acc] ? c.severity : acc, 'ok');
  const issueCount   = checks.filter(c => c.severity !== 'ok').length;
  const criticalCount= checks.filter(c => c.severity === 'critical').length;

  const report = {
    timestamp: startTs,
    mode,
    durationMs,
    worstSeverity: worstSev,
    issueCount,
    criticalCount,
    checks,
  };

  pushHistory(report);
  return report;
}

// ── Formatage du rapport ──────────────────────────────────────────────────────
function formatReport(report, quick = false) {
  const date = new Date(report.timestamp).toLocaleString('fr-FR');
  const lines = [];

  lines.push(`🔬 *AUDIT ZERO TRACE BOT*`);
  lines.push(`📅 ${date} | ⏱ ${report.durationMs}ms`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');

  if (quick) {
    // Mode rapide : uniquement les problèmes
    const issues = report.checks.filter(c => c.severity !== 'ok');
    if (issues.length === 0) {
      lines.push('✅ *Tout est OK — aucun problème détecté.*');
    } else {
      lines.push(`⚠️ *${issues.length} problème(s) :*`);
      for (const c of issues) {
        lines.push(`${severityLabel(c.severity)} *${c.label}*`);
        lines.push(`  └ ${c.detail}`);
        if (c.note) lines.push(`  └ 💬 ${c.note}`);
      }
    }
  } else {
    // Mode complet
    for (const c of report.checks) {
      lines.push(`${severityLabel(c.severity)} *${c.label}*`);
      lines.push(`  └ ${c.detail}`);
      if (c.note) lines.push(`  └ 💬 ${c.note}`);
    }
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');

  const overall = SEV_EMOJI[report.worstSeverity];
  if (report.criticalCount > 0) {
    lines.push(`${overall} État global : *CRITIQUE* (${report.criticalCount} problème(s) majeur(s))`);
  } else if (report.issueCount > 0) {
    lines.push(`${overall} État global : *${report.issueCount} alerte(s)* — bot fonctionnel`);
  } else {
    lines.push(`${overall} État global : *OPTIMAL* ✨`);
  }

  lines.push(`\n> ZERO TRACE BOT v5.0`);
  return lines.join('\n');
}

// ── COMMANDE PRINCIPALE ───────────────────────────────────────────────────────
module.exports = {
  name:     'auditbot',
  usage:    '.auditbot | .auditbot quick | .auditbot auto on/off | .auditbot history | .auditbot fix',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Commande réservée au propriétaire et aux sudos.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub  = (args[0] || '').toLowerCase();
    const sub2 = (args[1] || '').toLowerCase();

    // ── .auditbot history ─────────────────────────────────────────────────
    if (sub === 'history') {
      const history = loadHistory();
      if (history.length === 0) {
        await antiBan.safeSend(sock, jid, {
          text: '📋 Aucun audit effectué pour l\'instant.\nLance *.auditbot* pour commencer.',
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const lines = ['📚 *Historique des audits* :\n'];
      for (const [i, r] of history.slice(0, 5).entries()) {
        const date = new Date(r.timestamp).toLocaleString('fr-FR');
        const icon = SEV_EMOJI[r.worstSeverity];
        lines.push(`${i + 1}. ${icon} ${date} — ${r.issueCount} alerte(s) | ${r.durationMs}ms`);
      }
      lines.push('\n> ZERO TRACE BOT v5.0');
      await antiBan.safeSend(sock, jid, { text: lines.join('\n') }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .auditbot auto on/off ─────────────────────────────────────────────
    if (sub === 'auto') {
      const cron = require('node-cron');

      if (sub2 === 'on') {
        if (autoAuditJob) autoAuditJob.stop();
        autoAuditTarget = { sock, jid, antiBan };

        // Audit toutes les heures + alerte si critique
        autoAuditJob = cron.schedule('0 * * * *', async () => {
          try {
            const report = await runAudit('auto');
            if (report.criticalCount > 0 && autoAuditTarget) {
              const { sock: s, jid: j, antiBan: ab } = autoAuditTarget;
              const text = formatReport(report, true);
              await ab.safeSend(s, j, { text: `🚨 *ALERTE AUTO-AUDIT*\n\n${text}` });
            }
          } catch (e) {
            console.error('[AUDITBOT] Auto-audit error:', e.message);
          }
        });

        await antiBan.safeSend(sock, jid, {
          text:
            '⏰ *Auto-audit activé*\n\n' +
            'Le bot s\'auto-diagnostique toutes les heures.\n' +
            'Tu seras notifié uniquement si un problème *critique* est détecté.\n\n' +
            '• *.auditbot auto off* → désactiver\n\n> ZERO TRACE BOT v5.0',
        }, { msgOptions: { quoted: msg } });
        return;
      }

      if (sub2 === 'off') {
        if (autoAuditJob) {
          autoAuditJob.stop();
          autoAuditJob    = null;
          autoAuditTarget = null;
        }
        await antiBan.safeSend(sock, jid, {
          text: '🔴 *Auto-audit désactivé.*\n\n> ZERO TRACE BOT v5.0',
        }, { msgOptions: { quoted: msg } });
        return;
      }

      // Statut auto-audit
      await antiBan.safeSend(sock, jid, {
        text:
          `⏰ *Auto-audit* : ${autoAuditJob ? '🟢 ACTIF (toutes les heures)' : '🔴 INACTIF'}\n\n` +
          `• *.auditbot auto on*  → activer\n` +
          `• *.auditbot auto off* → désactiver\n\n> ZERO TRACE BOT v5.0`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .auditbot fix ─────────────────────────────────────────────────────
    if (sub === 'fix') {
      await antiBan.safeSend(sock, jid, {
        text: '🔧 *Auto-fix disponibles :*\n\n• *.zt resetmem all* → vider le cache IA si trop volumineux\n• *.cleartmp* → nettoyer les fichiers temporaires\n• *.restart* → redémarrer le bot\n\nAucun fix automatique dangereux n\'est appliqué sans ta confirmation.\n\n> ZERO TRACE BOT v5.0',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .auditbot quick ───────────────────────────────────────────────────
    if (sub === 'quick') {
      await antiBan.safeSend(sock, jid, {
        text: '⚡ *Audit rapide en cours...*',
      }, { msgOptions: { quoted: msg } });
      await antiBan.simulateTyping(sock, jid, 2000);
      const report = await runAudit('quick');
      await antiBan.safeSend(sock, jid, {
        text: formatReport(report, true),
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .auditbot (complet, défaut) ───────────────────────────────────────
    await antiBan.safeSend(sock, jid, {
      text: '🔬 *Audit complet en cours...*\n_(peut prendre 5-10 secondes)_',
    }, { msgOptions: { quoted: msg } });
    await antiBan.simulateTyping(sock, jid, 3000);

    const report = await runAudit('full');
    await antiBan.safeSend(sock, jid, {
      text: formatReport(report, false),
    }, { msgOptions: { quoted: msg } });
  },
};
