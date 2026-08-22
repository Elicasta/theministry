function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!SB_URL || !SB_KEY) {
    return res.status(200).json({ ok: true, questions: [], saved: false, reason: 'Supabase env not configured' });
  }

  const series = clean(req.query.series_slug || 'the-ministry', 120);
  const lesson = clean(req.query.lesson_slug || 'lesson-1', 120);
  const status = clean(req.query.status || '', 80);

  const params = new URLSearchParams();
  params.set('select', 'id,question_id,series_slug,lesson_slug,name,text,status,anonymous,created_at,updated_at');
  params.set('series_slug', `eq.${series}`);
  params.set('lesson_slug', `eq.${lesson}`);
  params.set('order', 'created_at.desc');
  params.set('limit', '200');
  if (status) params.set('status', `eq.${status}`);

  try {
    const r = await fetchWithTimeout(`${SB_URL}/rest/v1/lesson_questions?${params.toString()}`, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!r.ok) return res.status(502).json({ error: 'Question fetch failed' });
    return res.status(200).json({ ok: true, questions: await r.json() });
  } catch (e) {
    if (e?.name === 'AbortError') return res.status(504).json({ error: 'Question feed timed out' });
    return res.status(500).json({ error: 'Question feed unavailable' });
  }
}
