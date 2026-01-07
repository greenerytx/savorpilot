// GramGrab Extension Background Script
const GRAMGRAB_API_URL = 'http://localhost:3000/api';

// Sync state stored in chrome.storage
const SYNC_STATE_KEY = 'syncState';

// Progress polling interval ID
let progressPollingInterval = null;

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_INSTAGRAM_COOKIES') {
    getInstagramCookies().then(sendResponse);
    return true;
  }

  if (message.type === 'STORE_TOKEN') {
    chrome.storage.local.set({ gramgrabToken: message.token });
    sendResponse({ success: true });
  }

  if (message.type === 'GET_TOKEN') {
    chrome.storage.local.get(['gramgrabToken'], (result) => {
      sendResponse({ token: result.gramgrabToken });
    });
    return true;
  }

  if (message.type === 'START_SYNC') {
    handleSync(
      message.cookies,
      message.token,
      message.forceRefresh,
      message.collections || []
    ).then(sendResponse);
    return true;
  }

  if (message.type === 'GET_SYNC_STATE') {
    chrome.storage.local.get([SYNC_STATE_KEY], (result) => {
      sendResponse(result[SYNC_STATE_KEY] || null);
    });
    return true;
  }

  if (message.type === 'CLEAR_SYNC_STATE') {
    chrome.storage.local.remove([SYNC_STATE_KEY]);
    setBadge('', '#16a34a');
    sendResponse({ success: true });
  }

  if (message.type === 'CANCEL_SYNC') {
    // Stop progress polling
    stopProgressPolling();
    // Clear sync state and reset badge
    chrome.storage.local.remove([SYNC_STATE_KEY]);
    setBadge('', '#16a34a');
    console.log('[GramGrab] Sync cancelled by user');
    sendResponse({ success: true });
  }

  // Handle single post video refresh request from web app
  if (message.type === 'REFRESH_VIDEO') {
    handleRefreshVideo(message.recipeId, message.shortcode).then(sendResponse);
    return true;
  }

  // Handle single post image refresh request from web app
  if (message.type === 'REFRESH_IMAGE') {
    handleRefreshImage(message.recipeId, message.shortcode).then(sendResponse);
    return true;
  }

  // Check if extension is available (for web app to detect)
  if (message.type === 'PING') {
    sendResponse({ success: true, version: '1.0.1' });
  }
});

// Also listen for external messages from the web app
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[GramGrab] External message received:', message.type);

  if (message.type === 'PING') {
    sendResponse({ success: true, version: '1.0.3' });
    return true;
  }

  if (message.type === 'REFRESH_VIDEO') {
    handleRefreshVideo(message.recipeId, message.shortcode).then(sendResponse);
    return true;
  }

  if (message.type === 'REFRESH_IMAGE') {
    handleRefreshImage(message.recipeId, message.shortcode).then(sendResponse);
    return true;
  }
});

// Handle refreshing a single video
async function handleRefreshVideo(recipeId, shortcode) {
  console.log(`[GramGrab] Refreshing video for recipe ${recipeId}, shortcode: ${shortcode}`);

  try {
    // Get Instagram cookies
    const cookieResult = await getInstagramCookies();
    if (!cookieResult.success) {
      return { success: false, error: 'Not logged into Instagram. Please log in and try again.' };
    }

    // Get stored token
    const tokenResult = await new Promise((resolve) => {
      chrome.storage.local.get(['gramgrabToken'], (result) => {
        resolve(result.gramgrabToken);
      });
    });

    if (!tokenResult) {
      return { success: false, error: 'Not logged into GramGrab. Please open the extension and log in.' };
    }

    // Call backend to download video with cookies
    const response = await fetch(`${GRAMGRAB_API_URL}/instagram/recipes/${recipeId}/download-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResult}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cookieResult.cookies),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[GramGrab] Video refresh result:', result);

    if (result.success) {
      return { success: true, videoUrl: result.videoUrl };
    } else {
      return { success: false, error: result.message || 'Failed to refresh video' };
    }

  } catch (error) {
    console.error('[GramGrab] Video refresh error:', error);
    return { success: false, error: error.message || 'Failed to refresh video' };
  }
}

// Handle refreshing a single image
async function handleRefreshImage(recipeId, shortcode) {
  console.log(`[GramGrab] Refreshing image for recipe ${recipeId}, shortcode: ${shortcode}`);

  try {
    // Get Instagram cookies to authenticate the request
    const cookieResult = await getInstagramCookies();
    if (!cookieResult.success) {
      return { success: false, error: 'Not logged into Instagram. Please log in and try again.' };
    }

    // Get stored token for backend auth
    const tokenResult = await new Promise((resolve) => {
      chrome.storage.local.get(['gramgrabToken'], (result) => {
        resolve(result.gramgrabToken);
      });
    });

    if (!tokenResult) {
      return { success: false, error: 'Not logged into SavorPilot. Please open the extension and log in.' };
    }

    // Build cookie string for fetch
    const cookieString = `sessionid=${cookieResult.cookies.sessionId}; csrftoken=${cookieResult.cookies.csrfToken}; ds_user_id=${cookieResult.cookies.dsUserId || ''}`;

    // Fetch the Instagram post page to extract fresh image URL
    const postUrl = `https://www.instagram.com/p/${shortcode}/`;
    console.log(`[GramGrab] Fetching post: ${postUrl}`);

    const response = await fetch(postUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': cookieString,
      },
    });

    if (!response.ok) {
      console.error(`[GramGrab] Failed to fetch post: ${response.status}`);
      return { success: false, error: `Failed to fetch Instagram post: ${response.status}` };
    }

    const html = await response.text();

    // Try to extract image URL from og:image meta tag
    let imageUrl = null;

    // Method 1: og:image meta tag
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                         html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1].replace(/&amp;/g, '&');
      console.log('[GramGrab] Found image URL from og:image');
    }

    // Method 2: Look for display_url in JSON data
    if (!imageUrl) {
      const displayUrlMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
      if (displayUrlMatch) {
        imageUrl = displayUrlMatch[1]
          .replace(/\\u0026/g, '&')
          .replace(/\\\//g, '/');
        console.log('[GramGrab] Found image URL from display_url');
      }
    }

    // Method 3: Look for thumbnail_src
    if (!imageUrl) {
      const thumbnailMatch = html.match(/"thumbnail_src"\s*:\s*"([^"]+)"/);
      if (thumbnailMatch) {
        imageUrl = thumbnailMatch[1]
          .replace(/\\u0026/g, '&')
          .replace(/\\\//g, '/');
        console.log('[GramGrab] Found image URL from thumbnail_src');
      }
    }

    if (!imageUrl) {
      console.warn('[GramGrab] No image URL found in Instagram page');
      return { success: false, error: 'Could not find image URL in Instagram post' };
    }

    console.log(`[GramGrab] Fresh image URL found: ${imageUrl.substring(0, 80)}...`);

    // Now fetch the actual image with cookies (Instagram CDN requires auth)
    console.log('[GramGrab] Downloading image with cookies...');
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.instagram.com/',
        'Cookie': cookieString,
      },
    });

    if (!imageResponse.ok) {
      console.error(`[GramGrab] Failed to download image: ${imageResponse.status}`);
      return { success: false, error: `Failed to download image: ${imageResponse.status}` };
    }

    // Convert to base64
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log(`[GramGrab] Image downloaded: ${arrayBuffer.byteLength} bytes, type: ${contentType}`);

    // Send to backend to store
    const uploadResponse = await fetch(`${GRAMGRAB_API_URL}/instagram/recipes/${recipeId}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResult}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: base64,
        contentType: contentType,
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to upload image: ${uploadResponse.status}`);
    }

    const result = await uploadResponse.json();
    console.log('[GramGrab] Image uploaded successfully:', result);

    return { success: true, imageUrl: result.imageUrl };

  } catch (error) {
    console.error('[GramGrab] Image refresh error:', error);
    return { success: false, error: error.message || 'Failed to refresh image' };
  }
}

// Poll backend for sync progress
async function pollBackendProgress(token) {
  try {
    const response = await fetch(`${GRAMGRAB_API_URL}/instagram/sync/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const progress = await response.json();
    return progress;
  } catch (e) {
    console.log('[GramGrab] Failed to poll progress:', e);
    return null;
  }
}

// Start polling for progress
function startProgressPolling(token) {
  // Clear any existing interval
  if (progressPollingInterval) {
    clearInterval(progressPollingInterval);
  }

  progressPollingInterval = setInterval(async () => {
    const progress = await pollBackendProgress(token);

    if (progress && progress.status !== 'idle') {
      // Calculate a progress percentage (rough estimate based on posts fetched)
      // Assume ~5000 posts max for progress bar
      const estimatedProgress = Math.min(95, Math.max(10, (progress.totalFetched / 50))); // 50 posts = 1%

      await updateSyncState({
        status: progress.status,
        progress: progress.status === 'complete' ? 100 : estimatedProgress,
        message: progress.message,
        totalFetched: progress.totalFetched,
        newPosts: progress.newPosts,
        skippedPosts: progress.skippedPosts,
        phase: progress.phase,
      });

      // Update badge with post count
      if (progress.status === 'syncing') {
        const count = progress.totalFetched || 0;
        setBadge(count > 999 ? `${Math.floor(count/1000)}k` : String(count), '#f59e0b');
      }
    }
  }, 1000); // Poll every second
}

// Stop progress polling
function stopProgressPolling() {
  if (progressPollingInterval) {
    clearInterval(progressPollingInterval);
    progressPollingInterval = null;
  }
}

// Handle sync in background
async function handleSync(cookies, token, forceRefresh = false, collections = []) {
  const collectionNames = collections.map(c => c.name).join(', ');
  console.log(`[GramGrab] Starting sync... (forceRefresh: ${forceRefresh}, collections: ${collectionNames || 'None'})`);
  console.log('[GramGrab] Cookies:', {
    sessionId: cookies.sessionId ? 'present' : 'missing',
    csrfToken: cookies.csrfToken ? 'present' : 'missing',
    dsUserId: cookies.dsUserId ? 'present' : 'missing',
    igWwwClaim: cookies.igWwwClaim ? cookies.igWwwClaim.substring(0, 20) + '...' : 'missing',
  });

  // Build initial message based on options
  let initialMessage = 'Connecting to Instagram...';
  if (collections.length === 1) {
    initialMessage = `Syncing "${collections[0].name}"...`;
  } else if (collections.length > 1) {
    initialMessage = `Syncing ${collections.length} collections...`;
  } else if (forceRefresh) {
    initialMessage = 'Starting full scan...';
  }

  // Update state to syncing
  await updateSyncState({
    status: 'syncing',
    progress: 5,
    message: initialMessage,
    startedAt: Date.now(),
    totalFetched: 0,
    newPosts: 0,
    skippedPosts: 0,
    collections: collections,
  });
  setBadge('...', '#f59e0b');

  // Start polling for progress from backend
  startProgressPolling(token);

  try {
    // Call sync API
    console.log('[GramGrab] Calling API:', `${GRAMGRAB_API_URL}/instagram/sync`);

    const requestBody = {
      ...cookies,
      forceRefresh,
      collections: collections,
    };

    const response = await fetch(`${GRAMGRAB_API_URL}/instagram/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Stop polling when API returns
    stopProgressPolling();

    console.log('[GramGrab] API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[GramGrab] API error:', errorData);
      throw new Error(errorData.message || `Sync failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[GramGrab] Sync result:', result);

    // Update state to complete
    await updateSyncState({
      status: 'complete',
      progress: 100,
      message: 'Complete!',
      result: {
        newPosts: result.newPosts || 0,
        skippedPosts: result.skippedPosts || 0,
        totalFetched: result.totalFetched || 0,
      },
      completedAt: Date.now(),
    });
    setBadge(String(result.newPosts || 0), '#16a34a');

    return { success: true, result };

  } catch (error) {
    // Stop polling on error
    stopProgressPolling();

    console.error('[GramGrab] Sync error:', error);

    // Update state to error
    await updateSyncState({
      status: 'error',
      progress: 0,
      message: error.message || 'Sync failed',
      error: error.message,
      failedAt: Date.now(),
    });
    setBadge('!', '#dc2626');

    return { success: false, error: error.message };
  }
}

// Update sync state in storage
async function updateSyncState(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SYNC_STATE_KEY]: state }, resolve);
  });
}

// Get Instagram cookies
async function getInstagramCookies() {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ domain: '.instagram.com' }, (cookies) => {
      const sessionCookie = cookies.find(c => c.name === 'sessionid');
      const csrfCookie = cookies.find(c => c.name === 'csrftoken');
      const dsUserIdCookie = cookies.find(c => c.name === 'ds_user_id');

      if (sessionCookie && csrfCookie) {
        resolve({
          success: true,
          cookies: {
            sessionId: sessionCookie.value,
            csrfToken: csrfCookie.value,
            dsUserId: dsUserIdCookie?.value,
          },
        });
      } else {
        resolve({
          success: false,
          error: 'Not logged into Instagram',
        });
      }
    });
  });
}

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('GramGrab extension installed');
  } else if (details.reason === 'update') {
    console.log('GramGrab extension updated');
  }
});

// Badge to show sync status
function setBadge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Listen for cookie changes (Instagram login/logout)
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie.domain.includes('instagram.com') &&
      changeInfo.cookie.name === 'sessionid') {
    if (changeInfo.removed) {
      console.log('Instagram session ended');
      setBadge('!', '#dc2626');
    } else {
      console.log('Instagram session started');
      setBadge('', '#16a34a');
    }
  }
});
