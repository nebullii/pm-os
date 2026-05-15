const { fetchGithubRepos, getToken, isGithubConfigured, json } = require('./_shared');

module.exports = async function handler(req, res) {
  if (!isGithubConfigured()) {
    json(res, 200, { configured: false, repos: [] });
    return;
  }

  const token = getToken(req);
  if (!token) {
    json(res, 401, { configured: true, repos: [], error: 'not_authenticated' });
    return;
  }

  try {
    const repos = await fetchGithubRepos(token);
    json(res, 200, { configured: true, repos });
  } catch (error) {
    json(res, 500, { configured: true, repos: [], error: 'failed_to_load_repos' });
  }
};
