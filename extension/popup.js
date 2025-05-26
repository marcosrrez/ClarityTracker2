// Popup script for ClarityLog extension
document.addEventListener('DOMContentLoaded', function() {
  const captureArticleBtn = document.getElementById('captureArticle');
  const captureSelectionBtn = document.getElementById('captureSelection');
  const statusDiv = document.getElementById('status');
  const settingsLink = document.getElementById('openSettings');

  // Show status message
  function showStatus(message, type = 'loading') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
  }

  // Hide status message
  function hideStatus() {
    statusDiv.style.display = 'none';
  }

  // Get ClarityLog server URL from storage
  async function getServerUrl() {
    const result = await chrome.storage.sync.get(['claritylogUrl']);
    return result.claritylogUrl || 'http://localhost:5000';
  }

  // Capture full article
  captureArticleBtn.addEventListener('click', async function() {
    try {
      showStatus('Capturing article...', 'loading');
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script to extract article content
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractArticleContent
      });
      
      const articleData = results[0].result;
      
      if (!articleData.content || articleData.content.length < 100) {
        showStatus('No substantial content found', 'error');
        return;
      }
      
      // Send to ClarityLog for AI analysis
      await sendToClarityLog(articleData);
      
      showStatus('✅ Added to ClarityLog!', 'success');
      setTimeout(() => window.close(), 1500);
      
    } catch (error) {
      console.error('Error capturing article:', error);
      showStatus('Failed to capture content', 'error');
    }
  });

  // Capture selected text
  captureSelectionBtn.addEventListener('click', async function() {
    try {
      showStatus('Capturing selection...', 'loading');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getSelectedText
      });
      
      const selectionData = results[0].result;
      
      if (!selectionData.content || selectionData.content.length < 20) {
        showStatus('Please select some text first', 'error');
        return;
      }
      
      await sendToClarityLog(selectionData);
      
      showStatus('✅ Selection added!', 'success');
      setTimeout(() => window.close(), 1500);
      
    } catch (error) {
      console.error('Error capturing selection:', error);
      showStatus('Failed to capture selection', 'error');
    }
  });

  // Send content to ClarityLog
  async function sendToClarityLog(contentData) {
    const serverUrl = await getServerUrl();
    
    // Get auth token from storage
    const authResult = await chrome.storage.sync.get(['claritylogAuth']);
    
    if (!authResult.claritylogAuth) {
      throw new Error('Please configure ClarityLog authentication');
    }
    
    const response = await fetch(`${serverUrl}/api/capture-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authResult.claritylogAuth}`
      },
      body: JSON.stringify(contentData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to send to ClarityLog');
    }
  }

  // Open settings
  settingsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });
});

// Content extraction functions (injected into page)
function extractArticleContent() {
  // Remove unwanted elements
  const unwantedSelectors = [
    'script', 'style', 'nav', 'header', 'footer', 
    '.advertisement', '.ad', '.sidebar', '.comments'
  ];
  
  unwantedSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // Try to find main content
  const contentSelectors = [
    'main', 'article', '[role="main"]',
    '.content', '.post', '.entry', '.article-body'
  ];
  
  let mainContent = null;
  for (const selector of contentSelectors) {
    mainContent = document.querySelector(selector);
    if (mainContent) break;
  }
  
  // Fallback to body if no main content found
  if (!mainContent) {
    mainContent = document.body;
  }
  
  // Extract text content
  const content = mainContent.textContent || mainContent.innerText || '';
  
  return {
    title: document.title,
    url: window.location.href,
    content: content.replace(/\s+/g, ' ').trim(),
    timestamp: new Date().toISOString()
  };
}

function getSelectedText() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  return {
    title: `Selection from ${document.title}`,
    url: window.location.href,
    content: selectedText,
    timestamp: new Date().toISOString()
  };
}