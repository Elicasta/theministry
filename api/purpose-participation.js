import crypto from 'node:crypto';

const SERIES = 'living-with-purpose';
const LESSON = 'singles-2026-08-22';
const SESSION_NUMBER = 822;

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const action = clean(body.action, 40);
  const email = normalizeEmail(body.email);
  const sessionId = clean(body.session_id || '', 160) || `lwp_${crypto.randomUUID()}`;

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

      const existing = await fetch(`${SB_URL}/rest/v1/attendees?${params.toString()}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      const rows = existing.ok ? await existing.json() : [];
      const now = new Date().toISOString();

      if (rows[0]?.id) {
        const patch = await fetch(`${SB_URL}/rest/v1/attendees?id=eq.${encodeURIComponent(rows[0].id)}`, {
          method: 'PATCH',
          headers: headers(SB_KEY),
          body: JSON.stringify({ email, session_id: sessionId, checked_in_at: now, updated_at: now })
        });
        if (!patch.ok) return res.status(500).json({ error: 'Check-in update failed', details: await patch.text().catch(() => '') });
        return res.status(200).json({ ok: true, checked_in: true, returning: true, session_id: sessionId });
      }

      const insert = await fetch(`${SB_URL}/rest/v1/attendees`, {
        method: 'POST',
        headers: headers(SB_KEY),
        body: JSON.stringify({
          email,
          email_hash: emailHash,
          session_id: sessionId,
          checked_in_at: now,
          source: 'living-with-purpose-student',
          series_slug: SERIES,
          lesson_slug: LESSON
        })
      });
      if (!insert.ok) return res.status(500).json({ error: 'Check-in failed', details: await insert.text().catch(() => '') });
      return res.status(200).json({ ok: true, checked_in: true, returning: false, session_id: sessionId });
    }

    if (action === 'answer') {
      const promptId = clean(body.prompt_id, 120);
      const prompt = clean(body.prompt, 800);
      const text = clean(body.text, 5000);
      if (!promptId || !text) return res.status(400).json({ error: 'Prompt and response are required' });

      const category = `LWP:${promptId}${prompt ? ` | ${prompt}` : ''}`.slice(0, 1000);
      const insert = await fetch(`${SB_URL}/rest/v1/responses`, {
        method: 'POST',
        headers: headers(SB_KEY),
        body: JSON.stringify({
          email,
          email_hash: emailHash,
          session: SESSION_NUMBER,
          session_id: sessionId,
          category,
          response: text,
          anonymous: false
        })
      });
      if (!insert.ok) return res.status(500).json({ error: 'Response save failed', details: await insert.text().catch(() => '') });
      return res.status(200).json({ ok: true, saved: true, prompt_id: promptId });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
