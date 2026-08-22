function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function supaGet(SB_URL, SB_KEY, path, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      signal: controller.signal
    });
    const text = await r.text().catch(() => '');
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch(e) {}
    return { ok: r.ok, status: r.status, text, json };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY) return res.status(200).json({ ok: true, polls: [], votes: [], saved: false, reason: 'Supabase env not configured' });

  const series = clean(req.query.series_slug || 'the-ministry', 120);
  const lesson = clean(req.query.lesson_slug || 'lesson-1', 120);
  const status = clean(req.query.status || '', 80);

  const p = new URLSearchParams();
  p.set('select', '*');
  p.set('series_slug', `eq.${series}`);
  p.set('lesson_slug', `eq.${lesson}`);
  p.set('order', 'created_at.desc');
  p.set('limit', '100');
  if (status) p.set('status', `eq.${status}`);

  try {
    const pollsReq = await supaGet(SB_URL, SB_KEY, `lesson_polls?${p.toString()}`);
    if (!pollsReq.ok) return res.status(502).json({ error: 'Poll fetch failed' });
    const polls = Array.isArray(pollsReq.json) ? pollsReq.json : [];
    const ids = [...new Set(polls.map(x => x.poll_id).filter(Boolean))];
    let votes = [];
    if (ids.length) {
      const vp = new URLSearchParams();
      vp.set('select', '*');
      vp.set('poll_id', `in.(${ids.map(x => '"' + String(x).replace(/"/g,'\\"') + '"').join(',')})`);
      vp.set('limit', '2000');
      const votesReq = await supaGet(SB_URL, SB_KEY, `lesson_poll_votes?${vp.toString()}`);
      if (!votesReq.ok) return res.status(502).json({ error: 'Vote fetch failed' });
      votes = Array.isArray(votesReq.json) ? votesReq.json : [];
    }
    return res.status(200).json({ ok: true, polls, votes });
  } catch (e) {
    if (e?.name === 'AbortError') return res.status(504).json({ error: 'Poll feed timed out' });
    return res.status(500).json({ error: 'Poll feed unavailable' });
  }
}
