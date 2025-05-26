// Background service worker for ClarityLog extension
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for right-click capture
  chrome.contextMenus.create({
    id: "captureToClarity",
    title: "Add to ClarityLog",
    contexts: ["selection", "page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "captureToClarity") {
    try {
      const contentData = {
        title: info.selectionText ? `Selection from ${tab.title}` : tab.title,
        url: tab.url,
        content: info.selectionText || "",
        type: info.selectionText ? "selection" : "page",
        timestamp: new Date().toISOString()
      };

      await sendToClarityLog(contentData);
      
      // Show success notification
      chrome.tabs.sendMessage(tab.id, {
        action: "showNotification",
        type: "success",
        message: "Added to ClarityLog!"
      });
      
    } catch (error) {
      console.error("Context menu capture failed:", error);
      chrome.tabs.sendMessage(tab.id, {
        action: "showNotification", 
        type: "error",
        message: "Capture failed"
      });
    }
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureContent") {
    handleContentCapture(request.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Send content to ClarityLog API
async function sendToClarityLog(contentData) {
  try {
    // Get server URL and auth from storage
    const settings = await chrome.storage.sync.get(['claritylogUrl', 'claritylogAuth']);
    const serverUrl = settings.claritylogUrl || 'http://localhost:5000';
    
    if (!settings.claritylogAuth) {
      throw new Error('Please configure authentication in extension settings');
    }

    // For now, we'll create insight cards directly since that's what works
    // In the future, this could be enhanced to use a dedicated API endpoint
    const response = await fetch(`${serverUrl}/api/insight-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.claritylogAuth}`,
        'X-Extension-Capture': 'true'
      },
      body: JSON.stringify({
        type: 'note',
        title: contentData.title,
        content: `**Captured from:** ${contentData.url}\n\n${contentData.content}`,
        tags: ['web-capture', 'extension', 'professional-development'],
        originalUrl: contentData.url
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('Failed to send to ClarityLog:', error);
    throw error;
  }
}

// Handle content capture with AI analysis
async function handleContentCapture(contentData) {
  try {
    if (!contentData.content || contentData.content.length < 20) {
      throw new Error('No content to capture');
    }

    await sendToClarityLog(contentData);
    
    return { success: true };
    
  } catch (error) {
    console.error('Content capture failed:', error);
    return { success: false, error: error.message };
  }
}