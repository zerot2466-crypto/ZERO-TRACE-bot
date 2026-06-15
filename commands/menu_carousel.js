/**
 * ZERO TRACE BOT v5.0 — menu_carousel.js
 * ----------------------------------------
 * Le menu carousel a été remplacé par le menu simple (texte numéroté).
 * Ce fichier est conservé pour la compatibilité des imports dans handler.js.
 * La fonction sendCarouselMenu retourne toujours false → le menu simple prend le relai.
 */
'use strict';

// Stub : le carousel est désactivé — retourne false pour déclencher le menu simple
async function sendCarouselMenu() { return false; }

const MENU_CATS = [];

module.exports = { sendCarouselMenu, MENU_CATS };
