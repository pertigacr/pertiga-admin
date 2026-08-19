export default async function handler(req, res) {
  const appUrl = "https://pertiga-admin.vercel.app";
  const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoBooks.fullaccess.all&client_id=${process.env.ZOHO_CLIENT_ID}&response_type=code&redirect_uri=${appUrl}/api/zoho-callback&access_type=offline&prompt=consent`;
  res.redirect(302, authUrl);
}
