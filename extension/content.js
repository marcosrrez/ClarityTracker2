// Content script for ClarityLog extension
(function() {
  'use strict';

  // Create floating capture button
  function createCaptureButton() {
    const button = document.createElement('div');
    button.id = 'claritylog-capture-btn';
    button.innerHTML = `
      <div class="claritylog-btn-icon">📄</div>
      <div class="claritylog-btn-text">Add to ClarityLog</div>
    `;
    
    button.addEventListener('click', handleCapture);
    document.body.appendChild(button);
    
    return button;
  }

  // Handle capture action
  async function handleCapture() {
    try {
      const button = document.getElementById('claritylog-capture-btn');
      button.classList.add('capturing');
      button.innerHTML = `
        <div class="claritylog-btn-icon">⏳</div>
        <div class="claritylog-btn-text">Capturing...</div>
      `;
      
      // Extract content
      const contentData = extractPageContent();
      
      // Send to background script
      chrome.runtime.sendMessage({
        action: 'captureContent',
        data: contentData
      }, (response) => {
        if (response.success) {
          showSuccessMessage();
        } else {
          showErrorMessage(response.error);
        }
        
        // Reset button
        setTimeout(() => {
          button.classList.remove('capturing');
          button.innerHTML = `
            <div class="claritylog-btn-icon">📄</div>
            <div class="claritylog-btn-text">Add to ClarityLog</div>
          `;
        }, 2000);
      });
      
    } catch (error) {
      console.error('ClarityLog capture error:', error);
      showErrorMessage('Failed to capture content');
    }
  }

  // Extract content from current page
  function extractPageContent() {
    // Get selected text if any
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 20) {
      return {
        title: `Selection from ${document.title}`,
        url: window.location.href,
        content: selectedText,
        type: 'selection',
        timestamp: new Date().toISOString()
      };
    }
    
    // Otherwise extract full article
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 
      '.advertisement', '.ad', '.sidebar', '.comments',
      '#claritylog-capture-btn', '.claritylog-notification'
    ];
    
    // Clone document to avoid modifying original
    const docClone = document.cloneNode(true);
    
    unwantedSelectors.forEach(selector => {
      docClone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // Find main content
    const contentSelectors = [
      'main', 'article', '[role="main"]',
      '.content', '.post', '.entry', '.article-body',
      '.post-content', '.entry-content'
    ];
    
    let mainContent = null;
    for (const selector of contentSelectors) {
      mainContent = docClone.querySelector(selector);
      if (mainContent && mainContent.textContent.trim().length > 200) break;
    }
    
    if (!mainContent) {
      mainContent = docClone.body;
    }
    
    const content = mainContent.textContent || mainContent.innerText || '';
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    
    return {
      title: document.title,
      url: window.location.href,
      content: cleanContent,
      type: 'article',
      timestamp: new Date().toISOString()
    };
  }

  // Show success notification
  function showSuccessMessage() {
    const notification = document.createElement('div');
    notification.className = 'claritylog-notification success';
    notification.innerHTML = `
      <div class="claritylog-notification-content">
        <div class="claritylog-notification-icon">✅</div>
        <div class="claritylog-notification-text">Added to ClarityLog!</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Show error notification
  function showErrorMessage(error) {
    const notification = document.createElement('div');
    notification.className = 'claritylog-notification error';
    notification.innerHTML = `
      <div class="claritylog-notification-content">
        <div class="claritylog-notification-icon">❌</div>
        <div class="claritylog-notification-text">${error || 'Capture failed'}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Initialize extension on page load
  function init() {
    // Check if we should show the button on this page
    if (document.body && !document.getElementById('claritylog-capture-btn')) {
      // Skip on certain domains/pages
      const skipDomains = ['chrome-extension://', 'chrome://', 'moz-extension://'];
      if (skipDomains.some(domain => window.location.href.startsWith(domain))) {
        return;
      }
      
      createCaptureButton();
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();