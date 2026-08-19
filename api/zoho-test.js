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
    return data.access_token;
  }

  try {
    const token = await getAccessToken();
    const orgId = process.env.ZOHO_ORG_ID;
    const headers = {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    };

    const [invRes, expRes] = await Promise.all([
      fetch(`https://books.zohoapis.com/api/v3/invoices?organization_id=${orgId}&per_page=5`, { headers }),
      fetch(`https://books.zohoapis.com/api/v3/expenses?organization_id=${orgId}&per_page=5`, { headers }),
    ]);

    const invData = await invRes.json();
    const expData = await expRes.json();

    res.status(200).json({
      token_ok: !!token,
      org_id: orgId,
      invoices_count: invData.invoices?.length || 0,
      invoices_code: invData.code,
      invoices_message: invData.message,
      first_invoice: invData.invoices?.[0] || null,
      expenses_count: expData.expenses?.length || 0,
      expenses_code: expData.code,
      expenses_message: expData.message,
      first_expense: expData.expenses?.[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
