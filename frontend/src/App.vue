<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import {
  getGitHubRepoDetails,
  getGitHubRepos,
  getGitHubSession,
  logoutGitHubSession,
} from './api';

const currentWeek = 'Week 3';
const activeView = ref('board');
const boardFilter = ref('all');
const selectedId = ref('PM-108');
const commandOpen = ref(false);
const showComposer = ref(false);
const showCardModal = ref(false);
const showGitHubLogin = ref(false);
const detailCollapsed = ref(false);
const searchQuery = ref('');
const dragProjectId = ref(null);

const PROJECTS_STORAGE_KEY = 'pm-os-projects-v1';
const SELECTED_ID_STORAGE_KEY = 'pm-os-selected-project-v1';

const githubUser = ref(null);
const githubConfigured = ref(true);
const githubBusy = ref(false);
const githubError = ref('');
const availableRepos = ref([]);
const repoForm = reactive({
  projectId: 'PM-108',
  repoFullName: '',
});

const lanes = [
  { key: 'scoping', label: 'Scoping', tone: 'slate' },
  { key: 'building', label: 'Building', tone: 'blue' },
  { key: 'ready', label: 'Ready To Demo', tone: 'amber' },
  { key: 'shipped', label: 'Shipped', tone: 'green' },
];

const projects = ref([
  {
    id: 'PM-108',
    name: 'Async demo queue',
    owner: 'Neha',
    handle: '@nebullii',
    team: 'Solo',
    lane: 'ready',
    votes: 19,
    momentum: 'High',
    lastUpdate: '2h ago',
    statusNote: 'Ready for host review',
    summary: 'Turns weekly submissions into one ranked demo queue with proof, links, and one-click voting context.',
    blocker: 'None',
    proof: 'Preview + Loom + GitHub',
    proofUrl: 'demo.nebullii.dev',
    tags: ['Friday vote', 'Demo flow'],
    repo: null,
    githubActivity: [],
  },
  {
    id: 'PM-102',
    name: 'Ship radar',
    owner: 'Ava',
    handle: '@ava',
    team: 'Pod 1',
    lane: 'building',
    votes: 11,
    momentum: 'Medium',
    lastUpdate: '5h ago',
    statusNote: 'Waiting on webhook map',
    summary: 'Flags who has not shipped a meaningful weekly update and exposes stale work before voting.',
    blocker: 'Need GitHub webhook mapping',
    proof: 'Schema draft',
    proofUrl: 'github.com/ship-radar',
    tags: ['Ops', 'Automation'],
    repo: null,
    githubActivity: [],
  },
  {
    id: 'PM-099',
    name: 'Friday call brief',
    owner: 'Marcus',
    handle: '@marcus',
    team: 'Pod 3',
    lane: 'ready',
    votes: 14,
    momentum: 'High',
    lastUpdate: '1h ago',
    statusNote: 'Agenda generated',
    summary: 'Condenses the cohort into a host-ready brief with launch order, blockers, and strongest demos.',
    blocker: 'None',
    proof: 'Host script',
    proofUrl: 'loom.com/brief',
    tags: ['Facilitation', 'Weekly brief'],
    repo: null,
    githubActivity: [],
  },
  {
    id: 'PM-091',
    name: 'Proof-first submissions',
    owner: 'Jules',
    handle: '@jules',
    team: 'Pod 2',
    lane: 'scoping',
    votes: 6,
    momentum: 'Low',
    lastUpdate: 'Yesterday',
    statusNote: 'Needs tighter copy',
    summary: 'Requires screenshot, repo, and claim before a project can enter the Friday vote queue.',
    blocker: 'Need form copy',
    proof: 'Wireframe only',
    proofUrl: 'figma.com/proof-first',
    tags: ['Intake', 'Quality'],
    repo: null,
    githubActivity: [],
  },
  {
    id: 'PM-087',
    name: 'Cohort leaderboard',
    owner: 'Rina',
    handle: '@rina',
    team: 'Pod 4',
    lane: 'shipped',
    votes: 24,
    momentum: 'High',
    lastUpdate: '30m ago',
    statusNote: 'Strongest shipped signal',
    summary: 'Ranks weekly shipping consistency instead of raw task count so the cohort rewards execution.',
    blocker: 'None',
    proof: 'Live leaderboard',
    proofUrl: 'leaderboard.app',
    tags: ['Leaderboard', 'Signals'],
    repo: null,
    githubActivity: [],
  },
  {
    id: 'PM-083',
    name: 'Cross-project blockers',
    owner: 'Leo',
    handle: '@leo',
    team: 'Pod 1',
    lane: 'building',
    votes: 8,
    momentum: 'Medium',
    lastUpdate: '4h ago',
    statusNote: 'Mentor tagging blocked',
    summary: 'Maps who is blocked on feedback, design, or infra so mentors know where to intervene.',
    blocker: 'Awaiting mentor tagging',
    proof: 'Board + filter',
    proofUrl: 'github.com/blockers',
    tags: ['Blockers', 'Mentors'],
    repo: null,
    githubActivity: [],
  },
]);

const persistProjects = () => {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects.value));
};

const hydrateStoredProjects = () => {
  const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      projects.value = parsed;
    }
  } catch (error) {
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
  }
};

const hydrateStoredSelectedId = () => {
  const stored = localStorage.getItem(SELECTED_ID_STORAGE_KEY);
  if (stored) {
    selectedId.value = stored;
    repoForm.projectId = stored;
  }
};

const activity = ref([
  'PM-108 moved to Ready To Demo',
  'PM-087 gained 3 votes',
  'Marcus generated Friday host brief',
  'PM-102 marked blocked by webhook dependency',
]);

const composer = reactive({
  name: '',
  owner: '',
  handle: '',
  team: '',
  summary: '',
  proof: '',
  proofUrl: '',
  lane: 'scoping',
});

const visibleProjects = computed(() => {
  let filtered = projects.value;

  if (boardFilter.value === 'ready') {
    filtered = filtered.filter((project) => project.lane === 'ready');
  } else if (boardFilter.value === 'shipping') {
    filtered = filtered.filter((project) => project.lane === 'ready' || project.lane === 'shipped');
  } else if (boardFilter.value === 'blocked') {
    filtered = filtered.filter((project) => project.blocker !== 'None');
  } else if (boardFilter.value === 'connected') {
    filtered = filtered.filter((project) => project.repo);
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return filtered;
  }

  return filtered.filter((project) =>
    [project.id, project.name, project.owner, project.team, project.summary, project.tags.join(' '), project.repo?.fullName || '']
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
});

const selectedProject = computed(
  () => projects.value.find((project) => project.id === selectedId.value) || visibleProjects.value[0] || null,
);

const sortedVoteQueue = computed(() =>
  [...projects.value]
    .filter((project) => project.lane === 'ready' || project.lane === 'shipped')
    .sort((left, right) => right.votes - left.votes),
);

const builderRows = computed(() =>
  [...projects.value]
    .sort((left, right) => right.votes - left.votes)
    .map((project, index) => ({
      rank: index + 1,
      owner: project.owner,
      handle: project.handle,
      shipped: project.lane === 'shipped' ? 1 : 0,
      ready: project.lane === 'ready' ? 1 : 0,
      votes: project.votes,
      project: project.name,
      repo: project.repo?.fullName || 'Not connected',
    })),
);

const readyCount = computed(() => projects.value.filter((project) => project.lane === 'ready').length);
const shippedCount = computed(() => projects.value.filter((project) => project.lane === 'shipped').length);
const blockedCount = computed(() => projects.value.filter((project) => project.blocker !== 'None').length);
const staleCount = computed(() => projects.value.filter((project) => project.lastUpdate === 'Yesterday').length);
const submissionCount = computed(() => projects.value.length);
const connectedCount = computed(() => projects.value.filter((project) => project.repo).length);
const trackedProjects = computed(() => projects.value.filter((project) => project.repo));
const profileSnapshot = computed(() => [
  { label: 'Vote queue presence', value: `${sortedVoteQueue.value.length} demos` },
  { label: 'Board focus', value: `${readyCount.value} ready / ${shippedCount.value} shipped` },
  { label: 'Risk signal', value: `${blockedCount.value} blocked submissions` },
  { label: 'Repository coverage', value: `${connectedCount.value}/${submissionCount.value} linked` },
]);
const profileFocusAreas = computed(() =>
  githubUser.value?.tags?.length
    ? githubUser.value.tags
    : ['Weekly reviews', 'Execution quality', 'Repository sync', 'Proof-first updates'],
);
const profilePreferences = computed(() => [
  { label: 'Update cadence', value: 'Daily or on push' },
  { label: 'Primary review mode', value: 'Friday demo queue' },
  { label: 'Proof requirement', value: 'Repo + demo link' },
  { label: 'Sync source', value: githubConfigured.value ? 'GitHub OAuth' : 'Manual until configured' },
]);
const profileRecentActivity = computed(() => activity.value.slice(0, 4));

const commandItems = computed(() => [
  { key: 'view-profile', label: 'Open profile page', action: () => setView('profile') },
  { key: 'github-login', label: githubUser.value ? 'Manage GitHub repos' : 'Login with GitHub', action: () => openGitHubLogin() },
  { key: 'view-board', label: 'Open board view', action: () => setView('board') },
  { key: 'view-list', label: 'Open list view', action: () => setView('list') },
  { key: 'view-vote', label: 'Open Friday vote queue', action: () => setView('vote') },
  { key: 'view-builders', label: 'Open builders leaderboard', action: () => setView('builders') },
  { key: 'filter-ready', label: 'Show ready-to-demo only', action: () => applyFilter('ready') },
  { key: 'brief', label: 'Generate Friday host brief', action: () => generateFridayBrief() },
  { key: 'composer', label: 'Create new submission', action: () => openComposer() },
]);

const laneProjects = (laneKey) => visibleProjects.value.filter((project) => project.lane === laneKey);

const laneMeta = (laneKey) => lanes.find((lane) => lane.key === laneKey);
const laneTone = (laneKey) => laneMeta(laneKey)?.tone || 'slate';
const laneLabel = (laneKey) => laneMeta(laneKey)?.label || laneKey;

const setView = (view) => {
  activeView.value = view;
  commandOpen.value = false;
};

const applyFilter = (filter) => {
  boardFilter.value = filter;
  activeView.value = 'board';
  commandOpen.value = false;
};

const openProject = (projectId) => {
  selectedId.value = projectId;
  repoForm.projectId = projectId;
  showCardModal.value = true;
};

const closeCardModal = () => {
  showCardModal.value = false;
};

const openComposer = () => {
  showComposer.value = true;
  commandOpen.value = false;
};

const openGitHubLogin = () => {
  showGitHubLogin.value = true;
  commandOpen.value = false;
  githubError.value = '';
};

const logoutGitHub = () => {
  logoutGitHubSession()
    .catch(() => null)
    .finally(() => {
      githubUser.value = null;
      availableRepos.value = [];
      repoForm.repoFullName = '';
      showGitHubLogin.value = false;
      githubError.value = '';

      projects.value = projects.value.map((project) => {
        const hadRepo = Boolean(project.repo);

        return {
          ...project,
          repo: null,
          githubActivity: [],
          proof: hadRepo ? 'GitHub disconnected' : project.proof,
          proofUrl: hadRepo ? 'Reconnect repo to restore proof' : project.proofUrl,
          statusNote: hadRepo ? 'GitHub disconnected' : project.statusNote,
        };
      });

      addActivity('GitHub disconnected');
    });
};

const resetComposer = () => {
  composer.name = '';
  composer.owner = '';
  composer.handle = '';
  composer.team = '';
  composer.summary = '';
  composer.proof = '';
  composer.proofUrl = '';
  composer.lane = 'scoping';
};

const addActivity = (message) => {
  activity.value = [message, ...activity.value].slice(0, 6);
};

const createSubmission = () => {
  if (!composer.name.trim() || !composer.owner.trim() || !composer.summary.trim()) {
    return;
  }

  const nextId = `PM-${String(100 + projects.value.length + 1)}`;
  const ownerHandle = composer.handle.trim() || `@${composer.owner.trim().toLowerCase().replace(/\s+/g, '')}`;
  const newProject = {
    id: nextId,
    name: composer.name.trim(),
    owner: composer.owner.trim(),
    handle: ownerHandle,
    team: composer.team.trim() || 'Solo',
    lane: composer.lane,
    votes: 1,
    momentum: 'New',
    lastUpdate: 'Just now',
    statusNote: 'Fresh submission',
    summary: composer.summary.trim(),
    blocker: 'None',
    proof: composer.proof.trim() || 'No proof yet',
    proofUrl: composer.proofUrl.trim() || 'Add demo link',
    tags: ['New submission'],
    repo: null,
    githubActivity: [],
  };

  projects.value = [newProject, ...projects.value];
  selectedId.value = nextId;
  repoForm.projectId = nextId;
  showComposer.value = false;
  activeView.value = 'board';
  addActivity(`${nextId} created by ${newProject.owner}`);
  resetComposer();
};

const voteForSelected = () => {
  if (!selectedProject.value) {
    return;
  }

  selectedProject.value.votes += 1;
  addActivity(`${selectedProject.value.id} gained a vote`);
};

const moveSelectedTo = (laneKey) => {
  if (!selectedProject.value) {
    return;
  }

  selectedProject.value.lane = laneKey;
  selectedProject.value.lastUpdate = 'Just now';
  selectedProject.value.statusNote = `Moved to ${lanes.find((lane) => lane.key === laneKey)?.label}`;
  addActivity(`${selectedProject.value.id} moved to ${lanes.find((lane) => lane.key === laneKey)?.label}`);
};

const generateFridayBrief = () => {
  activeView.value = 'vote';
  boardFilter.value = 'all';
  addActivity(`Friday host brief generated from ${sortedVoteQueue.value.length} eligible demos`);
  commandOpen.value = false;
};

const startDrag = (projectId) => {
  dragProjectId.value = projectId;
};

const dropOnLane = (laneKey) => {
  if (!dragProjectId.value) {
    return;
  }

  const project = projects.value.find((item) => item.id === dragProjectId.value);
  if (!project) {
    return;
  }

  project.lane = laneKey;
  project.lastUpdate = 'Just now';
  project.statusNote = `Dragged to ${lanes.find((lane) => lane.key === laneKey)?.label}`;
  selectedId.value = project.id;
  addActivity(`${project.id} dragged to ${lanes.find((lane) => lane.key === laneKey)?.label}`);
  dragProjectId.value = null;
};

const clearDrag = () => {
  dragProjectId.value = null;
};

const loadGitHubRepos = async () => {
  const payload = await getGitHubRepos();
  availableRepos.value = payload.repos || [];

  if (!repoForm.repoFullName && availableRepos.value.length) {
    repoForm.repoFullName = availableRepos.value[0].fullName;
  }
};

const loadGitHubSession = async () => {
  githubBusy.value = true;
  githubError.value = '';

  try {
    const payload = await getGitHubSession();
    githubConfigured.value = payload.configured;
    githubUser.value = payload.user;

    if (payload.authenticated) {
      await loadGitHubRepos();
    } else {
      availableRepos.value = [];
    }
  } catch (error) {
    githubError.value = 'Failed to load GitHub session.';
  } finally {
    githubBusy.value = false;
  }
};

const loginWithGitHub = () => {
  githubError.value = '';

  if (!githubConfigured.value) {
    githubError.value = 'GitHub OAuth is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Vercel.';
    return;
  }

  window.location.href = '/api/github/login';
};

const applyRepoDetailsToProject = (project, repo) => {
  project.repo = repo;
  project.githubActivity = repo.activity || [];
  project.proof = `GitHub connected · ${repo.branch}`;
  project.proofUrl = repo.url || repo.fullName;
  project.lastUpdate = repo.lastPush || 'Just now';
  project.statusNote = `Tracking ${repo.fullName}`;

  if (repo.openPrs > 0 && project.lane === 'scoping') {
    project.lane = 'building';
  } else if (repo.openPrs === 0 && project.lane === 'building') {
    project.lane = 'ready';
  }
};

const connectRepoToProject = async () => {
  if (!githubUser.value || !repoForm.projectId || !repoForm.repoFullName) {
    return;
  }

  const project = projects.value.find((item) => item.id === repoForm.projectId);
  if (!project) {
    return;
  }

  githubBusy.value = true;
  githubError.value = '';

  try {
    const payload = await getGitHubRepoDetails(repoForm.repoFullName);
    if (!payload?.repo) {
      throw new Error('Repository details were not returned.');
    }

    applyRepoDetailsToProject(project, payload.repo);
    selectedId.value = project.id;
    addActivity(`${project.id} linked to ${payload.repo.fullName}`);
  } catch (error) {
    githubError.value = 'Failed to connect the selected repository.';
  } finally {
    githubBusy.value = false;
  }
};

const simulateGitHubSync = async () => {
  if (!selectedProject.value?.repo) {
    return;
  }

  githubBusy.value = true;
  githubError.value = '';

  try {
    const payload = await getGitHubRepoDetails(selectedProject.value.repo.fullName);
    if (!payload?.repo) {
      throw new Error('Repository details were not returned.');
    }

    applyRepoDetailsToProject(selectedProject.value, payload.repo);
    selectedProject.value.statusNote = 'Updated automatically from GitHub';
    addActivity(`${selectedProject.value.id} auto-updated from GitHub activity`);
  } catch (error) {
    githubError.value = 'Failed to sync repository activity from GitHub.';
  } finally {
    githubBusy.value = false;
  }
};

const handleKeydown = (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    commandOpen.value = !commandOpen.value;
    return;
  }

  if (event.key.toLowerCase() === 'c' && !event.metaKey && !event.ctrlKey) {
    openComposer();
  }

  if (event.key.toLowerCase() === 'f' && !event.metaKey && !event.ctrlKey) {
    boardFilter.value = boardFilter.value === 'ready' ? 'all' : 'ready';
    activeView.value = 'board';
  }

  if (event.key === 'Escape') {
    commandOpen.value = false;
    showComposer.value = false;
    showGitHubLogin.value = false;
    showCardModal.value = false;
  }
};

watch(
  projects,
  () => {
    persistProjects();
  },
  { deep: true },
);

watch(selectedId, (value) => {
  localStorage.setItem(SELECTED_ID_STORAGE_KEY, value);
});

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown);
  hydrateStoredProjects();
  hydrateStoredSelectedId();
  await loadGitHubSession();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">C</div>
        <div>
          <p class="eyebrow">Cohort OS</p>
          <h1>Current Week</h1>
        </div>
      </div>

      <section class="panel panel-compact profile-panel">
        <div class="panel-header">
          <h2>Profile</h2>
        </div>
        <div v-if="githubUser" class="profile-card">
          <div class="profile-topline">
            <div class="avatar-wrap">
              <div class="avatar-chip avatar-chip-large">{{ initials(githubUser.name) || githubUser.avatar }}</div>
              <span class="avatar-source" aria-hidden="true" title="Connected via GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.01-.02-1.98-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.18a10.96 10.96 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.74.11 3.03.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.26 5.68.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.68.8.56 4.56-1.53 7.85-5.84 7.85-10.91C23.5 5.65 18.35.5 12 .5z"/>
                </svg>
              </span>
            </div>
            <div class="profile-identity">
              <strong>{{ githubUser.name }}</strong>
              <p class="mini-copy">{{ githubUser.handle }}</p>
            </div>
          </div>
          <div class="profile-stats">
            <div class="profile-stat">
              <strong>{{ availableRepos.length }}</strong>
              <span>Repos</span>
            </div>
            <div class="profile-stat">
              <strong>{{ connectedCount }}</strong>
              <span>Tracked</span>
            </div>
            <div class="profile-stat">
              <strong>{{ shippedCount }}</strong>
              <span>Shipped</span>
            </div>
          </div>
          <div class="profile-actions">
            <button class="detail-action" @click="setView('profile')">Profile</button>
            <a
              class="detail-action profile-link"
              :href="`https://github.com/${(githubUser.handle || '').replace('@', '')}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.01-.02-1.98-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.18a10.96 10.96 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.74.11 3.03.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.26 5.68.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.68.8.56 4.56-1.53 7.85-5.84 7.85-10.91C23.5 5.65 18.35.5 12 .5z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
        <div v-else class="profile-empty">
          <div class="profile-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.01-.02-1.98-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.18a10.96 10.96 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.74.11 3.03.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.26 5.68.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.68.8.56 4.56-1.53 7.85-5.84 7.85-10.91C23.5 5.65 18.35.5 12 .5z"/>
            </svg>
          </div>
          <div class="profile-empty-copy">
            <strong>Connect GitHub</strong>
            <p class="mini-copy">Import your profile and track repository activity per project.</p>
          </div>
          <button class="detail-action primary" @click="openGitHubLogin">Login with GitHub</button>
        </div>
      </section>

      <nav class="nav">
        <button class="nav-item" :class="{ 'is-active': activeView === 'board' }" @click="setView('board')">
          <span>Submissions</span>
          <span class="count">{{ submissionCount }}</span>
        </button>
        <button class="nav-item" :class="{ 'is-active': activeView === 'vote' }" @click="setView('vote')">
          <span>Friday Vote</span>
          <span class="count">{{ readyCount }}</span>
        </button>
        <button class="nav-item" :class="{ 'is-active': activeView === 'builders' }" @click="setView('builders')">
          <span>Builders</span>
          <span class="count">96</span>
        </button>
        <button class="nav-item" :class="{ 'is-active': activeView === 'profile' }" @click="setView('profile')">
          <span>Profile</span>
          <span class="count">{{ githubUser ? 1 : 0 }}</span>
        </button>
        <button class="nav-item" :class="{ 'is-active': boardFilter === 'connected' }" @click="applyFilter('connected')">
          <span>Connected Repos</span>
          <span class="count">{{ connectedCount }}</span>
        </button>
      </nav>

      <section class="panel panel-compact">
        <div class="panel-header">
          <h2>Views</h2>
        </div>
        <div class="view-list">
          <button class="view-item" :class="{ 'is-active': activeView === 'board' }" @click="setView('board')">Board</button>
          <button class="view-item" :class="{ 'is-active': activeView === 'list' }" @click="setView('list')">List</button>
          <button class="view-item" :class="{ 'is-active': activeView === 'vote' }" @click="setView('vote')">Vote Queue</button>
          <button class="view-item" :class="{ 'is-active': activeView === 'builders' }" @click="setView('builders')">Builders</button>
          <button class="view-item" :class="{ 'is-active': activeView === 'profile' }" @click="setView('profile')">Profile</button>
        </div>
      </section>

      <section class="panel panel-compact">
        <div class="panel-header">
          <h2>Activity</h2>
        </div>
        <ul class="activity-list">
          <li v-for="item in activity" :key="item">{{ item }}</li>
        </ul>
      </section>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div>
          <p class="eyebrow">Submissions / {{ currentWeek }}</p>
          <h2>{{ currentWeek }} Submission Review</h2>
        </div>

        <div class="topbar-actions">
          <div class="search-shell">
            <input v-model="searchQuery" class="search-input" placeholder="Search project, owner, repo..." />
          </div>
          <button class="command-trigger" @click="commandOpen = true">⌘K</button>
          <button class="primary-action" @click="openComposer">New submission</button>
        </div>
      </header>

      <section class="stats-grid">
        <article class="stat-card">
          <span class="stat-label">Shipped this week</span>
          <strong>{{ shippedCount }}</strong>
          <small>Completed and posted</small>
        </article>
        <article class="stat-card">
          <span class="stat-label">Ready for Friday</span>
          <strong>{{ readyCount }}</strong>
          <small>Has proof and demo link</small>
        </article>
        <article class="stat-card">
          <span class="stat-label">Connected repos</span>
          <strong>{{ connectedCount }}</strong>
          <small>Auto-sync enabled</small>
        </article>
        <article class="stat-card">
          <span class="stat-label">No recent update</span>
          <strong>{{ staleCount }}</strong>
          <small>Stale since yesterday</small>
        </article>
      </section>

      <section class="content-grid" :class="{ 'is-detail-collapsed': detailCollapsed }">
        <section class="panel main-panel">
          <div class="panel-header board-header">
            <div>
              <h2 v-if="activeView === 'board'">Weekly board</h2>
              <h2 v-else-if="activeView === 'list'">Submission list</h2>
              <h2 v-else-if="activeView === 'vote'">Friday vote queue</h2>
              <h2 v-else-if="activeView === 'profile'">User profile</h2>
              <h2 v-else>Builders leaderboard</h2>
              <p v-if="activeView === 'board'">Drag cards, connect repos, and let GitHub update the board automatically.</p>
              <p v-else-if="activeView === 'list'">Scan every submission with repo status in one dense view.</p>
              <p v-else-if="activeView === 'vote'">Rank the strongest demos and operate the call live.</p>
              <p v-else-if="activeView === 'profile'">Manage your connected GitHub identity, repositories, and session state.</p>
              <p v-else>Reward real shipping, not fake productivity.</p>
            </div>

            <div v-if="activeView !== 'profile'" class="filter-row">
              <button class="filter-chip" :class="{ 'is-selected': boardFilter === 'all' }" @click="applyFilter('all')">All</button>
              <button class="filter-chip" :class="{ 'is-selected': boardFilter === 'ready' }" @click="applyFilter('ready')">Ready</button>
              <button class="filter-chip" :class="{ 'is-selected': boardFilter === 'shipping' }" @click="applyFilter('shipping')">Shipping</button>
              <button class="filter-chip" :class="{ 'is-selected': boardFilter === 'connected' }" @click="applyFilter('connected')">Connected</button>
            </div>
          </div>

          <div v-if="activeView === 'board'" class="board-columns">
            <section
              v-for="lane in lanes"
              :key="lane.key"
              class="lane"
              @dragover.prevent
              @drop="dropOnLane(lane.key)"
            >
              <div class="lane-header">
                <div class="lane-title">
                  <span class="lane-dot" :data-tone="lane.tone"></span>
                  <h3>{{ lane.label }}</h3>
                </div>
                <span class="lane-count">{{ laneProjects(lane.key).length }}</span>
              </div>

              <button
                v-for="project in laneProjects(lane.key)"
                :key="project.id"
                class="card"
                :class="{ 'is-selected': selectedProject && selectedProject.id === project.id }"
                draggable="true"
                @dragstart="startDrag(project.id)"
                @dragend="clearDrag"
                @click="openProject(project.id)"
              >
                <div class="card-topline">
                  <span class="issue-id">{{ project.id }}</span>
                  <span class="vote-pill">{{ project.votes }} votes</span>
                </div>
                <h4>{{ project.name }}</h4>
                <p>{{ project.summary }}</p>
                <div class="meta-row">
                  <span>{{ project.owner }}</span>
                  <span>{{ project.lastUpdate }}</span>
                </div>
                <div v-if="project.repo" class="repo-chip">{{ project.repo.fullName }}</div>
              </button>
            </section>
          </div>

          <div v-else-if="activeView === 'list'" class="list-view">
            <div class="list-header list-row list-row-wide">
              <span>Issue</span>
              <span>Owner</span>
              <span>Status</span>
              <span>Repo</span>
              <span>Votes</span>
              <span>Blocker</span>
            </div>
            <button
              v-for="project in visibleProjects"
              :key="project.id"
              class="list-row list-row-wide list-item"
              :class="{ 'is-selected': selectedProject && selectedProject.id === project.id }"
              @click="openProject(project.id)"
            >
              <span><strong>{{ project.id }}</strong> {{ project.name }}</span>
              <span>{{ project.owner }}</span>
              <span>{{ project.statusNote }}</span>
              <span>{{ project.repo?.fullName || 'Not connected' }}</span>
              <span>{{ project.votes }}</span>
              <span>{{ project.blocker }}</span>
            </button>
          </div>

          <div v-else-if="activeView === 'vote'" class="vote-view">
            <article v-for="project in sortedVoteQueue" :key="project.id" class="vote-card">
              <div>
                <p class="eyebrow">{{ project.id }} · {{ project.owner }}</p>
                <h3>{{ project.name }}</h3>
                <p>{{ project.summary }}</p>
                <div class="tag-row">
                  <span class="tag">{{ project.proof }}</span>
                  <span class="tag">{{ project.momentum }}</span>
                  <span v-if="project.repo" class="tag">{{ project.repo.fullName }}</span>
                </div>
              </div>
              <div class="vote-actions">
                <strong>{{ project.votes }}</strong>
                <button class="inline-action" @click="openProject(project.id)">Inspect</button>
                <button class="inline-action" @click="selectedId = project.id; voteForSelected()">Vote +1</button>
              </div>
            </article>
          </div>

          <div v-else-if="activeView === 'profile'" class="profile-page">
            <section class="profile-hero">
              <div class="profile-hero-topline">
                <div class="avatar-chip avatar-chip-large">{{ githubUser?.avatar || 'GH' }}</div>
                <div>
                  <p class="eyebrow">Connected identity</p>
                  <h3>{{ githubUser?.name || 'No GitHub account connected' }}</h3>
                  <p class="profile-description">
                    {{ githubUser ? `${githubUser.handle} is connected for repository tracking and submission sync.` : 'Login with GitHub to import your profile and start tracking repositories.' }}
                  </p>
                </div>
              </div>
              <div class="profile-page-actions">
                <button v-if="!githubUser" class="detail-action primary" @click="openGitHubLogin">Login with GitHub</button>
                <template v-else>
                  <button class="detail-action" @click="openGitHubLogin">Manage repos</button>
                  <button class="detail-action danger" @click="logoutGitHub">Logout</button>
                </template>
              </div>
            </section>

            <section class="profile-stats-grid">
              <article class="profile-stat-card">
                <span class="detail-label">Source</span>
                <strong>{{ githubUser ? 'GitHub' : 'Not connected' }}</strong>
              </article>
              <article class="profile-stat-card">
                <span class="detail-label">Repos loaded</span>
                <strong>{{ availableRepos.length }}</strong>
              </article>
              <article class="profile-stat-card">
                <span class="detail-label">Tracked repos</span>
                <strong>{{ connectedCount }}</strong>
              </article>
              <article class="profile-stat-card">
                <span class="detail-label">Tracked submissions</span>
                <strong>{{ trackedProjects.length }}</strong>
              </article>
            </section>

            <section v-if="githubError || !githubConfigured" class="profile-empty-state profile-alert">
              <p v-if="githubError">{{ githubError }}</p>
              <p v-else>GitHub OAuth is not configured in Vercel yet. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.</p>
            </section>

            <section class="profile-sections">
              <article class="panel profile-page-panel">
                <div class="panel-header">
                  <div>
                    <h2>Snapshot</h2>
                    <p>A fast read on how this account is operating inside PM OS.</p>
                  </div>
                </div>
                <div class="snapshot-grid">
                  <div v-for="item in profileSnapshot" :key="item.label" class="snapshot-item">
                    <span class="detail-label">{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </div>
                </div>
              </article>

              <article class="panel profile-page-panel">
                <div class="panel-header">
                  <div>
                    <h2>Account details</h2>
                    <p>Information currently sourced from the connected GitHub session.</p>
                  </div>
                </div>
                <dl class="profile-detail-list">
                  <div>
                    <dt>Name</dt>
                    <dd>{{ githubUser?.name || 'Unavailable' }}</dd>
                  </div>
                  <div>
                    <dt>Handle</dt>
                    <dd>{{ githubUser?.handle || 'Unavailable' }}</dd>
                  </div>
                  <div>
                    <dt>Provider</dt>
                    <dd>{{ githubUser ? 'GitHub OAuth' : 'None' }}</dd>
                  </div>
                  <div>
                    <dt>Session state</dt>
                    <dd>{{ githubUser ? 'Connected' : 'Signed out' }}</dd>
                  </div>
                </dl>
              </article>

              <article class="panel profile-page-panel">
                <div class="panel-header">
                  <div>
                    <h2>About</h2>
                    <p>Short profile summary and GitHub-derived context.</p>
                  </div>
                </div>
                <div v-if="githubUser" class="about-section">
                  <p class="about-copy">{{ githubUser.bio }}</p>
                  <dl class="profile-detail-list compact">
                    <div>
                      <dt>Role</dt>
                      <dd>{{ githubUser.role }}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{{ githubUser.location }}</dd>
                    </div>
                    <div>
                      <dt>Website</dt>
                      <dd>{{ githubUser.website }}</dd>
                    </div>
                  </dl>
                </div>
                <div v-else class="profile-empty-state">
                  <p>Connect GitHub to populate this section.</p>
                </div>
              </article>

              <article class="panel profile-page-panel">
                <div class="panel-header">
                  <div>
                    <h2>Tags</h2>
                    <p>Signals that describe the user, workflow, and current focus areas.</p>
                  </div>
                </div>
                <div class="tag-row profile-tag-row">
                  <span v-for="tag in profileFocusAreas" :key="tag" class="tag">{{ tag }}</span>
                </div>
              </article>

              <article class="panel profile-page-panel">
                <div class="panel-header">
                  <div>
                    <h2>Preferences</h2>
                    <p>Default operating preferences for progress tracking and review.</p>
                  </div>
                </div>
                <dl class="profile-detail-list compact">
                  <div v-for="item in profilePreferences" :key="item.label">
                    <dt>{{ item.label }}</dt>
                    <dd>{{ item.value }}</dd>
                  </div>
                </dl>
              </article>

              <article class="panel profile-page-panel">
                <div class="panel-header">
                  <div>
                    <h2>Recent activity</h2>
                    <p>The latest account and project actions reflected in PM OS.</p>
                  </div>
                </div>
                <ul class="activity-list profile-activity-list">
                  <li v-for="item in profileRecentActivity" :key="item">{{ item }}</li>
                </ul>
              </article>

              <article class="panel profile-page-panel">
                <div class="panel-header">
                  <div>
                    <h2>Available repositories</h2>
                    <p>Repositories currently available for manual project tracking.</p>
                  </div>
                </div>
                <div v-if="availableRepos.length" class="profile-repo-list">
                  <article v-for="repo in availableRepos" :key="repo.id" class="repo-row">
                    <div>
                      <strong>{{ repo.fullName }}</strong>
                      <p class="mini-copy">{{ repo.lastCommit }}</p>
                    </div>
                    <div class="repo-meta">
                      <span>{{ repo.lastPush }}</span>
                      <span>{{ repo.openPrs }} PR</span>
                    </div>
                  </article>
                </div>
                <div v-else class="profile-empty-state">
                  <p>No repositories loaded yet.</p>
                </div>
              </article>

              <article class="panel profile-page-panel">
                <div class="panel-header">
                  <div>
                    <h2>Tracked submissions</h2>
                    <p>Projects currently mapped to a repository from this profile.</p>
                  </div>
                </div>
                <div v-if="trackedProjects.length" class="tracked-project-list">
                  <article v-for="project in trackedProjects" :key="project.id" class="tracked-project-row">
                    <div>
                      <strong>{{ project.id }} · {{ project.name }}</strong>
                      <p class="mini-copy">{{ project.repo?.fullName }}</p>
                    </div>
                    <span class="status-badge" :data-tone="laneTone(project.lane)">{{ laneLabel(project.lane) }}</span>
                  </article>
                </div>
                <div v-else class="profile-empty-state">
                  <p>No submissions are connected to a repo yet.</p>
                </div>
              </article>
            </section>
          </div>

          <div v-else class="builders-view">
            <div class="list-header list-row list-row-wide">
              <span>Rank</span>
              <span>Builder</span>
              <span>Project</span>
              <span>Repo</span>
              <span>Ready</span>
              <span>Votes</span>
            </div>
            <div v-for="row in builderRows" :key="`${row.rank}-${row.handle}`" class="list-row list-row-wide">
              <span>#{{ row.rank }}</span>
              <span>{{ row.owner }} <span class="muted">{{ row.handle }}</span></span>
              <span>{{ row.project }}</span>
              <span>{{ row.repo }}</span>
              <span>{{ row.ready }}</span>
              <span>{{ row.votes }}</span>
            </div>
          </div>
        </section>

      </section>
    </main>

    <div v-if="commandOpen" class="command-backdrop" @click="commandOpen = false">
      <section class="command-menu" @click.stop>
        <div class="command-input">Jump to views, filters, and GitHub actions</div>
        <ul class="command-results">
          <li v-for="item in commandItems" :key="item.key">
            <button class="command-result" @click="item.action()">{{ item.label }}</button>
          </li>
        </ul>
      </section>
    </div>

    <div v-if="showComposer" class="command-backdrop" @click="showComposer = false">
      <section class="composer-modal" @click.stop>
        <div class="panel-header">
          <div>
            <p class="eyebrow">New submission</p>
            <h2>Create a proof-first project update</h2>
          </div>
        </div>
        <div class="composer-grid">
          <input v-model="composer.name" class="text-input" placeholder="Project name" />
          <input v-model="composer.owner" class="text-input" placeholder="Owner" />
          <input v-model="composer.handle" class="text-input" placeholder="@handle" />
          <input v-model="composer.team" class="text-input" placeholder="Pod / team" />
          <input v-model="composer.proof" class="text-input" placeholder="Proof attached" />
          <input v-model="composer.proofUrl" class="text-input" placeholder="Demo or repo link" />
          <select v-model="composer.lane" class="text-input">
            <option v-for="lane in lanes" :key="lane.key" :value="lane.key">{{ lane.label }}</option>
          </select>
          <textarea v-model="composer.summary" class="text-input text-area" placeholder="What shipped this week?" />
        </div>
        <div class="modal-actions">
          <button class="detail-action" @click="showComposer = false">Cancel</button>
          <button class="detail-action primary" @click="createSubmission">Create submission</button>
        </div>
      </section>
    </div>

    <div v-if="showGitHubLogin" class="command-backdrop" @click="showGitHubLogin = false">
      <section class="composer-modal github-modal" @click.stop>
        <div class="panel-header">
          <div>
            <p class="eyebrow">GitHub Connect</p>
            <h2>{{ githubUser ? 'Manage connected repositories' : 'Login with GitHub' }}</h2>
          </div>
        </div>
        <p class="detail-copy">
          Connect your GitHub account, then pick a repository and attach it to a submission.
        </p>
        <div v-if="githubError || !githubConfigured" class="profile-empty-state profile-alert">
          <p v-if="githubError">{{ githubError }}</p>
          <p v-else>GitHub OAuth is not configured in Vercel yet. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.</p>
        </div>
        <div v-if="!githubUser" class="github-login-cta">
          <button class="detail-action primary" :disabled="githubBusy || !githubConfigured" @click="loginWithGitHub">
            {{ githubBusy ? 'Loading...' : 'Continue with GitHub' }}
          </button>
        </div>
        <div v-else class="github-repo-list">
          <article v-for="repo in availableRepos" :key="repo.id" class="repo-row">
            <div>
              <strong>{{ repo.fullName }}</strong>
              <p class="mini-copy">{{ repo.lastCommit }}</p>
            </div>
            <div class="repo-meta">
              <span>{{ repo.lastPush }}</span>
              <span>{{ repo.openPrs }} PR</span>
            </div>
          </article>
          <div class="repo-connect-box">
            <select v-model="repoForm.projectId" class="text-input" :disabled="githubBusy">
              <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.id }} · {{ project.name }}</option>
            </select>
            <select v-model="repoForm.repoFullName" class="text-input" :disabled="githubBusy">
              <option value="">Select a repository</option>
              <option v-for="repo in availableRepos" :key="repo.id" :value="repo.fullName">{{ repo.fullName }}</option>
            </select>
            <div class="modal-actions repo-actions">
              <button class="detail-action primary" :disabled="!repoForm.repoFullName || githubBusy" @click="connectRepoToProject">
                {{ githubBusy ? 'Connecting...' : 'Track repo for project' }}
              </button>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="detail-action" @click="showGitHubLogin = false">Close</button>
        </div>
      </section>
    </div>

    <div v-if="showCardModal && selectedProject" class="command-backdrop" @click="closeCardModal">
      <section class="card-modal" @click.stop role="dialog" aria-modal="true">
        <header class="card-modal-header">
          <div class="card-modal-title">
            <span class="issue-id">{{ selectedProject.id }}</span>
            <h2>{{ selectedProject.name }}</h2>
            <div class="card-modal-meta">
              <span class="status-badge" :data-tone="laneTone(selectedProject.lane)">{{ laneLabel(selectedProject.lane) }}</span>
              <span class="owner-chip">
                <span class="avatar" :data-tone="avatarTone(selectedProject.owner)">{{ initials(selectedProject.owner) }}</span>
                {{ selectedProject.owner }} <span class="muted">{{ selectedProject.handle }}</span>
              </span>
            </div>
          </div>
          <button class="modal-close" @click="closeCardModal" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>

        <div class="card-modal-body">
          <section class="detail-grid">
            <div>
              <span class="detail-label">Team</span>
              <p>{{ selectedProject.team }}</p>
            </div>
            <div>
              <span class="detail-label">Momentum</span>
              <p><span class="momentum-dot" :data-momentum="selectedProject.momentum"></span> {{ selectedProject.momentum }}</p>
            </div>
            <div>
              <span class="detail-label">Votes</span>
              <p>{{ selectedProject.votes }}</p>
            </div>
            <div>
              <span class="detail-label">Last update</span>
              <p>{{ selectedProject.lastUpdate }}</p>
            </div>
            <div>
              <span class="detail-label">Proof</span>
              <p>{{ selectedProject.proof }}</p>
            </div>
            <div>
              <span class="detail-label">Demo link</span>
              <p>{{ selectedProject.proofUrl }}</p>
            </div>
            <div>
              <span class="detail-label">Blocker</span>
              <p>{{ selectedProject.blocker }}</p>
            </div>
            <div>
              <span class="detail-label">Repo</span>
              <p>{{ selectedProject.repo?.fullName || 'Not connected' }}</p>
            </div>
          </section>

          <section class="card-modal-section">
            <span class="detail-label">Summary</span>
            <p class="detail-copy">{{ selectedProject.summary }}</p>
          </section>

          <section v-if="selectedProject.tags.length" class="card-modal-section">
            <span class="detail-label">Tags</span>
            <div class="tag-row">
              <span v-for="tag in selectedProject.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </section>

          <section v-if="selectedProject.githubActivity.length" class="card-modal-section">
            <span class="detail-label">Recent GitHub activity</span>
            <ul class="activity-list">
              <li v-for="item in selectedProject.githubActivity" :key="item">{{ item }}</li>
            </ul>
          </section>
        </div>

        <footer class="card-modal-footer">
          <button v-if="selectedProject.repo" class="detail-action" :disabled="githubBusy" @click="simulateGitHubSync">
            {{ githubBusy ? 'Syncing...' : 'Sync from GitHub' }}
          </button>
          <button class="detail-action" @click="moveSelectedTo('ready')">Mark ready</button>
          <button class="detail-action" @click="moveSelectedTo('shipped')">Mark shipped</button>
          <button class="detail-action primary" @click="voteForSelected">Add vote</button>
        </footer>
      </section>
    </div>
  </div>
</template>
