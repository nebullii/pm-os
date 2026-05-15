const { getRedirectUri, isGithubConfigured } = require('./_shared');

module.exports = async function handler(req, res) {
  if (!isGithubConfigured()) {
    res.status(500).send('GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
    return;
  }

  const redirectUri = encodeURIComponent(getRedirectUri(req));
  const clientId = encodeURIComponent(process.env.GITHUB_CLIENT_ID);
  const scope = encodeURIComponent('read:user repo');

  res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`);
};
