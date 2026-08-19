export default async function handler(req, res) {
  const { code, error } = req.query;
  
  if (error) {
    return res.status(400).send(`<h2>Error de autorización: ${error}</h2>`);
  }
  
  if (!code) {
    return res.status(400).send('<h2>No se recibió código de autorización</h2>');
  }

  const appUrl = "https://pertiga-admin.vercel.app";

  try {
    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        redirect_uri: `${appUrl}/api/zoho-callback`,
        code,
      }),
    });
    
    const data = await response.json();
    
    if (data.refresh_token) {
      return res.status(200).send(`
        <html>
          <body style="font-family:sans-serif;padding:40px;background:#1A1714;color:#F5F0E8">
            <h2 style="color:#C8A96E">✅ Zoho conectado exitosamente</h2>
            <p>Guardá este Refresh Token en Notas — lo necesitás para el siguiente paso:</p>
            <div style="background:#2a2724;padding:16px;border-radius:8px;word-break:break-all;margin:16px 0;color:#C8A96E;font-family:monospace">
              ${data.refresh_token}
            </div>
            <p>Copiá ese token y avisale a Claude.</p>
          </body>
        </html>
      `);
    } else {
      return res.status(400).send(`
        <html>
          <body style="font-family:sans-serif;padding:40px">
            <h2>Error obteniendo token</h2>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </body>
        </html>
      `);
    }
  } catch (err) {
    return res.status(500).send(`<h2>Error: ${err.message}</h2>`);
  }
}
