# GramGrab Chrome Extension

This extension allows you to sync your saved Instagram posts to GramGrab for easy recipe importing.

## Installation

### Development Installation

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select this `extension` folder
5. Pin the extension to your toolbar for easy access

### Production Installation

1. Download the extension from the GramGrab website
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right corner
4. Drag and drop the downloaded `.crx` file onto the extensions page
5. Click "Add extension" when prompted

## Usage

1. Make sure you're logged into Instagram in your browser
2. Make sure you're logged into GramGrab in your browser
3. Click the GramGrab extension icon
4. Click "Sync Saved Posts"
5. Wait for the sync to complete
6. Click "View in GramGrab" to see your imported posts

## Icon Files

You need to create the following icon files in the `icons` folder:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

Use the GramGrab logo (chef hat) with the orange gradient background.

## Configuration

In `popup.js`, update the following URLs for production:

```javascript
const GRAMGRAB_API_URL = 'https://api.gramgrab.com/api';
const GRAMGRAB_APP_URL = 'https://gramgrab.com';
```

## Troubleshooting

### "Not logged into Instagram"
- Make sure you're logged into Instagram in the same browser
- Try refreshing the Instagram page

### "Not logged into GramGrab"
- Make sure you're logged into GramGrab in the same browser
- Try refreshing the GramGrab page

### "Sync failed"
- Check your internet connection
- Make sure both Instagram and GramGrab sessions are active
- Try logging out and back in to both services
