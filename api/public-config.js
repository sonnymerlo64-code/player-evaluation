// Public browser configuration; NEVER expose a Supabase secret/service-role key.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) || !key || !(key.startsWith('sb_publishable_') || key.startsWith('eyJ'))) {
    return res.status(503).json({ configured: false, message: 'Database configuration missing or invalid in Vercel.' });
  }
  return res.status(200).json({ configured: true, url, key });
};
