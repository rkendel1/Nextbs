// public/embed.js
// This is the actual embed script that gets loaded on third-party sites

(function(window, document) {
  'use strict';

  // Namespace for our embed widget
  const EmbedWidget = window.EmbedWidget || {};
  
  // Store configuration and state
  EmbedWidget.instances = {};
  EmbedWidget.config = {};
  
  // Main initialization function
  EmbedWidget.init = function(widgetId, encodedConfig) {
    try {
      // Decode configuration
      const config = JSON.parse(atob(encodedConfig));
      EmbedWidget.config[widgetId] = config;
      
      // Create container
      const container = document.createElement('div');
      container.id = `embed-widget-${widgetId}`;
      container.className = 'embed-widget-container';
      
      // Apply position styles
      applyPositionStyles(container, config.designTokens.position);
      
      // Insert into DOM
      if (config.designTokens.position === 'inline') {
        // Find script tag and insert after it
        const scripts = document.getElementsByTagName('script');
        const currentScript = scripts[scripts.length - 1];
        currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
      } else {
        // Append to body for fixed positioning
        document.body.appendChild(container);
      }
      
      // Load and render content
      loadContent(widgetId, config, container);
      
      // Store instance
      EmbedWidget.instances[widgetId] = {
        container,
        config,
        state: { isOpen: false }
      };
      
      // Expose update method
      window[`updateWidget_${widgetId}`] = function(newData) {
        updateWidgetContent(widgetId, newData);
      };
      
    } catch (error) {
      console.error('EmbedWidget initialization error:', error);
    }
  };
  
  // Apply position-based styles
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
        'right': '20px'
      },
      'fixed-bottom-left': {
        'position': 'fixed',
        'bottom': '20px',
        'left': '20px'
      }
    };
    
    const styles = { ...baseStyles, ...(positionStyles[position] || {}) };
    
    Object.keys(styles).forEach(key => {
      element.style[key] = styles[key];
    });
  }
  
  // Load content from API
  function loadContent(widgetId, config, container) {
    const { designTokens, apiEndpoint, contentType } = config;
    
    // Show loading state
    container.innerHTML = createLoadingHTML(designTokens);
    
    // Fetch content
    const baseUrl = getBaseUrl();
    fetch(`${baseUrl}${apiEndpoint}?widgetId=${widgetId}&type=${contentType}`)
      .then(response => response.json())
      .then(data => {
        renderWidget(container, data, designTokens, contentType, widgetId);
      })
      .catch(error => {
        console.error('Failed to load widget content:', error);
        container.innerHTML = createErrorHTML(designTokens);
      });
  }
  
  // Get base URL from script source
  function getBaseUrl() {
    const script = document.getElementById('embed');
    if (script && script.src) {
      const url = new URL(script.src);
      return `${url.protocol}//${url.host}`;
    }
    return '';
  }
  
  // Create loading HTML
  function createLoadingHTML(tokens) {
    return `
      <div style="
        background: ${tokens.backgroundColor};
        color: ${tokens.textColor};
        font-family: ${tokens.fontFamily};
        border-radius: ${tokens.borderRadius};
        padding: ${tokens.padding};
        max-width: ${tokens.maxWidth};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        text-align: center;
      ">
        <div style="
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid ${tokens.primaryColor}33;
          border-top-color: ${tokens.primaryColor};
          border-radius: 50%;
          animation: embed-spin 1s linear infinite;
        "></div>
        <style>
          @keyframes embed-spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  }
  
  // Create error HTML
  function createErrorHTML(tokens) {
    return `
      <div style="
        background: ${tokens.backgroundColor};
        color: ${tokens.textColor};
        font-family: ${tokens.fontFamily};
        border-radius: ${tokens.borderRadius};
        padding: ${tokens.padding};
        max-width: ${tokens.maxWidth};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ">
        <p style="margin: 0; color: #ef4444;">Failed to load widget</p>
      </div>
    `;
  }
  
  // Render the actual widget
  function renderWidget(container, data, tokens, contentType, widgetId) {
    const widgetHTML = generateWidgetHTML(data, tokens, contentType, widgetId);
    container.innerHTML = widgetHTML;
    
    // Attach event listeners
    attachEventListeners(container, widgetId);
  }
  
  // Generate widget HTML based on content type
  function generateWidgetHTML(data, tokens, contentType, widgetId) {
    const baseStyle = `
      background: ${tokens.backgroundColor};
      color: ${tokens.textColor};
      font-family: ${tokens.fontFamily};
      border-radius: ${tokens.borderRadius};
      padding: ${tokens.padding};
      max-width: ${tokens.maxWidth};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 1px solid rgba(0,0,0,0.1);
    `;
    
    switch (contentType) {
      case 'chat':
        return `
          <div style="${baseStyle}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3 style="margin: 0; color: ${tokens.primaryColor}; font-size: 18px;">
                ${data.title || 'Chat with us'}
              </h3>
              <button class="embed-close" style="background: none; border: none; cursor: pointer; font-size: 20px; color: ${tokens.textColor};">×</button>
            </div>
            <div id="chat-messages-${widgetId}" style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.5;">${data.message || 'How can we help you today?'}</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <input 
                type="text" 
                placeholder="Type a message..." 
                class="embed-input"
                style="
                  flex: 1;
                  padding: 10px;
                  border: 1px solid #ddd;
                  border-radius: 6px;
                  font-family: ${tokens.fontFamily};
                  font-size: 14px;
                "
              />
              <button 
                class="embed-send"
                style="
                  background: ${tokens.primaryColor};
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 600;
                  font-size: 14px;
                "
              >Send</button>
            </div>
          </div>
        `;
        
      case 'form':
        return `
          <div style="${baseStyle}">
            <h3 style="margin: 0 0 15px 0; color: ${tokens.primaryColor}; font-size: 18px;">
              ${data.title || 'Contact Us'}
            </h3>
            <form class="embed-form" style="display: flex; flex-direction: column; gap: 12px;">
              <input 
                type="text" 
                name="name"
                placeholder="Your Name" 
                required
                style="
                  padding: 10px;
                  border: 1px solid #ddd;
                  border-radius: 6px;
                  font-family: ${tokens.fontFamily};
                  font-size: 14px;
                "
              />
              <input 
                type="email" 
                name="email"
                placeholder="Your Email" 
                required
                style="
                  padding: 10px;
                  border: 1px solid #ddd;
                  border-radius: 6px;
                  font-family: ${tokens.fontFamily};
                  font-size: 14px;
                "
              />
              <textarea 
                name="message"
                placeholder="Your Message" 
                rows="4"
                required
                style="
                  padding: 10px;
                  border: 1px solid #ddd;
                  border-radius: 6px;
                  font-family: ${tokens.fontFamily};
                  font-size: 14px;
                  resize: vertical;
                "
              ></textarea>
              <button 
                type="submit"
                style="
                  background: ${tokens.primaryColor};
                  color: white;
                  border: none;
                  padding: 12px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 600;
                  font-size: 14px;
                "
              >Submit</button>
            </form>
          </div>
        `;
        
      case 'notification':
        return `
          <div style="${baseStyle} display: flex; align-items: start; gap: 12px;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 8px 0; color: ${tokens.primaryColor}; font-size: 16px;">
                ${data.title || 'Notification'}
              </h4>
              <p style="margin: 0; font-size: 14px; line-height: 1.5;">
                ${data.message || 'You have a new notification'}
              </p>
            </div>
            <button class="embed-close" style="background: none; border: none; cursor: pointer; font-size: 20px; color: ${tokens.textColor};">×</button>
          </div>
        `;
        
      default:
        return `
          <div style="${baseStyle}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="margin: 0 0 8px 0; color: ${tokens.primaryColor}; font-size: 18px;">
                  ${data.title || 'Custom Widget'}
                </h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.5;">
                  ${data.message || 'Custom content goes here'}
                </p>
              </div>
              <button class="embed-close" style="background: none; border: none; cursor: pointer; font-size: 20px; color: ${tokens.textColor};">×</button>
            </div>
          </div>
        `;
    }
  }
  
  // Attach event listeners to widget elements
  function attachEventListeners(container, widgetId) {
    const instance = EmbedWidget.instances[widgetId];
    
    // Close button
    const closeBtn = container.querySelector('.embed-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        container.style.display = 'none';
        instance.state.isOpen = false;
      });
    }
    
    // Form submission
    const form = container.querySelector('.embed-form');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Send to API
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
    
    // Chat send button
    const sendBtn = container.querySelector('.embed-send');
    const chatInput = container.querySelector('.embed-input');
    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', function() {
        const message = chatInput.value.trim();
        if (message) {
          addChatMessage(widgetId, message, 'user');
          chatInput.value = '';
          
          // Send to API and get response
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
          });
        }
      });
      
      chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendBtn.click();
        }
      });
    }
  }
  
  // Add chat message to the widget
  function addChatMessage(widgetId, message, sender) {
    const container = EmbedWidget.instances[widgetId].container;
    const chatMessages = container.querySelector(`#chat-messages-${widgetId}`);
    const tokens = EmbedWidget.config[widgetId].designTokens;
    
    if (chatMessages) {
      const messageEl = document.createElement('div');
      messageEl.style.cssText = `
        margin-top: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 14px;
        line-height: 1.5;
        ${sender === 'user' 
          ? `background: ${tokens.primaryColor}; color: white; margin-left: 20px; text-align: right;` 
          : `background: #f3f4f6; color: ${tokens.textColor}; margin-right: 20px;`}
      `;
      messageEl.textContent = message;
      chatMessages.appendChild(messageEl);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  // Update widget content dynamically
  function updateWidgetContent(widgetId, newData) {
    const instance = EmbedWidget.instances[widgetId];
    if (instance) {
      renderWidget(instance.container, newData, instance.config.designTokens, instance.config.contentType, widgetId);
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
  
  // Replace the stub with the real implementation
  window.EmbedWidget = EmbedWidget;
  
})(window, document);