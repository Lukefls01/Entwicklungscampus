// TT Entwicklungscampus – Claude-Chat-Server (Cloudflare Worker)
//
// Reicht Chat-Nachrichten an die Claude API weiter, ohne dass der API-Schlüssel
// jemals im Browser oder auf GitHub landet.
//
// Benötigte Einstellungen im Worker (Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY  (Secret)  – API-Schlüssel aus console.anthropic.com
//   CHAT_PASSWORD      (Secret)  – Zugangscode, den der Chat beim ersten Öffnen abfragt
//   ALLOWED_ORIGINS    (Text, optional) – erlaubte Seiten, kommagetrennt
//                                 Standard: https://lukefls01.github.io

const MODELS = new Set(['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5']);
const DEFAULT_MODEL = 'claude-sonnet-5-5';
const MAX_TOKENS = 16000;          // Obergrenze pro Antwort (inkl. Nachdenken)
const MAX_MESSAGES = 80;           // ältere Nachrichten werden abgeschnitten
const MAX_CHARS_PER_MESSAGE = 60000;
const MAX_CHARS_TOTAL = 400000;    // ~100k Tokens, schützt vor teuren Riesen-Anfragen

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || 'https://lukefls01.github.io')
      .split(',').map(s => s.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, x-chat-key',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Hier läuft der Claude-Chat-Server des TT Entwicklungscampus.' }, 405, cors);
    if (!allowed.includes(origin)) return json({ error: 'Diese Seite darf den Chat-Server nicht benutzen.' }, 403, cors);
    if (!env.ANTHROPIC_API_KEY || !env.CHAT_PASSWORD) return json({ error: 'Server ist noch nicht fertig eingerichtet (API-Schlüssel oder Zugangscode fehlt).' }, 500, cors);
    if (!sameSecret(request.headers.get('x-chat-key') || '', env.CHAT_PASSWORD)) return json({ error: 'Falscher Zugangscode.' }, 401, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Ungültige Anfrage.' }, 400, cors); }

    const model = MODELS.has(body.model) ? body.model : DEFAULT_MODEL;

    // nur Text-Nachrichten, abwechselnd Nutzer/Claude (gleiche Rollen hintereinander werden zusammengefasst)
    const messages = [];
    for (const m of (Array.isArray(body.messages) ? body.messages : []).slice(-MAX_MESSAGES)) {
      if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') continue;
      const text = m.content.slice(0, MAX_CHARS_PER_MESSAGE).trim();
      if (!text) continue;
      const last = messages[messages.length - 1];
      if (last && last.role === m.role) last.content += '\n\n' + text;
      else messages.push({ role: m.role, content: text });
    }
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'Keine Nachricht erhalten.' }, 400, cors);
    if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS_TOTAL) {
      return json({ error: 'Die Unterhaltung ist zu lang geworden. Bitte einen neuen Chat starten.' }, 413, cors);
    }

    const payload = { model, max_tokens: MAX_TOKENS, stream: true, messages };
    if (typeof body.system === 'string' && body.system.trim()) payload.system = body.system.slice(0, 4000);

    let upstream;
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return json({ error: 'Claude ist gerade nicht erreichbar. Bitte gleich nochmal versuchen.' }, 502, cors);
    }

    if (!upstream.ok) {
      let msg = 'Claude hat einen Fehler gemeldet (' + upstream.status + ').';
      try { const e = await upstream.json(); if (e && e.error && e.error.message) msg += ' ' + e.error.message; } catch {}
      return json({ error: msg }, upstream.status, cors);
    }

    // Antwort (Server-Sent Events) direkt an den Browser weiterreichen
    return new Response(upstream.body, {
      status: 200,
      headers: { ...cors, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' },
    });
  },
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'content-type': 'application/json; charset=utf-8' } });
}

// Vergleich ohne früh abzubrechen (erschwert das Erraten des Codes über Antwortzeiten)
function sameSecret(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}
