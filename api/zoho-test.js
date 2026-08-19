export default async function handler(req, res) {
  async function getAccessToken() {
    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      }),
    });
    const data = await response.json();
    return { token: data.access_token, raw: data };
  }

  try {
    const { token, raw } = await getAccessToken();
    const orgId = process.env.ZOHO_ORG_ID;
    const headers = {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    };

    // Try new domain format
    const invRes = await fetch(`https://www.zohoapis.com/books/v3/invoices?organization_id=${orgId}&per_page=3`, { headers });
    const invData = await invRes.json();

    const expRes = await fetch(`https://www.zohoapis.com/books/v3/expenses?organization_id=${orgId}&per_page=3`, { headers });
    const expData = await expRes.json();

    res.status(200).json({
      token_ok: !!token,
      token_raw: raw,
      org_id: orgId,
      invoices: invData,
      expenses: expData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
