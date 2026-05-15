const GITHUB_API_BASE = 'https://api.github.com';
const COOKIE_NAME = 'pm_os_github_token';

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        const key = index >= 0 ? part.slice(0, index) : part;
        const value = index >= 0 ? part.slice(index + 1) : '';
        return [decodeURIComponent(key), decodeURIComponent(value)];
      }),
  );
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${req.headers.host}`;
}

function getRedirectUri(req) {
  return `${getBaseUrl(req)}/api/github/callback`;
}

function setCookie(res, value, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (secure) {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (secure) {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

function getToken(req) {
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME] || null;
}

function getGithubConfig() {
  return {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  };
}

function isGithubConfigured() {
  const { clientId, clientSecret } = getGithubConfig();
  return Boolean(clientId && clientSecret);
}

function json(res, statusCode, payload) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

async function githubRequest(path, token, init = {}) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'pm-os',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || `GitHub request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function exchangeCodeForToken(code, redirectUri) {
  const { clientId, clientSecret } = getGithubConfig();
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'pm-os',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const payload = await response.json();
  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'Failed to exchange GitHub OAuth code');
  }

  return payload.access_token;
}

async function fetchGithubUser(token) {
  const user = await githubRequest('/user', token);

  return {
    id: user.id,
    login: user.login,
    name: user.name || user.login,
    handle: `@${user.login}`,
    avatar: (user.name || user.login)
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2),
    bio: user.bio || 'No GitHub bio available.',
    location: user.location || 'Unavailable',
    website: user.blog || user.html_url,
    role: user.company || 'GitHub user',
    tags: ['GitHub', 'Connected account', 'Repo tracking'],
    htmlUrl: user.html_url,
  };
}

async function fetchGithubRepos(token) {
  const repos = await githubRequest('/user/repos?sort=updated&per_page=100', token);

  return repos.map((repo) => ({
    id: repo.id,
    fullName: repo.full_name,
    branch: repo.default_branch,
    lastCommit: repo.description || 'No repository description',
    commitCount: 0,
    openPrs: 0,
    lastPush: repo.pushed_at,
    status: repo.private ? 'private' : 'public',
    url: repo.html_url,
  }));
}

async function fetchGithubRepoDetails(token, fullName) {
  const repo = await githubRequest(`/repos/${fullName}`, token);
  const pulls = await githubRequest(`/repos/${fullName}/pulls?state=open&per_page=10`, token);
  const commits = await githubRequest(`/repos/${fullName}/commits?per_page=10`, token);

  return {
    id: repo.id,
    fullName: repo.full_name,
    branch: repo.default_branch,
    lastCommit: commits[0]?.commit?.message || repo.description || 'No recent commit message',
    commitCount: commits.length,
    openPrs: pulls.length,
    lastPush: repo.pushed_at,
    status: repo.private ? 'private' : 'public',
    url: repo.html_url,
    activity: [
      repo.pushed_at ? `Latest push ${repo.pushed_at}` : 'No recent pushes',
      `${pulls.length} open PR${pulls.length === 1 ? '' : 's'}`,
      `${commits.length} recent commit${commits.length === 1 ? '' : 's'}`,
    ],
  };
}

module.exports = {
  clearCookie,
  exchangeCodeForToken,
  fetchGithubRepoDetails,
  fetchGithubRepos,
  fetchGithubUser,
  getBaseUrl,
  getRedirectUri,
  getToken,
  isGithubConfigured,
  json,
  setCookie,
};
