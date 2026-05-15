const { fetchGithubUser, getToken, isGithubConfigured, json } = require('./_shared');

module.exports = async function handler(req, res) {
  if (!isGithubConfigured()) {
    json(res, 200, { configured: false, authenticated: false, user: null });
    return;
  }

  const token = getToken(req);
  if (!token) {
    json(res, 200, { configured: true, authenticated: false, user: null });
    return;
  }

  try {
    const user = await fetchGithubUser(token);
    json(res, 200, { configured: true, authenticated: true, user });
  } catch (error) {
    json(res, 401, { configured: true, authenticated: false, user: null, error: 'github_session_invalid' });
  }
};
