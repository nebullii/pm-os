const parseError = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json();
    return payload.error || payload.message || JSON.stringify(payload);
  }

  return response.text();
};

export const jsonFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error((await parseError(response)) || 'Request failed');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
};

export const getGitHubSession = async () => jsonFetch('/api/github/me');
export const getGitHubRepos = async () => jsonFetch('/api/github/repos');
export const getGitHubRepoDetails = async (fullName) =>
  jsonFetch(`/api/github/repo?full_name=${encodeURIComponent(fullName)}`);
export const logoutGitHubSession = async () => jsonFetch('/api/github/logout', { method: 'POST' });
