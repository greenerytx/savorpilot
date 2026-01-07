// GramGrab Content Script
// Bridges communication between the web app and the extension

console.log('[GramGrab] Content script loaded');

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    // chrome.runtime.id will be undefined if context is invalidated
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

// Listen for messages from the web page
window.addEventListener('message', async (event) => {
  // Only accept messages from same origin
  if (event.source !== window) return;

  const { type, messageId, recipeId, shortcode } = event.data || {};

  // Handle video refresh request
  if (type === 'GRAMGRAB_REFRESH_VIDEO_REQUEST') {
    console.log('[GramGrab] Received video refresh request:', { recipeId, shortcode });

    // Check if extension context is still valid
    if (!isExtensionContextValid()) {
      console.error('[GramGrab] Extension context invalidated. Please refresh the page.');
      window.postMessage({
        type: 'GRAMGRAB_REFRESH_VIDEO_RESPONSE',
        messageId,
        response: {
          success: false,
          error: 'Extension was updated or reloaded. Please refresh this page and try again.'
        },
      }, '*');
      return;
    }

    try {
      // Forward to background script
      const response = await chrome.runtime.sendMessage({
        type: 'REFRESH_VIDEO',
        recipeId,
        shortcode,
      });

      // Send response back to web page
      window.postMessage({
        type: 'GRAMGRAB_REFRESH_VIDEO_RESPONSE',
        messageId,
        response: response || { success: false, error: 'No response from extension' },
      }, '*');

    } catch (error) {
      console.error('[GramGrab] Error forwarding message:', error);

      // Check if it's a context invalidation error
      const isContextError = error.message?.includes('Extension context invalidated') ||
                            error.message?.includes('Cannot read properties of undefined');

      window.postMessage({
        type: 'GRAMGRAB_REFRESH_VIDEO_RESPONSE',
        messageId,
        response: {
          success: false,
          error: isContextError
            ? 'Extension was updated or reloaded. Please refresh this page and try again.'
            : (error.message || 'Extension error')
        },
      }, '*');
    }
  }

  // Handle image refresh request
  if (type === 'GRAMGRAB_REFRESH_IMAGE_REQUEST') {
    console.log('[GramGrab] Received image refresh request:', { recipeId, shortcode });

    // Check if extension context is still valid
    if (!isExtensionContextValid()) {
      console.error('[GramGrab] Extension context invalidated. Please refresh the page.');
      window.postMessage({
        type: 'GRAMGRAB_REFRESH_IMAGE_RESPONSE',
        messageId,
        response: {
          success: false,
          error: 'Extension was updated or reloaded. Please refresh this page and try again.'
        },
      }, '*');
      return;
    }

    try {
      // Forward to background script
      const response = await chrome.runtime.sendMessage({
        type: 'REFRESH_IMAGE',
        recipeId,
        shortcode,
      });

      // Send response back to web page
      window.postMessage({
        type: 'GRAMGRAB_REFRESH_IMAGE_RESPONSE',
        messageId,
        response: response || { success: false, error: 'No response from extension' },
      }, '*');

    } catch (error) {
      console.error('[GramGrab] Error forwarding image message:', error);

      // Check if it's a context invalidation error
      const isContextError = error.message?.includes('Extension context invalidated') ||
                            error.message?.includes('Cannot read properties of undefined');

      window.postMessage({
        type: 'GRAMGRAB_REFRESH_IMAGE_RESPONSE',
        messageId,
        response: {
          success: false,
          error: isContextError
            ? 'Extension was updated or reloaded. Please refresh this page and try again.'
            : (error.message || 'Extension error')
        },
      }, '*');
    }
  }

  // Handle ping request (check if extension is available)
  if (type === 'GRAMGRAB_PING') {
    // Check if context is still valid
    const contextValid = isExtensionContextValid();

    window.postMessage({
      type: 'GRAMGRAB_PONG',
      messageId,
      available: contextValid,
      version: '1.0.3',
      needsRefresh: !contextValid,
    }, '*');
  }
});

// Notify the page that extension is ready
window.postMessage({ type: 'GRAMGRAB_EXTENSION_READY', version: '1.0.1' }, '*');
