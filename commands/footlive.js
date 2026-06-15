// commands/footlive.js
// @cat: sport
// @desc: Suivi football en temps réel — ZERO TRACE 💀 v2

'use strict';

const axios = require('axios');

// ── Config ────────────────────────────────────────────────────────────────────
const API_KEY  = process.env.APIFOOTBALL_KEY || '';
const API_BASE = 'https://v3.football.api-sports.io';
const MAX_LEN  = 3800; // limite sécurisée WhatsApp

// ── Helpers visuels ───────────────────────────────────────────────────────────
const SEP    = () => '━━━━━━━━━━━━━━━━━━━━';
const header = (t) => `${SEP()}\n💀 *ZERO TRACE v5*\n${SEP()}\n⚽ *${t.toUpperCase()}*\n${SEP()}`;
const footer = ()  => `${SEP()}\n> *ZERO TRACE 💀 v5.0*`;

// ── API ───────────────────────────────────────────────────────────────────────
async function apiGet(endpoint, params = {}) {
  if (!API_KEY) return null;
  try {
    const res = await axios.get(`${API_BASE}${endpoint}`, {
      headers: { 'x-apisports-key': API_KEY },
      params,
      timeout: 10000,
    });
    return res.data?.response ?? null;
  } catch { return null; }
}

// ── Dates ─────────────────────────────────────────────────────────────────────
function todayDate()        { return new Date().toISOString().split('T')[0]; }
function offsetDate(days)   { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]; }
function currentSeason()    { const y = new Date().getFullYear(); return new Date().getMonth() >= 6 ? y : y - 1; }

// ── Formatage statut ──────────────────────────────────────────────────────────
function fmtStatus(s) {
  const map = {
    'NS':'🕐 À venir','TBD':'🕐 TBD','1H':'🟢 1ère MT','HT':'⏸ Mi-temps',
    '2H':'🟢 2ème MT','ET':'🟠 Prolong.','BT':'⏸ Pause Prol.','P':'🎯 TAB',
    'SUSP':'⚠️ Suspendu','INT':'⏸ Interrompu','FT':'✅ Terminé',
    'AET':'✅ Fin Prol.','PEN':'✅ Fin TAB','PST':'📅 Reporté',
    'CANC':'❌ Annulé','ABD':'🚫 Abandonné','AWD':'🏆 Forfait','LIVE':'🔴 En direct',
  };
  return map[s] || s;
}

// ── Formatage match (compact) ─────────────────────────────────────────────────
function fmtMatch(m, showVenue = false) {
  const home = m.teams.home.name;
  const away = m.teams.away.name;
  const hg   = m.goals?.home ?? '-';
  const ag   = m.goals?.away ?? '-';
  const st   = m.fixture.status.short;
  const min  = m.fixture.status.elapsed ? ` ${m.fixture.status.elapsed}'` : '';
  const stLabel = fmtStatus(st);

  let line;
  if (st === 'NS' || st === 'TBD') {
    const t = new Date(m.fixture.date).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', timeZone:'Africa/Kinshasa' });
    line = `• *${home}* 🆚 *${away}*\n  ${stLabel} — ${t}`;
  } else {
    const live = ['1H','2H','ET','P','LIVE'].includes(st) ? '🔴 ' : '';
    line = `• *${home}* ${hg}–${ag} *${away}*\n  ${live}${stLabel}${min}`;
  }

  if (showVenue && m.fixture.venue?.name) {
    line += `\n  🏟 ${m.fixture.venue.name}`;
  }
  return line;
}

// ── Grouper par ligue ─────────────────────────────────────────────────────────
function groupByLeague(matches) {
  const g = {};
  for (const m of matches) {
    const key = `${m.league.flag || '🏆'} *${m.league.name}* — ${m.league.country}`;
    if (!g[key]) g[key] = [];
    g[key].push(m);
  }
  return g;
}

// ── Tronquer si trop long ─────────────────────────────────────────────────────
function truncate(txt) {
  if (txt.length <= MAX_LEN) return txt;
  return txt.slice(0, MAX_LEN) + '\n\n_[Message tronqué — trop de matchs]_\n\n' + footer();
}

// ── IDs ligues ────────────────────────────────────────────────────────────────
const LEAGUES = {
  // Europe top 5
  'premier league': 39, 'laliga': 140, 'la liga': 140,
  'serie a': 71, 'bundesliga': 78, 'ligue 1': 61,
  // Coupes Europe
  'champions league': 2, 'ligue des champions': 2, 'ucl': 2,
  'europa league': 3, 'ligue europa': 3, 'uel': 3,
  'conference league': 848, 'uecl': 848,
  // Autres Europe
  'ligue 2': 62, 'championship': 40, 'serie b': 72,
  'eredivisie': 88, 'primera liga': 94, 'liga portugal': 94,
  'jupiler pro': 144, 'super lig': 203,
  // Monde
  'coupe du monde': 1, 'world cup': 1,
  'euro': 4, 'copa america': 9,
  'mls': 253, 'brasileirao': 71,
  // Afrique 🌍
  'can': 6, 'afcon': 6, 'coupe dafrique': 6,
  'caf champions league': 12, 'caf cl': 12,
  'caf confederation cup': 13, 'caf cc': 13,
  'chan': 7, 'wafu': 686, 'cosafa': 690,
  'liga moçambique': 715, 'liga zambia': 760,
  'botola pro': 200, 'botola': 200,
  'ligue 1 senegal': 292, 'senegal ligue 1': 292,
  'premier league nigeria': 332, 'npfl': 332,
  'premier league ghana': 172, 'ghana pl': 172,
  'premier league kenya': 695, 'kpl': 695,
  'premier league cameroun': 147, 'elite one': 147,
  'premier league cote divoire': 176, 'mtn ligue1': 176,
  'premier league mali': 262, 'mali ligue': 262,
  'premier league egypte': 233, 'egyptian pl': 233,
  'premier league maroc': 200, 'botola 2': 201,
  'premier league algerie': 188, 'ligue pro': 188,
  'premier league tunisie': 295, 'ligue 1 tunisie': 295,
  'premier league afrique du sud': 288, 'psl': 288,
  'premier league angola': 131, 'girabola': 131,
  'premier league congo': 162, 'linafoot': 162,
  'premier league tanzanie': 714, 'tanzania pl': 714,
  'premier league ouganda': 310, 'startime pl': 310,
  'premier league zambie': 760, 'super league zambie': 760,
};

// ── MODULE ────────────────────────────────────────────────────────────────────
module.exports = {
  name:     'footlive',
  aliases:  ['foot', 'football', 'flive', 'soccer'],
  usage:    '.footlive help',
  category: 'sport',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    const send = async (text) =>
      antiBan.safeSend(sock, jid, { text: truncate(text) }, { msgOptions: { quoted: msg } });

    const sub   = (args[0] || '').toLowerCase();
    const query = args.slice(1).join(' ').trim().toLowerCase();

    // ── Vérif clé API ────────────────────────────────────────────────────────
    if (!API_KEY) {
      await send(
        `${header('⚙️ configuration requise')}\n\n` +
        `❌ *Clé API manquante !*\n\n` +
        `Pour utiliser *.footlive*, tu dois ajouter une clé API dans ton *.env* :\n\n` +
        `\`APIFOOTBALL_KEY=ta_clé_ici\`\n\n` +
        `🔗 Obtiens ta clé gratuite sur :\n*https://www.api-football.com*\n\n` +
        `_(Plan gratuit = 100 requêtes/jour)_\n\n` +
        `${footer()}`
      );
      return;
    }

    // ── HELP ─────────────────────────────────────────────────────────────────
    if (!sub || sub === 'help' || sub === 'aide') {
      await send(
        `${header('foot live — aide')}\n\n` +
        `⚽ *MATCHS*\n` +
        `• *.footlive live*           — Matchs en direct 🔴\n` +
        `• *.footlive aujourd'hui*    — Programme du jour\n` +
        `• *.footlive demain*         — Programme de demain\n` +
        `• *.footlive hier*           — Résultats d'hier\n\n` +
        `🔍 *RECHERCHE*\n` +
        `• *.footlive score [équipe]* — Score en temps réel\n` +
        `• *.footlive equipe [nom]*   — Stats + matchs d'une équipe\n` +
        `• *.footlive prochain [équipe]* — Prochain match\n` +
        `• *.footlive ligue [nom]*    — Matchs d'une compétition\n\n` +
        `🏆 *CLASSEMENTS & STATS*\n` +
        `• *.footlive classement [ligue]* — Tableau complet\n` +
        `• *.footlive buteurs [ligue]*    — Top buteurs\n` +
        `• *.footlive assisteurs [ligue]* — Top passeurs\n\n` +
        `📋 *LISTES*\n` +
        `• *.footlive leagues*        — Toutes les ligues\n` +
        `• *.footlive afrique*        — Ligues africaines 🌍\n\n` +
        `💡 *EXEMPLES*\n` +
        `• *.footlive score psg*\n` +
        `• *.footlive equipe arsenal*\n` +
        `• *.footlive classement premier league*\n` +
        `• *.footlive buteurs ligue 1*\n\n` +
        `${footer()}`
      );
      return;
    }

    // ── LISTE LIGUES ─────────────────────────────────────────────────────────
    if (sub === 'leagues' || sub === 'compet') {
      const list = [...new Set(Object.keys(LEAGUES))]
        .filter(k => !['ucl','uel','uecl','laliga','npfl','kpl','psl','caf cl','caf cc'].includes(k))
        .map(l => `• ${l.charAt(0).toUpperCase() + l.slice(1)}`)
        .join('\n');
      await send(`${header('ligues disponibles')}\n\n${list}\n\n💡 *.footlive ligue [nom]*\n\n${footer()}`);
      return;
    }

    // ── LIGUES AFRICAINES ────────────────────────────────────────────────────
    if (sub === 'afrique' || sub === 'africa') {
      const afriqueKeys = [
        'can','chan','caf champions league','caf confederation cup',
        'botola pro','ligue 1 senegal','premier league nigeria',
        'premier league ghana','premier league cameroun',
        'premier league cote divoire','premier league egypte',
        'premier league maroc','premier league algerie',
        'premier league tunisie','premier league afrique du sud',
        'premier league congo','premier league zambie','premier league tanzanie',
        'wafu','cosafa',
      ];
      const list = afriqueKeys.map(l => `• ${l.charAt(0).toUpperCase() + l.slice(1)}`).join('\n');
      await send(`${header('ligues africaines 🌍')}\n\n${list}\n\n💡 *.footlive ligue [nom]*\n\n${footer()}`);
      return;
    }

    // ── MATCHS EN DIRECT ─────────────────────────────────────────────────────
    if (sub === 'live' || sub === 'direct') {
      await send('🔄 _Récupération des matchs en direct..._');
      const data = await apiGet('/fixtures', { live: 'all' });

      if (!data?.length) {
        await send(`${header('matchs en direct 🔴')}\n\n😴 Aucun match en direct actuellement.\n\n💡 Essaie *.footlive aujourd'hui* pour le programme du jour.\n\n${footer()}`);
        return;
      }

      const grouped = groupByLeague(data);
      let txt = `${header(`🔴 en direct — ${data.length} matchs`)}\n\n`;
      for (const [lg, ms] of Object.entries(grouped)) {
        txt += `${lg}\n${ms.map(m => fmtMatch(m)).join('\n')}\n\n`;
      }
      txt += footer();
      await send(txt);
      return;
    }

    // ── PROGRAMME JOUR ───────────────────────────────────────────────────────
    if (["aujourd'hui", 'aujourdhui', 'today', 'demain', 'tomorrow', 'hier', 'yesterday'].includes(sub)) {
      let date  = todayDate();
      let label = "aujourd'hui";
      if (['demain','tomorrow'].includes(sub))     { date = offsetDate(1);  label = 'demain'; }
      else if (['hier','yesterday'].includes(sub)) { date = offsetDate(-1); label = 'hier';   }

      await send(`🔄 _Chargement des matchs de **${label}**..._`);
      const data = await apiGet('/fixtures', { date });

      if (!data?.length) {
        await send(`${header(`matchs de ${label}`)}\n\n😴 Aucun match trouvé pour le *${date}*.\n\n${footer()}`);
        return;
      }

      const grouped = groupByLeague(data);
      let txt = `${header(`⚽ ${label} — ${date}`)}\n📊 *${data.length} matchs*\n\n`;
      for (const [lg, ms] of Object.entries(grouped)) {
        txt += `${lg}\n${ms.map(m => fmtMatch(m)).join('\n')}\n\n`;
      }
      txt += footer();
      await send(txt);
      return;
    }

    // ── SCORE D'UNE ÉQUIPE ───────────────────────────────────────────────────
    if (sub === 'score') {
      if (!query) { await send('❌ Usage : *.footlive score [équipe]*\nEx : *.footlive score psg*'); return; }
      await send(`🔄 _Recherche du score de **${query}**..._`);

      let matches = [];

      // 1) Live
      let data = await apiGet('/fixtures', { live: 'all' });
      matches = (data || []).filter(m =>
        m.teams.home.name.toLowerCase().includes(query) ||
        m.teams.away.name.toLowerCase().includes(query)
      );

      // 2) Aujourd'hui
      if (!matches.length) {
        data = await apiGet('/fixtures', { date: todayDate() });
        matches = (data || []).filter(m =>
          m.teams.home.name.toLowerCase().includes(query) ||
          m.teams.away.name.toLowerCase().includes(query)
        );
      }

      // 3) Derniers matchs via recherche équipe
      if (!matches.length) {
        const teams = await apiGet('/teams', { search: query });
        if (teams?.length) {
          const last = await apiGet('/fixtures', { team: teams[0].team.id, last: 3 });
          matches = last || [];
        }
      }

      if (!matches.length) {
        await send(`${header(`score — ${query}`)}\n\n😴 Aucun match trouvé pour *${query}*.\n\n${footer()}`);
        return;
      }

      let txt = `${header(`⚽ score — ${query}`)}\n\n`;
      for (const m of matches) {
        txt += `${m.league.flag || '🏆'} *${m.league.name}*\n${fmtMatch(m, true)}\n\n`;
      }
      txt += footer();
      await send(txt);
      return;
    }

    // ── EQUIPE ───────────────────────────────────────────────────────────────
    if (sub === 'equipe' || sub === 'team' || sub === 'club') {
      if (!query) { await send('❌ Usage : *.footlive equipe [nom]*\nEx : *.footlive equipe real madrid*'); return; }
      await send(`🔄 _Recherche de **${query}**..._`);

      const teamData = await apiGet('/teams', { search: query });
      if (!teamData?.length) {
        await send(`❌ Équipe *${query}* introuvable.\n💡 Vérifie l'orthographe.`);
        return;
      }

      const team = teamData[0].team;
      const venue = teamData[0].venue;
      const season = currentSeason();

      const [lastData, nextData, statsData] = await Promise.all([
        apiGet('/fixtures', { team: team.id, last: 5 }),
        apiGet('/fixtures', { team: team.id, next: 3 }),
        apiGet('/teams/statistics', { team: team.id, season, league: 39 }).catch(() => null),
      ]);

      let txt = `${header(team.name)}\n`;
      if (venue?.name) txt += `🏟 ${venue.name}, ${venue.city || ''}\n`;
      txt += '\n';

      if (lastData?.length) {
        txt += `📋 *DERNIERS MATCHS :*\n`;
        txt += [...lastData].reverse().map(m => fmtMatch(m)).join('\n') + '\n\n';
      }
      if (nextData?.length) {
        txt += `📅 *PROCHAINS MATCHS :*\n`;
        txt += nextData.map(m => fmtMatch(m)).join('\n') + '\n';
      }

      txt += '\n' + footer();
      await send(txt);
      return;
    }

    // ── PROCHAIN MATCH ───────────────────────────────────────────────────────
    if (sub === 'prochain' || sub === 'next') {
      if (!query) { await send('❌ Usage : *.footlive prochain [équipe]*\nEx : *.footlive prochain marseille*'); return; }
      await send(`🔄 _Prochain match de **${query}**..._`);

      const teamData = await apiGet('/teams', { search: query });
      if (!teamData?.length) { await send(`❌ Équipe *${query}* introuvable.`); return; }

      const team = teamData[0].team;
      const nextData = await apiGet('/fixtures', { team: team.id, next: 1 });

      if (!nextData?.length) {
        await send(`${header(`prochain — ${team.name}`)}\n\n😴 Aucun prochain match programmé.\n\n${footer()}`);
        return;
      }

      const m = nextData[0];
      const date = new Date(m.fixture.date);
      const dateStr = date.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
      const timeStr = date.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

      let txt =
        `${header(`prochain match — ${team.name}`)}\n\n` +
        `🏆 *${m.league.name}* — ${m.league.country}\n` +
        `⚽ *${m.teams.home.name}* 🆚 *${m.teams.away.name}*\n` +
        `📅 ${dateStr} à ${timeStr}\n`;
      if (m.fixture.venue?.name) txt += `🏟 ${m.fixture.venue.name}, ${m.fixture.venue.city || ''}\n`;
      txt += `\n${footer()}`;
      await send(txt);
      return;
    }

    // ── MATCHS D'UNE LIGUE ──────────────────────────────────────────────────
    if (sub === 'ligue' || sub === 'league') {
      if (!query) { await send('❌ Usage : *.footlive ligue [nom]*\nVoir *.footlive leagues*'); return; }

      const leagueId = LEAGUES[query];
      if (!leagueId) {
        await send(`❌ Ligue *${query}* non reconnue.\nUtilise *.footlive leagues* pour voir la liste.\n💡 Essaie aussi *.footlive afrique* pour les ligues africaines.`);
        return;
      }

      await send(`🔄 _Chargement de la ligue **${query}**..._`);
      const season = currentSeason();

      const [liveData, todayData, nextData] = await Promise.all([
        apiGet('/fixtures', { league: leagueId, live: 'all' }),
        apiGet('/fixtures', { league: leagueId, date: todayDate() }),
        apiGet('/fixtures', { league: leagueId, next: 5, season }),
      ]);

      let txt = `${header(`🏆 ${query}`)}\n\n`;

      if (liveData?.length) {
        txt += `🔴 *EN DIRECT :*\n${liveData.map(m => fmtMatch(m)).join('\n')}\n\n`;
      }
      if (todayData?.length) {
        const notLive = todayData.filter(m => !['1H','2H','ET','P','HT','LIVE'].includes(m.fixture.status.short));
        if (notLive.length) txt += `📅 *AUJOURD'HUI :*\n${notLive.map(m => fmtMatch(m)).join('\n')}\n\n`;
      }
      if (!liveData?.length && !todayData?.length && nextData?.length) {
        txt += `📅 *PROCHAINS MATCHS :*\n${nextData.map(m => fmtMatch(m)).join('\n')}\n`;
      }
      if (!liveData?.length && !todayData?.length && !nextData?.length) {
        txt += `😴 Aucun match disponible pour *${query}* en ce moment.\n`;
      }

      txt += '\n' + footer();
      await send(txt);
      return;
    }

    // ── CLASSEMENT ───────────────────────────────────────────────────────────
    if (['classement','standing','standings','tableau'].includes(sub)) {
      if (!query) { await send('❌ Usage : *.footlive classement [ligue]*\nEx : *.footlive classement ligue 1*'); return; }

      const leagueId = LEAGUES[query];
      if (!leagueId) { await send(`❌ Ligue *${query}* non reconnue.\nVoir *.footlive leagues*`); return; }

      await send(`🔄 _Chargement du classement **${query}**..._`);
      const season = currentSeason();
      const data = await apiGet('/standings', { league: leagueId, season });

      if (!data?.length) { await send(`❌ Classement indisponible pour *${query}* (saison ${season}).`); return; }

      const standings = data[0]?.league?.standings?.[0];
      if (!standings) { await send(`❌ Données introuvables pour *${query}*.`); return; }

      let txt = `${header(`🏆 classement ${query} ${season}`)}\n\n`;
      txt += `${'Pos'.padEnd(4)}${'Équipe'.padEnd(20)}${'J'.padStart(3)}${'V'.padStart(3)}${'N'.padStart(3)}${'D'.padStart(3)}${'Pts'.padStart(5)}${'DB'.padStart(5)}\n`;
      txt += `${'─'.repeat(44)}\n`;

      for (const t of standings.slice(0, 20)) {
        const pos  = String(t.rank).padEnd(4);
        const name = t.team.name.substring(0, 18).padEnd(20);
        const j    = String(t.all.played).padStart(3);
        const v    = String(t.all.win).padStart(3);
        const n    = String(t.all.draw).padStart(3);
        const d    = String(t.all.lose).padStart(3);
        const pts  = String(t.points).padStart(5);
        const db   = (t.goalsDiff >= 0 ? '+' : '') + String(t.goalsDiff).padStart(4);
        txt += `${pos}${name}${j}${v}${n}${d}${pts}${db}\n`;
      }

      txt += '\n' + footer();
      await send(txt);
      return;
    }

    // ── TOP BUTEURS ──────────────────────────────────────────────────────────
    if (['buteurs','topscorers','scorers','buts'].includes(sub)) {
      if (!query) { await send('❌ Usage : *.footlive buteurs [ligue]*\nEx : *.footlive buteurs premier league*'); return; }

      const leagueId = LEAGUES[query];
      if (!leagueId) { await send(`❌ Ligue *${query}* non reconnue.\nVoir *.footlive leagues*`); return; }

      await send(`🔄 _Top buteurs **${query}**..._`);
      const season = currentSeason();
      const data = await apiGet('/players/topscorers', { league: leagueId, season });

      if (!data?.length) { await send(`❌ Données buteurs indisponibles pour *${query}*.`); return; }

      let txt = `${header(`⚽ top buteurs — ${query} ${season}`)}\n\n`;
      data.slice(0, 15).forEach((entry, i) => {
        const p = entry.player;
        const s = entry.statistics[0];
        txt += `*${i + 1}.* ${p.name} *(${s.team?.name || '?'})*\n`;
        txt += `   ⚽ ${s.goals.total || 0} buts  🅰️ ${s.goals.assists || 0} passes  🎯 ${s.shots?.on || 0} tirs cadrés\n\n`;
      });
      txt += footer();
      await send(txt);
      return;
    }

    // ── TOP PASSEURS ─────────────────────────────────────────────────────────
    if (['assisteurs','topassists','passes','assists'].includes(sub)) {
      if (!query) { await send('❌ Usage : *.footlive assisteurs [ligue]*\nEx : *.footlive assisteurs laliga*'); return; }

      const leagueId = LEAGUES[query];
      if (!leagueId) { await send(`❌ Ligue *${query}* non reconnue.\nVoir *.footlive leagues*`); return; }

      await send(`🔄 _Top passeurs **${query}**..._`);
      const season = currentSeason();
      const data = await apiGet('/players/topassists', { league: leagueId, season });

      if (!data?.length) { await send(`❌ Données assisteurs indisponibles pour *${query}*.`); return; }

      let txt = `${header(`🅰️ top passeurs — ${query} ${season}`)}\n\n`;
      data.slice(0, 15).forEach((entry, i) => {
        const p = entry.player;
        const s = entry.statistics[0];
        txt += `*${i + 1}.* ${p.name} *(${s.team?.name || '?'})*\n`;
        txt += `   🅰️ ${s.goals.assists || 0} passes  ⚽ ${s.goals.total || 0} buts\n\n`;
      });
      txt += footer();
      await send(txt);
      return;
    }

    // ── Commande inconnue ────────────────────────────────────────────────────
    await send(`❌ Sous-commande *${sub}* inconnue.\nUtilise *.footlive help* pour voir toutes les commandes.`);
  },
};
