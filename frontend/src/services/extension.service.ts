// Extension Bridge Service
// Communicates with the SavorPilot Chrome extension via content script

interface ExtensionResponse {
  success: boolean;
  error?: string;
  version?: string;
  videoUrl?: string;
  imageUrl?: string;
}

/**
 * Check if the SavorPilot extension is installed and available
 */
export function isExtensionAvailable(): boolean {
  return !!(window as any).__GRAMGRAB_EXTENSION_AVAILABLE__;
}

/**
 * Check extension availability via ping (more reliable)
 */
export function pingExtension(): Promise<boolean> {
  return new Promise((resolve) => {
    const messageId = `ping-${Date.now()}`;

    const handlePong = (event: MessageEvent) => {
      if (event.data?.type === 'GRAMGRAB_PONG' && event.data?.messageId === messageId) {
        window.removeEventListener('message', handlePong);
        resolve(true);
      }
    };

    window.addEventListener('message', handlePong);
    window.postMessage({ type: 'GRAMGRAB_PING', messageId }, '*');

    // Timeout after 500ms
    setTimeout(() => {
      window.removeEventListener('message', handlePong);
      resolve(false);
    }, 500);
  });
}

/**
 * Wait for extension to be ready (with timeout)
 */
export function waitForExtension(timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    // Already available
    if (isExtensionAvailable()) {
      resolve(true);
      return;
    }

    const handleReady = (event: MessageEvent) => {
      if (event.data?.type === 'GRAMGRAB_EXTENSION_READY') {
        window.removeEventListener('message', handleReady);
        resolve(true);
      }
    };

    window.addEventListener('message', handleReady);

    // Timeout
    setTimeout(() => {
      window.removeEventListener('message', handleReady);
      resolve(isExtensionAvailable());
    }, timeoutMs);
  });
}

/**
 * Request video refresh from the extension
 */
export async function refreshVideoViaExtension(
  recipeId: string,
  shortcode: string
): Promise<ExtensionResponse> {
  // First verify extension is responding
  const extensionReady = isExtensionAvailable() || await pingExtension();
  if (!extensionReady) {
    return {
      success: false,
      error: 'SavorPilot extension not detected. Please install and enable the extension, then refresh the page.',
    };
  }

  return new Promise((resolve) => {
    const messageId = `gramgrab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const handleResponse = (event: MessageEvent) => {
      if (event.data?.type === 'GRAMGRAB_REFRESH_VIDEO_RESPONSE' &&
          event.data?.messageId === messageId) {
        window.removeEventListener('message', handleResponse);
        resolve(event.data.response);
      }
    };

    window.addEventListener('message', handleResponse);

    // Send request to extension via postMessage
    window.postMessage({
      type: 'GRAMGRAB_REFRESH_VIDEO_REQUEST',
      messageId,
      recipeId,
      shortcode,
    }, '*');

    // Timeout after 60 seconds (video download can take a while)
    setTimeout(() => {
      window.removeEventListener('message', handleResponse);
      resolve({
        success: false,
        error: 'Request timed out. Please try again.',
      });
    }, 60000);
  });
}

/**
 * Request image refresh from the extension
 * Gets fresh image URL from Instagram and downloads to server
 */
export async function refreshImageViaExtension(
  recipeId: string,
  shortcode: string
): Promise<ExtensionResponse> {
  // First verify extension is responding
  const extensionReady = isExtensionAvailable() || await pingExtension();
  if (!extensionReady) {
    return {
      success: false,
      error: 'SavorPilot extension not detected. Please install and enable the extension, then refresh the page.',
    };
  }

  return new Promise((resolve) => {
    const messageId = `gramgrab-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const handleResponse = (event: MessageEvent) => {
      if (event.data?.type === 'GRAMGRAB_REFRESH_IMAGE_RESPONSE' &&
          event.data?.messageId === messageId) {
        window.removeEventListener('message', handleResponse);
        resolve(event.data.response);
      }
    };

    window.addEventListener('message', handleResponse);

    // Send request to extension via postMessage
    window.postMessage({
      type: 'GRAMGRAB_REFRESH_IMAGE_REQUEST',
      messageId,
      recipeId,
      shortcode,
    }, '*');

    // Timeout after 30 seconds
    setTimeout(() => {
      window.removeEventListener('message', handleResponse);
      resolve({
        success: false,
        error: 'Request timed out. Please try again.',
      });
    }, 30000);
  });
}

/**
 * Extract shortcode from Instagram URL
 */
export function extractShortcode(url: string): string | null {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}
