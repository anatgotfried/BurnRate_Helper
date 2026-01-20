export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    res.status(302).setHeader("Location", `burnrate://strava?error=${encodeURIComponent(error)}`).end();
    return;
  }

  if (!code) {
    res.status(302).setHeader("Location", "burnrate://strava?error=no_code").end();
    return;
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    res.status(302).setHeader("Location", "burnrate://strava?error=token_exchange_failed").end();
    return;
  }

  // const data = await tokenRes.json();
  // TODO: store tokens server-side (Supabase). Do NOT put tokens in the redirect URL.

  res.status(302).setHeader("Location", "burnrate://strava?success=1").end();
}
