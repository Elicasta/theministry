import crypto from 'node:crypto';

const SERIES = 'kingdom-principles';
const LESSON = 'week-4-alignment';
const SESSION_NUMBER = 404;

function clean(value, max = 3000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function normalizeEmail(value) {
  return clean(value, 320).toLowerCase();
}
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function hashEmail(value) {
  return crypto.createHash('sha256').update(normalizeEmail(value)).digest('hex');
}
function headers(key, prefer = 'return=minimal') {
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: prefer
  };
}
async function supaFetch(url, opts = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...opts, signal: controller.signal });
    const text = await response.text().catch(() => '');
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    return { ok: response.ok, status: response.status, text, json };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const action = clean(body.action, 40);
  const email = normalizeEmail(body.email);
  const sessionId = clean(body.session_id || '', 160) || `kp4_${crypto.randomUUID()}`;

  if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY) return res.status(503).json({ error: 'Participation storage is not configured' });

  const emailHash = hashEmail(email);

  try {
    if (action === 'checkin') {
      const params = new URLSearchParams();
      params.set('select', 'id');
      params.set('email_hash', `eq.${emailHash}`);
      params.set('series_slug', `eq.${SERIES}`);
      params.set('lesson_slug', `eq.${LESSON}`);
      params.set('limit', '1');

      const existing = await supaFetch(`${SB_URL}/rest/v1/attendees?${params.toString()}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      if (!existing.ok) return res.status(502).json({ error: 'Check-in lookup failed. Please try again.' });
      const rows = Array.isArray(existing.json) ? existing.json : [];
      const now = new Date().toISOString();

      if (rows[0]?.id) {
        const patch = await supaFetch(`${SB_URL}/rest/v1/attendees?id=eq.${encodeURIComponent(rows[0].id)}`, {
          method: 'PATCH',
          headers: headers(SB_KEY),
          body: JSON.stringify({ email, session_id: sessionId, checked_in_at: now, updated_at: now })
        });
        if (!patch.ok) return res.status(502).json({ error: 'Check-in update failed. Please try again.' });
        return res.status(200).json({ ok: true, checked_in: true, returning: true, session_id: sessionId });
      }

      const insert = await supaFetch(`${SB_URL}/rest/v1/attendees`, {
        method: 'POST',
        headers: headers(SB_KEY),
        body: JSON.stringify({
          email,
          email_hash: emailHash,
          session_id: sessionId,
          checked_in_at: now,
          source: 'kingdom-principles-alignment-student',
          series_slug: SERIES,
          lesson_slug: LESSON
        })
      });
      if (!insert.ok) return res.status(502).json({ error: 'Check-in failed. Please try again.' });
      return res.status(200).json({ ok: true, checked_in: true, returning: false, session_id: sessionId });
    }

    if (action === 'answer') {
      const promptId = clean(body.prompt_id, 120);
      const prompt = clean(body.prompt, 800);
      const text = clean(body.text, 5000);
      if (!promptId || !text) return res.status(400).json({ error: 'Prompt and response are required' });

      const category = `KP4:${promptId}${prompt ? ` | ${prompt}` : ''}`.slice(0, 1000);
      const lookup = new URLSearchParams();
      lookup.set('select', 'id');
      lookup.set('email_hash', `eq.${emailHash}`);
      lookup.set('session', `eq.${SESSION_NUMBER}`);
      lookup.set('category', `eq.${category}`);
      lookup.set('limit', '1');

      const existing = await supaFetch(`${SB_URL}/rest/v1/responses?${lookup.toString()}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      if (!existing.ok) return res.status(502).json({ error: 'Response lookup failed. Please try again.' });

      const responsePayload = {
        email,
        email_hash: emailHash,
        session: SESSION_NUMBER,
        session_id: sessionId,
        category,
        response: text,
        anonymous: false
      };
      const rows = Array.isArray(existing.json) ? existing.json : [];

      if (rows[0]?.id) {
        const patch = await supaFetch(`${SB_URL}/rest/v1/responses?id=eq.${encodeURIComponent(rows[0].id)}`, {
          method: 'PATCH',
          headers: headers(SB_KEY),
          body: JSON.stringify(responsePayload)
        });
        if (!patch.ok) return res.status(502).json({ error: 'Response update failed. Please try again.' });
        return res.status(200).json({ ok: true, saved: true, updated: true, prompt_id: promptId });
      }

      const insert = await supaFetch(`${SB_URL}/rest/v1/responses`, {
        method: 'POST',
        headers: headers(SB_KEY),
        body: JSON.stringify(responsePayload)
      });
      if (!insert.ok) return res.status(502).json({ error: 'Response save failed. Please try again.' });
      return res.status(200).json({ ok: true, saved: true, prompt_id: promptId });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    if (error?.name === 'AbortError') return res.status(504).json({ error: 'Participation request timed out. Please try again.' });
    return res.status(500).json({ error: 'Participation service unavailable. Please try again.' });
  }
}
