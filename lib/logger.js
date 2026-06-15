/**
 * ZERO TRACE BOT v5.0 - Logger journalier
 */
const fs   = require('fs-extra');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
fs.ensureDirSync(LOG_DIR);

function getLogFile() {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `${date}.log`);
}

function log(level, message) {
  const time = new Date().toISOString();
  const line = `[${time}] [${level}] ${message}\n`;
  try {
    fs.appendFileSync(getLogFile(), line);
  } catch (e) {}
}

module.exports = {
  info:  (msg) => log('INFO',  msg),
  warn:  (msg) => log('WARN',  msg),
  error: (msg) => log('ERROR', msg),
  cmd:   (msg) => log('CMD',   msg),
};
