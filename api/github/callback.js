const { exchangeCodeForToken, getBaseUrl, getRedirectUri, isGithubConfigured, setCookie } = require('./_shared');

module.exports = async function handler(req, res) {
  if (!isGithubConfigured()) {
    res.status(500).send('GitHub OAuth is not configured.');
    return;
  }

  const { code, error } = req.query;
  if (error) {
    res.redirect(`${getBaseUrl(req)}/?github_error=${encodeURIComponent(error)}`);
    return;
  }

  if (!code) {
    res.redirect(`${getBaseUrl(req)}/?github_error=missing_code`);
    return;
  }

  try {
    const token = await exchangeCodeForToken(code, getRedirectUri(req));
    setCookie(res, token);
    res.redirect(`${getBaseUrl(req)}/?github=connected`);
  } catch (authError) {
    res.redirect(`${getBaseUrl(req)}/?github_error=${encodeURIComponent(authError.message)}`);
  }
};
