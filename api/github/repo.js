const { fetchGithubRepoDetails, getToken, isGithubConfigured, json } = require('./_shared');

module.exports = async function handler(req, res) {
  if (!isGithubConfigured()) {
    json(res, 200, { configured: false, repo: null });
    return;
  }

  const token = getToken(req);
  if (!token) {
    json(res, 401, { configured: true, repo: null, error: 'not_authenticated' });
    return;
  }

  const fullName = req.query.full_name;
  if (!fullName) {
    json(res, 400, { configured: true, repo: null, error: 'missing_full_name' });
    return;
  }

  try {
    const repo = await fetchGithubRepoDetails(token, fullName);
    json(res, 200, { configured: true, repo });
  } catch (error) {
    json(res, 500, { configured: true, repo: null, error: 'failed_to_load_repo' });
  }
};
