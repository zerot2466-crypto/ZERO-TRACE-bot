// Porté depuis l'ancien bot Zero Trace (utils/fancyText.js, ESM → CommonJS)
// Fonctions pures de conversion en caractères unicode stylisés — aucune dépendance.

function mapContiguous(text, offsetUpper, offsetLower, offsetDigit) {
    return text.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(offsetUpper + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(offsetLower + (code - 97));
        if (code >= 48 && code <= 57 && offsetDigit) return String.fromCodePoint(offsetDigit + (code - 48));
        return char;
    }).join('');
}

function boldSerif(text) { return mapContiguous(text, 0x1D400, 0x1D41A, 0x1D7CE); }
function italicSerif(text) { return mapContiguous(text, 0x1D434, 0x1D44E, null); }
function boldItalicSerif(text) { return mapContiguous(text, 0x1D468, 0x1D482, null); }
function boldScript(text) { return mapContiguous(text, 0x1D4D0, 0x1D4EA, null); }
function boldFraktur(text) { return mapContiguous(text, 0x1D56C, 0x1D586, null); }
function sansSerif(text) { return mapContiguous(text, 0x1D5A0, 0x1D5BA, 0x1D7E2); }
function boldSans(text) { return mapContiguous(text, 0x1D5D4, 0x1D5EE, 0x1D7EC); }
function italicSans(text) { return mapContiguous(text, 0x1D608, 0x1D622, null); }
function boldItalicSans(text) { return mapContiguous(text, 0x1D63C, 0x1D656, null); }
function monospace(text) { return mapContiguous(text, 0x1D670, 0x1D68A, 0x1D7F6); }
function fullwidth(text) { return mapContiguous(text, 0xFF21, 0xFF41, 0xFF10); }

function doubleStruck(text) {
    const exceptions = { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' };
    return text.split('').map(c => {
        if (exceptions[c]) return exceptions[c];
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D538 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D552 + (code - 97));
        return c;
    }).join('');
}

function gothic(text) {
    const exceptions = { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' };
    return text.split('').map(c => {
        if (exceptions[c]) return exceptions[c];
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D504 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D51E + (code - 97));
        return c;
    }).join('');
}

function script(text) {
    const upperExceptions = { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ' };
    const lowerExceptions = { e: 'ℯ', g: 'ℊ', o: 'ℴ' };
    return text.split('').map(c => {
        if (upperExceptions[c]) return upperExceptions[c];
        if (lowerExceptions[c]) return lowerExceptions[c];
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D49C + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D4B6 + (code - 97));
        return c;
    }).join('');
}

function smallCaps(text) {
    const map = {
        a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
        k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ',
        u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => map[c] || c).join('');
}

function circled(text) {
    return text.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x24B6 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + (code - 97));
        return c;
    }).join('');
}

function squared(text) {
    return text.toUpperCase().split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1F130 + (code - 65));
        return c;
    }).join('');
}

function cute(text) {
    return `✿°• ${script(text)} •°✿`;
}

module.exports = {
    boldSerif, italicSerif, boldItalicSerif, boldScript, boldFraktur,
    sansSerif, boldSans, italicSans, boldItalicSans, monospace, fullwidth,
    doubleStruck, gothic, script, smallCaps, circled, squared, cute
};
