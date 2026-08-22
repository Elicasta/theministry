import crypto from 'node:crypto';

function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function normalizeEmail(email) {
  return clean(email, 320).toLowerCase();
}
function hashEmail(email) {
  const e = normalizeEmail(email);
  return e ? crypto.createHash('sha256').update(e).digest('hex') : null;
}
async function fetchWithTimeout(url, opts = {}, timeoutMs = 5500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const text = clean(body.text || body.question, 3000);
  if (!text) return res.status(400).json({ error: 'Question required' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!SB_URL || !SB_KEY) {
    return res.status(200).json({ ok: true, saved: false, reason: 'Supabase env not configured' });
  }

  const email = normalizeEmail(body.email);
  const payload = {
    question_id: clean(body.id || body.question_id || `q_${Date.now()}`, 120),
    series_slug: clean(body.series_slug || 'the-ministry', 120),
    lesson_slug: clean(body.lesson_slug || 'lesson-1', 120),
    name: clean(body.name || 'Anonymous', 160),
    text,
    anonymous: body.anonymous !== false,
    status: 'new',
    attendee_id: clean(body.attendee_id || '', 80) || null,
    session_id: clean(body.session_id || '', 160) || null,
    email_hash: clean(body.email_hash || '', 160) || hashEmail(email)
  };

  try {
    const r = await fetchWithTimeout(`${SB_URL}/rest/v1/lesson_questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) return res.status(502).json({ error: 'Question save failed. Please try again.' });
    return res.status(200).json({ ok: true, saved: true });
  } catch (e) {
    if (e?.name === 'AbortError') return res.status(504).json({ error: 'Question save timed out. Please try again.' });
    return res.status(500).json({ error: 'Question save unavailable. Please try again.' });
  }
}
