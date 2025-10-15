// public/embed-advanced.js
// Advanced version with Shadow DOM for complete CSS isolation
// Use this when you need guaranteed style isolation from host page

(function(window, document) {
  'use strict';

  const EmbedWidget = window.EmbedWidget || {};
  EmbedWidget.instances = {};
  EmbedWidget.config = {};
  
  // Feature detection
  const supportsShadowDOM = !!HTMLElement.prototype.attachShadow;
  
  EmbedWidget.init = function(widgetId, encodedConfig) {
    try {
      const config = JSON.parse(atob(encodedConfig));
      EmbedWidget.config[widgetId] = config;
      
      // Create host container
      const hostContainer = document.createElement('div');
      hostContainer.id = `embed-widget-host-${widgetId}`;
      hostContainer.className = 'embed-widget-host';
      
      // Apply position styles to host
      applyPositionStyles(hostContainer, config.designTokens.position);
      
      // Insert into DOM
      insertContainer(hostContainer, config.designTokens.position);
      
      // Create widget with or without Shadow DOM
      const widgetContainer = supportsShadowDOM 
        ? createShadowWidget(hostContainer, widgetId, config)
        : createStandardWidget(hostContainer, widgetId, config);
      
      // Load content
      loadContent(widgetId, config, widgetContainer);
      
      EmbedWidget.instances[widgetId] = {
        host: hostContainer,
        container: widgetContainer,
        config,
        state: { isOpen: true, minimized: false }
      };
      
      // Expose public API
      window[`updateWidget_${widgetId}`] = function(newData) {
        updateWidgetContent(widgetId, newData);
      };
      
      window[`minimizeWidget_${widgetId}`] = function() {
        toggleMinimize(widgetId);
      };
      
    } catch (error) {
      console.error('EmbedWidget initialization error:', error);
    }
  };
  
  // Create widget with Shadow DOM for complete isolation
  function createShadowWidget(host, widgetId, config) {
    const shadow = host.attachShadow({ mode: 'open' });
    
    // Inject styles into Shadow DOM
    const styleSheet = document.createElement('style');
    styleSheet.textContent = generateWidgetStyles(config.designTokens);
    shadow.appendChild(styleSheet);
    
    // Create widget container
    const container = document.createElement('div');
    container.id = `widget-${widgetId}`;
    container.className = 'widget-container';
    shadow.appendChild(container);
    
    return container;
  }
  
  // Fallback for browsers without Shadow DOM support
  function createStandardWidget(host, widgetId, config) {
    const container = document.createElement('div');
    container.id = `widget-${widgetId}`;
    container.className = 'embed-widget-container';
    
    // Inject scoped styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = generateScopedStyles(widgetId, config.designTokens);
    document.head.appendChild(styleSheet);
    
    host.appendChild(container);
    return container;
  }
  
  // Generate CSS for Shadow DOM
  function generateWidgetStyles(tokens) {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .widget-container {
        font-family: ${tokens.fontFamily};
        color: ${tokens.textColor};
        font-size: 14px;
        line-height: 1.5;
      }
      
      .widget-main {
        background: ${tokens.backgroundColor};
        border-radius: ${tokens.borderRadius};
        padding: ${tokens.padding};
        max-width: ${tokens.maxWidth};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      
      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      .widget-title {
        font-size: 18px;
        font-weight: 600;
        color: ${tokens.primaryColor};
        margin: 0;
      }
      
      .widget-controls {
        display: flex;
        gap: 8px;
      }
      
      .widget-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        font-size: 18px;
        color: ${tokens.textColor};
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      
      .widget-btn:hover {
        opacity: 1;
      }
      
      .widget-content {
        margin-bottom: 15px;
      }
      
      .widget-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: ${tokens.fontFamily};
        font-size: 14px;
        transition: border-color 0.2s;
      }
      
      .widget-input:focus {
        outline: none;
        border-color: ${tokens.primaryColor};
      }
      
      .widget-textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: ${tokens.fontFamily};
        font-size: 14px;
        resize: vertical;
        min-height: 80px;
      }
      
      .widget-textarea:focus {
        outline: none;
        border-color: ${tokens.primaryColor};
      }
      
      .widget-button {
        background: ${tokens.primaryColor};
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: opacity 0.2s;
        width: 100%;
      }
      
      .widget-button:hover {
        opacity: 0.9;
      }
      
      .widget-button:active {
        transform: translateY(1px);
      }
      
      .chat-messages {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 15px;
        padding: 10px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .chat-message {
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 14px;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .chat-message.user {
        background: ${tokens.primaryColor};
        color: white;
        margin-left: 20px;
        text-align: right;
      }
      
      .chat-message.bot {
        background: white;
        color: ${tokens.textColor};
        margin-right: 20px;
        border: 1px solid #e5e7eb;
      }
      
      .chat-input-group {
        display: flex;
        gap: 8px;
      }
      
      .form-group {
        margin-bottom: 12px;
      }
      
      .form-label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        font-size: 13px;
      }
      
      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-top-color: ${tokens.primaryColor};
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .minimized {
        max-height: 60px;
        overflow: hidden;
      }
      
      .minimized .widget-content,
      .minimized .widget-controls {
        display: none;
      }
    `;
  }
  
  // Generate scoped CSS for non-Shadow DOM browsers
  function generateScopedStyles(widgetId, tokens) {
    return generateWidgetStyles(tokens)
      .replace(/\./g, `.embed-widget-${widgetId} .`);
  }
  
  function applyPositionStyles(element, position) {
    const baseStyles = {
      'z-index': '999999',
      'box-sizing': 'border-box'
    };
    
    const positionStyles = {
      'inline': {},
      'fixed-bottom-right': {
        'position': 'fixed',
        'bottom': '20px',
        'right': '20px',
        'max-width': '400px'
      },
      'fixed-bottom-left': {
        'position': 'fixed',
        'bottom': '20px',
        'left': '20px',
        'max-width': '400px'
      }
    };
    
    const styles = { ...baseStyles, ...(positionStyles[position] || {}) };
    Object.keys(styles).forEach(key => {
      element.style[key] = styles[key];
    });
  }
  
  function insertContainer(container, position) {
    if (position === 'inline') {
      const scripts = document.getElementsByTagName('script');
      const currentScript = scripts[scripts.length - 1];
      currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
    } else {
      document.body.appendChild(container);
    }
  }
  
  function loadContent(widgetId, config, container) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const baseUrl = getBaseUrl();
    fetch(`${baseUrl}${config.apiEndpoint}?widgetId=${widgetId}&type=${config.contentType}`)
      .then(response => response.json())
      .then(data => {
        renderWidget(container, data, config, widgetId);
      })
      .catch(error => {
        console.error('Failed to load widget content:', error);
        container.innerHTML = '<div class="widget-main"><p>Failed to load widget</p></div>';
      });
  }
  
  function getBaseUrl() {
    const script = document.getElementById('embed');
    if (script && script.src) {
      const url = new URL(script.src);
      return `${url.protocol}//${url.host}`;
    }
    return '';
  }
  
  function renderWidget(container, data, config, widgetId) {
    const html = generateWidgetHTML(data, config, widgetId);
    container.innerHTML = html;
    attachEventListeners(container, widgetId, config);
  }
  
  function generateWidgetHTML(data, config, widgetId) {
    const { contentType } = config;
    
    const headerHTML = `
      <div class="widget-header">
        <h3 class="widget-title">${data.title || 'Widget'}</h3>
        <div class="widget-controls">
          <button class="widget-btn minimize-btn" title="Minimize">−</button>
          <button class="widget-btn close-btn" title="Close">×</button>
        </div>
      </div>
    `;
    
    let contentHTML = '';
    
    switch (contentType) {
      case 'chat':
        contentHTML = `
          <div class="chat-messages" id="chat-messages-${widgetId}">
            <div class="chat-message bot">${data.message || 'How can we help you?'}</div>
          </div>
          <div class="chat-input-group">
            <input type="text" class="widget-input chat-input" placeholder="Type a message..." />
            <button class="widget-button send-btn">Send</button>
          </div>
        `;
        break;
        
      case 'form':
        contentHTML = `
          <form class="widget-form">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" name="name" class="widget-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" name="email" class="widget-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Message</label>
              <textarea name="message" class="widget-textarea" required></textarea>
            </div>
            <button type="submit" class="widget-button">Submit</button>
          </form>
        `;
        break;
        
      default:
        contentHTML = `
          <div class="widget-content">
            <p>${data.message || 'Widget content'}</p>
          </div>
        `;
    }
    
    return `
      <div class="widget-main">
        ${headerHTML}
        <div class="widget-content">
          ${contentHTML}
        </div>
      </div>
    `;
  }
  
  function attachEventListeners(container, widgetId, config) {
    // Close button
    const closeBtn = container.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const instance = EmbedWidget.instances[widgetId];
        instance.host.style.display = 'none';
        instance.state.isOpen = false;
      });
    }
    
    // Minimize button
    const minimizeBtn = container.querySelector('.minimize-btn');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        toggleMinimize(widgetId);
      });
    }
    
    // Form submission
    const form = container.querySelector('.widget-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        const baseUrl = getBaseUrl();
        fetch(`${baseUrl}/api/embed/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetId, data })
        })
        .then(response => response.json())
        .then(result => {
          alert('Form submitted successfully!');
          form.reset();
        })
        .catch(error => {
          console.error('Form submission error:', error);
          alert('Failed to submit form');
        });
      });
    }
    
    // Chat functionality
    const sendBtn = container.querySelector('.send-btn');
    const chatInput = container.querySelector('.chat-input');
    if (sendBtn && chatInput) {
      const sendMessage = () => {
        const message = chatInput.value.trim();
        if (message) {
          addChatMessage(widgetId, message, 'user');
          chatInput.value = '';
          
          const baseUrl = getBaseUrl();
          fetch(`${baseUrl}/api/embed/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ widgetId, message })
          })
          .then(response => response.json())
          .then(data => {
            addChatMessage(widgetId, data.reply, 'bot');
          })
          .catch(error => {
            console.error('Chat error:', error);
            addChatMessage(widgetId, 'Sorry, there was an error processing your message.', 'bot');
          });
        }
      };
      
      sendBtn.addEventListener('click', sendMessage);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
  }
  
  function addChatMessage(widgetId, message, sender) {
    const instance = EmbedWidget.instances[widgetId];
    const chatMessages = instance.container.querySelector(`#chat-messages-${widgetId}`);
    
    if (chatMessages) {
      const messageEl = document.createElement('div');
      messageEl.className = `chat-message ${sender}`;
      messageEl.textContent = message;
      chatMessages.appendChild(messageEl);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  function toggleMinimize(widgetId) {
    const instance = EmbedWidget.instances[widgetId];
    const widgetMain = instance.container.querySelector('.widget-main');
    const minimizeBtn = instance.container.querySelector('.minimize-btn');
    
    if (widgetMain) {
      instance.state.minimized = !instance.state.minimized;
      
      if (instance.state.minimized) {
        widgetMain.classList.add('minimized');
        minimizeBtn.textContent = '+';
        minimizeBtn.title = 'Expand';
      } else {
        widgetMain.classList.remove('minimized');
        minimizeBtn.textContent = '−';
        minimizeBtn.title = 'Minimize';
      }
    }
  }
  
  function updateWidgetContent(widgetId, newData) {
    const instance = EmbedWidget.instances[widgetId];
    if (instance) {
      renderWidget(instance.container, newData, instance.config, widgetId);
    }
  }
  
  // Process queued calls
  if (window.EmbedWidget && window.EmbedWidget.q) {
    window.EmbedWidget.q.forEach(function(args) {
      if (args[0] === 'init') {
        EmbedWidget.init(args[1], args[2]);
      }
    });
  }
  
  // Replace stub with real implementation
  window.EmbedWidget = EmbedWidget;
  
  // Log Shadow DOM support status
  console.log('EmbedWidget: Shadow DOM', supportsShadowDOM ? 'supported' : 'not supported (using fallback)');
  
})(window, document);