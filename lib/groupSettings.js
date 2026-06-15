/**
 * ZERO TRACE BOT v5.0 - Group Settings Manager
 * Gère antilink, antidelete, antibadword, antiraid, anticall par groupe
 */
const fs   = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function getPath(feature) {
  return path.join(DATA_DIR, `${feature}.json`);
}

function load(feature) {
  try {
    const p = getPath(feature);
    if (fs.existsSync(p)) return fs.readJsonSync(p);
    return {};
  } catch { return {}; }
}

function save(feature, data) {
  try {
    fs.ensureDirSync(DATA_DIR);
    fs.writeJsonSync(getPath(feature), data, { spaces: 2 });
  } catch (e) {}
}

function isEnabled(feature, jid) {
  return !!load(feature)[jid];
}

function setEnabled(feature, jid, enabled) {
  const data = load(feature);
  if (enabled) data[jid] = true;
  else delete data[jid];
  save(feature, data);
}

module.exports = { isEnabled, setEnabled };
