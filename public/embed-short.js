// public/embed-short.js
// Ultra-compact embed script with URL shortening support

(function(w,d,s,o,f,js,fjs){
  w['EW']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
  js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
  js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
}(window,document,'script','ew','https://yourdomain.com/e.js'));

(function(window, document) {
  'use strict';

  const EW = window.EW || {};
  EW.instances = {};
  EW.config = {};
  
  // Initialize with short code
  EW.init = function(shortCode, options) {
    options = options || {};
    
    // Fetch config from short code
    const baseUrl = getBaseUrl();
    fetch(`${baseUrl}/api/embed/resolve/${shortCode}`)
      .then(res => res.json())
      .then(data => {
        const config = JSON.parse(atob(data.config));
        const widgetId = data.widgetId;
        
        // Create and render widget
        createWidget(widgetId, config, options);
      })
      .catch(err => {
        console.error('EW: Failed to load widget', err);
      });
  };
  
  function createWidget(widgetId, config, options) {
    EW.config[widgetId] = config;
    
    const container = d.createElement('div');
    container.id = `ew-${widgetId}`;
    container.className = 'ew-container';
    
    applyStyles(container, config.designTokens.position);
    insertContainer(container, config.designTokens.position);
    
    loadContent(widgetId, config, container);
    
    EW.instances[widgetId] = {
      container,
      config,
      state: { open: true }
    };
  }
  
  function applyStyles(el, pos) {
    const styles = {
      'z-index': '999999',
      'box-sizing': 'border-box'
    };
    
    if (pos === 'fixed-bottom-right') {
      Object.assign(styles, {
        'position': 'fixed',
        'bottom': '20px',
        'right': '20px'
      });
    } else if (pos === 'fixed-bottom-left') {
      Object.assign(styles, {
        'position': 'fixed',
        'bottom': '20px',
        'left': '20px'
      });
    }
    
    Object.keys(styles).forEach(k => el.style[k] = styles[k]);
  }
  
  function insertContainer(container, position) {
    if (position === 'inline') {
      const scripts = document.getElementsByTagName('script');
      const current = scripts[scripts.length - 1];
      current.parentNode.insertBefore(container, current.nextSibling);
    } else {
      document.body.appendChild(container);
    }
  }
  
  function loadContent(widgetId, config, container) {
    container.innerHTML = createLoader(config.designTokens);
    
    const baseUrl = getBaseUrl();
    fetch(`${baseUrl}${config.apiEndpoint}?widgetId=${widgetId}&type=${config.contentType}`)
      .then(res => res.json())
      .then(data => {
        render(container, data, config, widgetId);
      })
      .catch(err => {
        container.innerHTML = createError(config.designTokens);
      });
  }
  
  function createLoader(t) {
    return `<div style="background:${t.backgroundColor};padding:${t.padding};border-radius:${t.borderRadius};box-shadow:0 4px 12px rgba(0,0,0,0.15);text-align:center"><div style="width:40px;height:40px;border:4px solid ${t.primaryColor}33;border-top-color:${t.primaryColor};border-radius:50%;animation:s 1s linear infinite;margin:0 auto"></div><style>@keyframes s{to{transform:rotate(360deg)}}</style></div>`;
  }
  
  function createError(t) {
    return `<div style="background:${t.backgroundColor};color:${t.textColor};padding:${t.padding};border-radius:${t.borderRadius};box-shadow:0 4px 12px rgba(0,0,0,0.15)">Failed to load</div>`;
  }
  
  function render(container, data, config, widgetId) {
    const t = config.designTokens;
    const type = config.contentType;
    
    let html = `<div style="background:${t.backgroundColor};color:${t.textColor};font-family:${t.fontFamily};border-radius:${t.borderRadius};padding:${t.padding};max-width:${t.maxWidth};box-shadow:0 4px 12px rgba(0,0,0,0.15);border:1px solid rgba(0,0,0,0.1)">`;
    
    // Header
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px"><h3 style="margin:0;color:${t.primaryColor};font-size:18px">${data.title||'Widget'}</h3><button class="ew-close" style="background:none;border:none;cursor:pointer;font-size:20px;color:${t.textColor}">×</button></div>`;
    
    // Content based on type
    if (type === 'chat') {
      html += `<div id="ew-chat-${widgetId}" style="max-height:300px;overflow-y:auto;margin-bottom:15px;padding:10px;background:#f9fafb;border-radius:8px"><div style="padding:8px 12px;background:#fff;border-radius:8px;font-size:14px;border:1px solid #e5e7eb">${data.message}</div></div><div style="display:flex;gap:8px"><input type="text" class="ew-input" placeholder="Type..." style="flex:1;padding:10px;border:1px solid #ddd;border-radius:6px;font-family:${t.fontFamily};font-size:14px"/><button class="ew-send" style="background:${t.primaryColor};color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">Send</button></div>`;
    } else if (type === 'form') {
      html += `<form class="ew-form" style="display:flex;flex-direction:column;gap:12px"><input name="name" placeholder="Name" required style="padding:10px;border:1px solid #ddd;border-radius:6px;font-family:${t.fontFamily};font-size:14px"/><input type="email" name="email" placeholder="Email" required style="padding:10px;border:1px solid #ddd;border-radius:6px;font-family:${t.fontFamily};font-size:14px"/><textarea name="message" placeholder="Message" rows="3" required style="padding:10px;border:1px solid #ddd;border-radius:6px;font-family:${t.fontFamily};font-size:14px;resize:vertical"></textarea><button type="submit" style="background:${t.primaryColor};color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">Submit</button></form>`;
    } else {
      html += `<p style="margin:0;font-size:14px;line-height:1.5">${data.message||'Content'}</p>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    attachEvents(container, widgetId, config);
  }
  
  function attachEvents(container, widgetId, config) {
    // Close button
    const close = container.querySelector('.ew-close');
    if (close) {
      close.onclick = () => {
        container.style.display = 'none';
      };
    }
    
    // Form
    const form = container.querySelector('.ew-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        fetch(`${getBaseUrl()}/api/embed/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetId, data })
        })
        .then(() => {
          alert('Submitted!');
          form.reset();
        })
        .catch(() => alert('Failed to submit'));
      };
    }
    
    // Chat
    const send = container.querySelector('.ew-send');
    const input = container.querySelector('.ew-input');
    if (send && input) {
      const sendMsg = () => {
        const msg = input.value.trim();
        if (msg) {
          addMsg(widgetId, msg, 'user');
          input.value = '';
          
          fetch(`${getBaseUrl()}/api/embed/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ widgetId, message: msg })
          })
          .then(res => res.json())
          .then(data => addMsg(widgetId, data.reply, 'bot'))
          .catch(() => addMsg(widgetId, 'Error', 'bot'));
        }
      };
      
      send.onclick = sendMsg;
      input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMsg();
      };
    }
  }
  
  function addMsg(widgetId, msg, sender) {
    const chat = document.getElementById(`ew-chat-${widgetId}`);
    if (chat) {
      const t = EW.config[widgetId].designTokens;
      const div = document.createElement('div');
      div.style.cssText = `margin-top:10px;padding:8px 12px;border-radius:8px;font-size:14px;${sender==='user'?`background:${t.primaryColor};color:white;margin-left:20px;text-align:right`:'background:#fff;margin-right:20px;border:1px solid #e5e7eb'}`;
      div.textContent = msg;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }
  }
  
  function getBaseUrl() {
    const script = document.getElementById('ew');
    if (script && script.src) {
      const url = new URL(script.src);
      return `${url.protocol}//${url.host}`;
    }
    return '';
  }
  
  // Process queue
  if (window.EW && window.EW.q) {
    window.EW.q.forEach(args => {
      if (args[0] === 'init') {
        EW.init(args[1], args[2]);
      }
    });
  }
  
  window.EW = EW;
  
})(window, document);