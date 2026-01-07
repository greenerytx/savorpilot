// Configuration
const GRAMGRAB_API_URL = 'http://localhost:3000/api';
const GRAMGRAB_APP_URL = 'http://localhost:5173';

// DOM Elements
const elements = {
  statusContainer: document.getElementById('status-container'),
  statusIcon: document.getElementById('status-icon'),
  statusMessage: document.getElementById('status-message'),
  mainContent: document.getElementById('main-content'),
  instagramStatusText: document.getElementById('instagram-status-text'),
  instagramCheck: document.getElementById('instagram-check'),
  gramgrabStatusText: document.getElementById('gramgrab-status-text'),
  gramgrabCheck: document.getElementById('gramgrab-check'),
  syncBtn: document.getElementById('sync-btn'),
  progressContainer: document.getElementById('progress-container'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  progressDetails: document.getElementById('progress-details'),
  fetchedCount: document.getElementById('fetched-count'),
  newProgressCount: document.getElementById('new-progress-count'),
  cancelBtn: document.getElementById('cancel-btn'),
  resultContainer: document.getElementById('result-container'),
  newCount: document.getElementById('new-count'),
  skipCount: document.getElementById('skip-count'),
  viewPostsLink: document.getElementById('view-posts-link'),
  errorContainer: document.getElementById('error-container'),
  errorMessage: document.getElementById('error-message'),
  retryBtn: document.getElementById('retry-btn'),
  forceRefreshCheckbox: document.getElementById('force-refresh-checkbox'),
  collectionSelector: document.getElementById('collection-selector'),
  collectionList: document.getElementById('collection-list'),
  selectAllBtn: document.getElementById('select-all-btn'),
  unselectAllBtn: document.getElementById('unselect-all-btn'),
  collectionsLoading: document.getElementById('collections-loading'),
};

// State
let state = {
  instagramCookies: null,
  gramgrabToken: null,
  isSyncing: false,
  collections: [],
};

// Initialize
document.addEventListener('DOMContentLoaded', init);
elements.syncBtn.addEventListener('click', handleSync);
elements.retryBtn.addEventListener('click', handleRetry);
elements.cancelBtn.addEventListener('click', handleCancel);
elements.selectAllBtn.addEventListener('click', handleSelectAll);
elements.unselectAllBtn.addEventListener('click', handleUnselectAll);

async function init() {
  showLoading();

  try {
    // First check if there's an ongoing or completed sync
    const syncState = await getSyncState();

    if (syncState) {
      console.log('Found sync state:', syncState);

      if (syncState.status === 'syncing') {
        // Sync is in progress
        state.isSyncing = true;
        showSyncingState(syncState);
        pollSyncState();
        return;
      } else if (syncState.status === 'complete') {
        // Show last result (within last 5 minutes)
        const age = Date.now() - (syncState.completedAt || 0);
        if (age < 5 * 60 * 1000) {
          await checkLoginStatuses();
          showCompleteState(syncState);
          return;
        }
      } else if (syncState.status === 'error') {
        // Show error state
        await checkLoginStatuses();
        showErrorFromState(syncState);
        return;
      }
    }

    // Normal initialization - check login statuses
    await checkLoginStatuses();
  } catch (error) {
    showError(error.message || 'Failed to check login status');
  }
}

async function checkLoginStatuses() {
  // Check Instagram login status
  const instagramStatus = await checkInstagramLogin();

  // Check GramGrab login status
  const gramgrabStatus = await checkGramGrabLogin();

  // Update UI
  updateUI(instagramStatus, gramgrabStatus);
}

async function getSyncState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SYNC_STATE' }, resolve);
  });
}

async function clearSyncState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'CLEAR_SYNC_STATE' }, resolve);
  });
}

function showSyncingState(syncState) {
  elements.statusContainer.classList.add('hidden');
  elements.errorContainer.classList.add('hidden');
  elements.mainContent.classList.remove('hidden');
  elements.resultContainer.classList.add('hidden');
  elements.progressContainer.classList.remove('hidden');

  elements.progressFill.style.width = `${syncState.progress || 10}%`;
  elements.progressText.textContent = syncState.message || 'Syncing...';

  // Update detailed progress counts
  const fetched = syncState.totalFetched || 0;
  const newPosts = syncState.newPosts || 0;
  elements.fetchedCount.textContent = fetched.toLocaleString();
  elements.newProgressCount.textContent = newPosts.toLocaleString();

  // Show/hide progress details based on whether we have data
  if (fetched > 0) {
    elements.progressDetails.classList.remove('hidden');
  }

  elements.syncBtn.disabled = true;
  elements.syncBtn.classList.add('syncing');
  elements.syncBtn.querySelector('span').textContent = 'Syncing...';
}

function showCompleteState(syncState) {
  elements.statusContainer.classList.add('hidden');
  elements.errorContainer.classList.add('hidden');
  elements.mainContent.classList.remove('hidden');
  elements.progressContainer.classList.add('hidden');
  elements.resultContainer.classList.remove('hidden');

  elements.newCount.textContent = syncState.result?.newPosts || 0;
  elements.skipCount.textContent = syncState.result?.skippedPosts || 0;

  elements.syncBtn.disabled = false;
  elements.syncBtn.classList.remove('syncing');
  elements.syncBtn.querySelector('span').textContent = 'Sync Again';
}

function showErrorFromState(syncState) {
  elements.statusContainer.classList.add('hidden');
  elements.mainContent.classList.add('hidden');
  elements.errorContainer.classList.remove('hidden');
  elements.errorMessage.textContent = syncState.error || 'Sync failed';
}

async function pollSyncState() {
  const pollInterval = setInterval(async () => {
    const syncState = await getSyncState();

    if (!syncState || syncState.status !== 'syncing') {
      clearInterval(pollInterval);
      state.isSyncing = false;

      if (syncState?.status === 'complete') {
        showCompleteState(syncState);
        elements.syncBtn.disabled = false;
        elements.syncBtn.classList.remove('syncing');
        elements.syncBtn.querySelector('span').textContent = 'Sync Again';
      } else if (syncState?.status === 'error') {
        showErrorFromState(syncState);
      }
    } else {
      // Update progress display
      elements.progressFill.style.width = `${syncState.progress || 10}%`;
      elements.progressText.textContent = syncState.message || 'Syncing...';

      // Update detailed progress counts
      const fetched = syncState.totalFetched || 0;
      const newPosts = syncState.newPosts || 0;
      elements.fetchedCount.textContent = fetched.toLocaleString();
      elements.newProgressCount.textContent = newPosts.toLocaleString();

      // Show progress details once we have data
      if (fetched > 0) {
        elements.progressDetails.classList.remove('hidden');
      }
    }
  }, 500);
}

async function checkInstagramLogin() {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ domain: '.instagram.com' }, (cookies) => {
      const sessionCookie = cookies.find(c => c.name === 'sessionid');
      const csrfCookie = cookies.find(c => c.name === 'csrftoken');
      const dsUserIdCookie = cookies.find(c => c.name === 'ds_user_id');
      const claimCookie = cookies.find(c => c.name === 'ig_www_claim');

      console.log('Instagram cookies found:', cookies.map(c => c.name).join(', '));

      if (sessionCookie && csrfCookie) {
        state.instagramCookies = {
          sessionId: sessionCookie.value,
          csrfToken: csrfCookie.value,
          dsUserId: dsUserIdCookie?.value,
          igWwwClaim: claimCookie?.value,
        };

        // Try to get claim from localStorage via content script
        getInstagramClaim().then(claim => {
          if (claim) {
            state.instagramCookies.igWwwClaim = claim;
            console.log('Got claim from page:', claim.substring(0, 30) + '...');
          }
        });

        resolve({ loggedIn: true });
      } else {
        resolve({ loggedIn: false });
      }
    });
  });
}

// Get claim from Instagram page's localStorage
async function getInstagramClaim() {
  try {
    const [tab] = await chrome.tabs.query({ url: 'https://www.instagram.com/*', active: true });
    if (!tab) {
      // Try to find any Instagram tab
      const tabs = await chrome.tabs.query({ url: 'https://www.instagram.com/*' });
      if (tabs.length === 0) return null;

      const result = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          // Instagram stores the claim in sessionStorage
          return sessionStorage.getItem('www-claim-v2') || localStorage.getItem('ig-www-claim');
        },
      });
      return result?.[0]?.result;
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return sessionStorage.getItem('www-claim-v2') || localStorage.getItem('ig-www-claim');
      },
    });
    return result?.[0]?.result;
  } catch (e) {
    console.log('Could not get claim from page:', e);
    return null;
  }
}

async function checkGramGrabLogin() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['gramgrabToken'], async (result) => {
      console.log('Stored token:', result.gramgrabToken ? 'exists' : 'none');

      if (result.gramgrabToken) {
        // Verify token is still valid
        try {
          const response = await fetch(`${GRAMGRAB_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${result.gramgrabToken}`,
            },
          });

          if (response.ok) {
            state.gramgrabToken = result.gramgrabToken;
            resolve({ loggedIn: true });
            return;
          }
        } catch (e) {
          console.log('Token validation failed:', e);
          // Token invalid, clear it
          chrome.storage.local.remove(['gramgrabToken']);
        }
      }

      // Try to get token from GramGrab website cookies
      console.log('Checking cookies for URL:', GRAMGRAB_APP_URL);

      // Try multiple cookie retrieval methods
      chrome.cookies.getAll({ url: GRAMGRAB_APP_URL }, (cookies) => {
        console.log('All cookies for GramGrab:', cookies.map(c => c.name));

        const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

        if (accessTokenCookie) {
          console.log('Found accessToken cookie');
          state.gramgrabToken = accessTokenCookie.value;
          chrome.storage.local.set({ gramgrabToken: accessTokenCookie.value });
          resolve({ loggedIn: true });
        } else {
          console.log('No accessToken cookie found');
          resolve({ loggedIn: false });
        }
      });
    });
  });
}

async function updateUI(instagramStatus, gramgrabStatus) {
  // Hide loading
  elements.statusContainer.classList.add('hidden');
  elements.errorContainer.classList.add('hidden');
  elements.mainContent.classList.remove('hidden');

  // Update Instagram status
  if (instagramStatus.loggedIn) {
    elements.instagramStatusText.textContent = 'Connected';
    elements.instagramStatusText.classList.add('connected');
    elements.instagramCheck.classList.remove('hidden');
  } else {
    elements.instagramStatusText.textContent = 'Please log into Instagram';
    elements.instagramStatusText.classList.remove('connected');
    elements.instagramCheck.classList.add('hidden');
  }

  // Update GramGrab status
  if (gramgrabStatus.loggedIn) {
    elements.gramgrabStatusText.textContent = 'Connected';
    elements.gramgrabStatusText.classList.add('connected');
    elements.gramgrabCheck.classList.remove('hidden');
  } else {
    elements.gramgrabStatusText.textContent = 'Please log into GramGrab';
    elements.gramgrabStatusText.classList.remove('connected');
    elements.gramgrabCheck.classList.add('hidden');
  }

  // Enable/disable sync button
  elements.syncBtn.disabled = !(instagramStatus.loggedIn && gramgrabStatus.loggedIn);

  // Set view posts link
  elements.viewPostsLink.href = `${GRAMGRAB_APP_URL}/saved-posts`;

  // Fetch and populate collections if both are logged in
  if (instagramStatus.loggedIn && gramgrabStatus.loggedIn) {
    // Show loading indicator
    elements.collectionsLoading.classList.remove('hidden');
    elements.collectionSelector.classList.add('hidden');

    try {
      const collections = await fetchCollections();
      populateCollectionSelector(collections);
    } finally {
      // Hide loading indicator
      elements.collectionsLoading.classList.add('hidden');
    }
  } else {
    elements.collectionSelector.classList.add('hidden');
    elements.collectionsLoading.classList.add('hidden');
  }
}

async function handleSync() {
  if (state.isSyncing || !state.instagramCookies || !state.gramgrabToken) return;

  state.isSyncing = true;
  elements.syncBtn.disabled = true;
  elements.syncBtn.classList.add('syncing');
  elements.syncBtn.querySelector('span').textContent = 'Syncing...';

  // Show progress
  elements.progressContainer.classList.remove('hidden');
  elements.resultContainer.classList.add('hidden');
  elements.progressFill.style.width = '5%';
  elements.progressText.textContent = 'Connecting to Instagram...';

  // Reset progress details
  elements.fetchedCount.textContent = '0';
  elements.newProgressCount.textContent = '0';
  elements.progressDetails.classList.add('hidden');

  // Send sync request to background script
  const forceRefresh = elements.forceRefreshCheckbox?.checked || false;
  const selectedCollections = getSelectedCollections();

  // If no collections selected, show error
  if (selectedCollections.length === 0) {
    showError('Please select at least one collection to sync');
    state.isSyncing = false;
    elements.syncBtn.disabled = false;
    elements.syncBtn.classList.remove('syncing');
    elements.syncBtn.querySelector('span').textContent = 'Sync Saved Posts';
    elements.progressContainer.classList.add('hidden');
    return;
  }

  chrome.runtime.sendMessage({
    type: 'START_SYNC',
    cookies: state.instagramCookies,
    token: state.gramgrabToken,
    forceRefresh,
    collections: selectedCollections,
  }, (response) => {
    state.isSyncing = false;

    if (response?.success) {
      elements.progressFill.style.width = '100%';
      elements.progressText.textContent = 'Complete!';

      setTimeout(() => {
        elements.progressContainer.classList.add('hidden');
        elements.resultContainer.classList.remove('hidden');
        elements.newCount.textContent = response.result?.newPosts || 0;
        elements.skipCount.textContent = response.result?.skippedPosts || 0;
      }, 500);
    } else {
      elements.progressContainer.classList.add('hidden');
      showError(response?.error || 'Sync failed. Please try again.');
    }

    elements.syncBtn.disabled = false;
    elements.syncBtn.classList.remove('syncing');
    elements.syncBtn.querySelector('span').textContent = 'Sync Again';
  });

  // Start polling for state updates (in case popup was closed and reopened)
  pollSyncState();
}

async function handleRetry() {
  await clearSyncState();
  init();
}

async function handleCancel() {
  // Send cancel message to background script
  chrome.runtime.sendMessage({ type: 'CANCEL_SYNC' }, async () => {
    await clearSyncState();
    state.isSyncing = false;

    // Reset UI
    elements.progressContainer.classList.add('hidden');
    elements.syncBtn.disabled = false;
    elements.syncBtn.classList.remove('syncing');
    elements.syncBtn.querySelector('span').textContent = 'Sync Saved Posts';

    // Re-check login statuses
    await checkLoginStatuses();
  });
}

function showLoading() {
  elements.statusContainer.classList.remove('hidden');
  elements.mainContent.classList.add('hidden');
  elements.errorContainer.classList.add('hidden');
  elements.statusIcon.className = 'status-icon loading';
  elements.statusIcon.innerHTML = '';
  elements.statusMessage.textContent = 'Checking login status...';
}

function showError(message) {
  elements.statusContainer.classList.add('hidden');
  elements.mainContent.classList.add('hidden');
  elements.errorContainer.classList.remove('hidden');
  elements.errorMessage.textContent = message;
}

// Fetch collections from Instagram via backend
async function fetchCollections() {
  if (!state.instagramCookies || !state.gramgrabToken) {
    console.log('Cannot fetch collections: missing cookies or token');
    return [];
  }

  try {
    const response = await fetch(`${GRAMGRAB_API_URL}/instagram/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.gramgrabToken}`,
      },
      body: JSON.stringify({
        sessionId: state.instagramCookies.sessionId,
        csrfToken: state.instagramCookies.csrfToken,
        dsUserId: state.instagramCookies.dsUserId,
        igWwwClaim: state.instagramCookies.igWwwClaim,
      }),
    });

    if (!response.ok) {
      console.log('Failed to fetch collections:', response.status);
      return [];
    }

    const collections = await response.json();
    console.log('Fetched collections:', collections);
    return collections;
  } catch (error) {
    console.log('Error fetching collections:', error);
    return [];
  }
}

// Populate the collection selector with checkboxes
function populateCollectionSelector(collections) {
  // Clear existing items
  elements.collectionList.innerHTML = '';

  // Filter out audio auto collection, keep ALL_MEDIA for "All Saved Posts"
  const displayCollections = collections.filter(c => c.id !== 'AUDIO_AUTO_COLLECTION');

  // Add collection items
  displayCollections.forEach(collection => {
    const isAllSaved = collection.id === 'ALL_MEDIA_AUTO_COLLECTION';
    const displayName = isAllSaved ? 'All Saved Posts' : collection.name;

    const item = document.createElement('label');
    item.className = 'collection-item';
    item.innerHTML = `
      <input type="checkbox" value="${collection.id}" data-name="${displayName}" ${isAllSaved ? 'checked' : ''}>
      <span class="collection-checkbox"></span>
      <div class="collection-info">
        <div class="collection-name">${displayName}</div>
        ${collection.mediaCount ? `<div class="collection-count">${collection.mediaCount} posts</div>` : ''}
      </div>
    `;
    elements.collectionList.appendChild(item);
  });

  // Show selector if there are collections
  if (displayCollections.length > 0) {
    elements.collectionSelector.classList.remove('hidden');
  } else {
    elements.collectionSelector.classList.add('hidden');
  }

  state.collections = collections;
}

// Get selected collections
function getSelectedCollections() {
  const checkboxes = elements.collectionList.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => ({
    id: cb.value,
    name: cb.dataset.name,
  }));
}

// Select all collections
function handleSelectAll() {
  const checkboxes = elements.collectionList.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = true);
}

// Unselect all collections
function handleUnselectAll() {
  const checkboxes = elements.collectionList.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
}
