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
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, payload } = req.body;
  const orgId = process.env.ZOHO_ORG_ID;

  try {
    const token = await getAccessToken();
    const headers = {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    };
    const base = `https://www.zohoapis.com/books/v3`;
    let result;

    if (action === 'get_invoices') {
      const r = await fetch(`${base}/invoices?organization_id=${orgId}&status=all&per_page=100`, { headers });
      result = await r.json();
    } else if (action === 'get_expenses') {
      const r = await fetch(`${base}/expenses?organization_id=${orgId}&per_page=100`, { headers });
      result = await r.json();
    } else if (action === 'get_contacts') {
      const r = await fetch(`${base}/contacts?organization_id=${orgId}&per_page=100`, { headers });
      result = await r.json();
    } else if (action === 'create_invoice') {
      const r = await fetch(`${base}/invoices?organization_id=${orgId}`, {
        method: 'POST', headers, body: JSON.stringify(payload)
      });
      result = await r.json();
    } else if (action === 'create_expense') {
      const r = await fetch(`${base}/expenses?organization_id=${orgId}`, {
        method: 'POST', headers, body: JSON.stringify(payload)
      });
      result = await r.json();
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
