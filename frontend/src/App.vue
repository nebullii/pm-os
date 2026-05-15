<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

const currentWeek = 'Week 3';
const activeView = ref('board');
const boardFilter = ref('all');
const selectedId = ref('PM-108');
const commandOpen = ref(false);
const showComposer = ref(false);
const showGitHubLogin = ref(false);
const detailCollapsed = ref(false);
const searchQuery = ref('');
const dragProjectId = ref(null);

const githubUser = ref(null);
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
};

const openComposer = () => {
  showComposer.value = true;
  commandOpen.value = false;
};

const openGitHubLogin = () => {
  showGitHubLogin.value = true;
  commandOpen.value = false;
};

const logoutGitHub = () => {
  githubUser.value = null;
  availableRepos.value = [];
  repoForm.repoFullName = '';
  showGitHubLogin.value = false;

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

const loginWithGitHub = () => {
  githubUser.value = {
    name: 'Neha Chaudhari',
    handle: '@nebullii',
    avatar: 'NC',
  };

  availableRepos.value = [
    {
      id: 1,
      fullName: 'nebullii/cohort-os',
      branch: 'main',
      lastCommit: 'feat: host brief auto-generation',
      commitCount: 38,
      openPrs: 1,
      lastPush: '12m ago',
      status: 'merged recently',
    },
    {
      id: 2,
      fullName: 'nebullii/proof-first-submissions',
      branch: 'main',
      lastCommit: 'fix: require demo link for Friday queue',
      commitCount: 19,
      openPrs: 2,
      lastPush: '1h ago',
      status: 'active',
    },
    {
      id: 3,
      fullName: 'nebullii/ship-radar',
      branch: 'develop',
      lastCommit: 'feat: stale repo detection',
      commitCount: 52,
      openPrs: 0,
      lastPush: 'Yesterday',
      status: 'quiet',
    },
  ];

  repoForm.repoFullName = availableRepos.value[0].fullName;
  showGitHubLogin.value = false;
  addActivity('GitHub connected for @nebullii');
};

const connectRepoToProject = () => {
  if (!githubUser.value || !repoForm.projectId || !repoForm.repoFullName) {
    return;
  }

  const project = projects.value.find((item) => item.id === repoForm.projectId);
  const repo = availableRepos.value.find((item) => item.fullName === repoForm.repoFullName);
  if (!project || !repo) {
    return;
  }

  project.repo = repo;
  project.githubActivity = [
    `Latest push ${repo.lastPush}`,
    `${repo.openPrs} open PR${repo.openPrs === 1 ? '' : 's'}`,
    `${repo.commitCount} tracked commits`,
  ];
  project.proof = `GitHub connected · ${repo.branch}`;
  project.proofUrl = repo.fullName;
  project.lastUpdate = repo.lastPush;
  project.statusNote = `Tracking ${repo.fullName}`;
  if (repo.openPrs > 0 && project.lane === 'scoping') {
    project.lane = 'building';
  }

  selectedId.value = project.id;
  addActivity(`${project.id} linked to ${repo.fullName}`);
};

const simulateGitHubSync = () => {
  if (!selectedProject.value?.repo) {
    return;
  }

  selectedProject.value.lastUpdate = 'Just now';
  selectedProject.value.githubActivity = [
    'New commit pushed 1m ago',
    'PR merged into main',
    `${selectedProject.value.repo.commitCount + 1} tracked commits`,
  ];
  selectedProject.value.repo = {
    ...selectedProject.value.repo,
    commitCount: selectedProject.value.repo.commitCount + 1,
    openPrs: 0,
    lastPush: '1m ago',
    status: 'merged just now',
  };
  selectedProject.value.lane = selectedProject.value.lane === 'building' ? 'ready' : selectedProject.value.lane;
  selectedProject.value.statusNote = 'Updated automatically from GitHub';
  addActivity(`${selectedProject.value.id} auto-updated from GitHub activity`);
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
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
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
            <div class="avatar-chip avatar-chip-large">{{ githubUser.avatar }}</div>
            <div>
              <strong>{{ githubUser.name }}</strong>
              <p class="mini-copy">{{ githubUser.handle }}</p>
            </div>
          </div>
          <dl class="profile-meta">
            <div>
              <dt>Source</dt>
              <dd>GitHub</dd>
            </div>
            <div>
              <dt>Repos loaded</dt>
              <dd>{{ availableRepos.length }}</dd>
            </div>
            <div>
              <dt>Tracked repos</dt>
              <dd>{{ connectedCount }}</dd>
            </div>
          </dl>
          <div class="profile-actions">
            <button class="detail-action" @click="setView('profile')">Open profile</button>
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

      <section class="content-grid">
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
                <strong>{{ projects.filter((project) => project.repo).length }}</strong>
              </article>
            </section>

            <section class="profile-sections">
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
                    <dd>{{ githubUser ? 'GitHub OAuth (mocked UI state)' : 'None' }}</dd>
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

        <aside class="right-rail">
          <section v-if="selectedProject" class="panel detail-panel" :class="{ 'is-collapsed': detailCollapsed }">
            <button
              class="panel-header detail-toggle"
              :aria-expanded="!detailCollapsed"
              @click="detailCollapsed = !detailCollapsed"
            >
              <div>
                <p class="eyebrow">{{ selectedProject.id }}</p>
                <h2>{{ selectedProject.name }}</h2>
              </div>
              <div class="detail-toggle-right">
                <span class="status-badge" :data-tone="laneTone(selectedProject.lane)">{{ laneLabel(selectedProject.lane) }}</span>
                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </button>

            <div v-show="!detailCollapsed" class="detail-body">

            <div class="detail-grid">
              <div>
                <span class="detail-label">Owner</span>
                <p>{{ selectedProject.owner }} <span class="muted">{{ selectedProject.handle }}</span></p>
              </div>
              <div>
                <span class="detail-label">Momentum</span>
                <p>{{ selectedProject.momentum }}</p>
              </div>
              <div>
                <span class="detail-label">Proof</span>
                <p>{{ selectedProject.proof }}</p>
              </div>
              <div>
                <span class="detail-label">Repo</span>
                <p>{{ selectedProject.repo?.fullName || 'Not connected' }}</p>
              </div>
            </div>

            <p class="detail-copy">{{ selectedProject.summary }}</p>

            <div class="tag-row">
              <span v-for="tag in selectedProject.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>

            <div class="repo-connect-box">
              <div class="panel-header">
                <div>
                  <h2>Track GitHub repo</h2>
                  <p>Login first, then choose a repo to attach.</p>
                </div>
              </div>
              <select v-model="repoForm.projectId" class="text-input">
                <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.id }} · {{ project.name }}</option>
              </select>
              <select v-model="repoForm.repoFullName" class="text-input" :disabled="!githubUser">
                <option value="">{{ githubUser ? 'Select a repository' : 'Login with GitHub first' }}</option>
                <option v-for="repo in availableRepos" :key="repo.id" :value="repo.fullName">{{ repo.fullName }}</option>
              </select>
              <div class="modal-actions repo-actions">
                <button class="detail-action" @click="openGitHubLogin">{{ githubUser ? 'Manage GitHub' : 'Login with GitHub' }}</button>
                <button class="detail-action primary" :disabled="!githubUser || !repoForm.repoFullName" @click="connectRepoToProject">Track repo</button>
              </div>
            </div>

            <div v-if="selectedProject.githubActivity.length" class="github-activity-box">
              <div class="panel-header">
                <div>
                  <h2>Recent GitHub activity</h2>
                  <p>Auto-updates board state from repo changes.</p>
                </div>
              </div>
              <ul class="activity-list">
                <li v-for="item in selectedProject.githubActivity" :key="item">{{ item }}</li>
              </ul>
              <button class="detail-action primary" @click="simulateGitHubSync">Simulate new GitHub event</button>
            </div>

            <div class="action-stack">
              <button class="detail-action primary" @click="voteForSelected">Add vote</button>
              <button class="detail-action" @click="moveSelectedTo('ready')">Mark ready</button>
              <button class="detail-action" @click="moveSelectedTo('shipped')">Mark shipped</button>
              <button class="detail-action" @click="generateFridayBrief">Generate Friday brief</button>
            </div>

            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Live host brief</h2>
                <p>What the call lead should say next.</p>
              </div>
            </div>
            <div class="brief-box">
              <p><strong>Lead with:</strong> {{ sortedVoteQueue[0]?.name || 'No eligible demo yet' }}</p>
              <p><strong>Fast follow:</strong> {{ sortedVoteQueue[1]?.name || 'No second demo yet' }}</p>
              <p><strong>GitHub-connected:</strong> {{ connectedCount }} submissions now auto-update from repos.</p>
            </div>
          </section>
        </aside>
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
          Demo flow: connect your GitHub account, then manually pick one repo from the dropdown to track progress for a submission.
        </p>
        <div v-if="!githubUser" class="github-login-cta">
          <button class="detail-action primary" @click="loginWithGitHub">Continue with GitHub</button>
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
        </div>
        <div class="modal-actions">
          <button class="detail-action" @click="showGitHubLogin = false">Close</button>
        </div>
      </section>
    </div>
  </div>
</template>
