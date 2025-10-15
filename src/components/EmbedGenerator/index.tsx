// src/components/EmbedGenerator.tsx
'use client';

import { useState } from 'react';

interface DesignTokens {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  padding: string;
  maxWidth: string;
  position: 'inline' | 'fixed-bottom-right' | 'fixed-bottom-left';
}

interface EmbedConfig {
  widgetId: string;
  contentType: 'form' | 'chat' | 'notification' | 'custom';
  apiEndpoint: string;
  designTokens: DesignTokens;
}

export default function EmbedGenerator() {
  const [config, setConfig] = useState<EmbedConfig>({
    widgetId: `widget-${Date.now()}`,
    contentType: 'chat',
    apiEndpoint: '/api/embed/content',
    designTokens: {
      primaryColor: '#0070f3',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '400px',
      position: 'inline'
    }
  });

  const [showPreview, setShowPreview] = useState(false);
  const [shortCode, setShortCode] = useState<string>('');
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const [useShortCode, setUseShortCode] = useState(true);

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    const encodedConfig = btoa(JSON.stringify(config));
    
    return `<script>
(function(w,d,s,o,f,js,fjs){
w['EmbedWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
}(window,document,'script','embed','${baseUrl}/embed.js'));
embed('init','${config.widgetId}','${encodedConfig}');
</script>`;
  };

  const generateShortEmbedCode = () => {
    const baseUrl = window.location.origin;
    return `<script src="${baseUrl}/e.js"></script><script>ew('init','${shortCode}');</script>`;
  };

  const generateShortCode = async () => {
    setIsGeneratingShort(true);
    try {
      const response = await fetch('/api/embed/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: config.widgetId,
          config: btoa(JSON.stringify(config))
        })
      });

      const data = await response.json();
      setShortCode(data.shortCode);
      
      if (!data.existed) {
        alert('Short code generated!');
      }
    } catch (error) {
      console.error('Failed to generate short code:', error);
      alert('Failed to generate short code');
    } finally {
      setIsGeneratingShort(false);
    }
  };

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    const encodedConfig = btoa(JSON.stringify(config));
    
    return `<script>
(function(w,d,s,o,f,js,fjs){
w['EmbedWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
}(window,document,'script','embed','${baseUrl}/embed.js'));
embed('init','${config.widgetId}','${encodedConfig}');
</script>`;
  };

  const updateToken = (key: keyof DesignTokens, value: string) => {
    setConfig(prev => ({
      ...prev,
      designTokens: { ...prev.designTokens, [key]: value }
    }));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px' }}>
        Embed Widget Generator
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Configuration Panel */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            Configuration
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Widget ID
            </label>
            <input
              type="text"
              value={config.widgetId}
              onChange={(e) => setConfig({ ...config, widgetId: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Content Type
            </label>
            <select
              value={config.contentType}
              onChange={(e) => setConfig({ ...config, contentType: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            >
              <option value="chat">Chat Widget</option>
              <option value="form">Form Widget</option>
              <option value="notification">Notification Widget</option>
              <option value="custom">Custom Widget</option>
            </select>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '30px', marginBottom: '15px' }}>
            Design Tokens
          </h3>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Primary Color
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="color"
                  value={config.designTokens.primaryColor}
                  onChange={(e) => updateToken('primaryColor', e.target.value)}
                  style={{ width: '60px', height: '40px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <input
                  type="text"
                  value={config.designTokens.primaryColor}
                  onChange={(e) => updateToken('primaryColor', e.target.value)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Background Color
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="color"
                  value={config.designTokens.backgroundColor}
                  onChange={(e) => updateToken('backgroundColor', e.target.value)}
                  style={{ width: '60px', height: '40px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <input
                  type="text"
                  value={config.designTokens.backgroundColor}
                  onChange={(e) => updateToken('backgroundColor', e.target.value)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Text Color
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="color"
                  value={config.designTokens.textColor}
                  onChange={(e) => updateToken('textColor', e.target.value)}
                  style={{ width: '60px', height: '40px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <input
                  type="text"
                  value={config.designTokens.textColor}
                  onChange={(e) => updateToken('textColor', e.target.value)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Font Family
              </label>
              <input
                type="text"
                value={config.designTokens.fontFamily}
                onChange={(e) => updateToken('fontFamily', e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Border Radius
              </label>
              <input
                type="text"
                value={config.designTokens.borderRadius}
                onChange={(e) => updateToken('borderRadius', e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                placeholder="e.g., 12px"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Position
              </label>
              <select
                value={config.designTokens.position}
                onChange={(e) => updateToken('position', e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="inline">Inline</option>
                <option value="fixed-bottom-right">Fixed Bottom Right</option>
                <option value="fixed-bottom-left">Fixed Bottom Left</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              marginTop: '30px',
              width: '100%',
              padding: '12px',
              backgroundColor: config.designTokens.primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {/* Generated Code Panel */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            Generated Embed Code
          </h2>

          {/* Toggle between short and full code */}
          <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useShortCode}
                onChange={(e) => setUseShortCode(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Use Short Code (Recommended)</span>
            </label>
          </div>

          {useShortCode && !shortCode && (
            <button
              onClick={generateShortCode}
              disabled={isGeneratingShort}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isGeneratingShort ? 'not-allowed' : 'pointer',
                marginBottom: '15px',
                opacity: isGeneratingShort ? 0.6 : 1
              }}
            >
              {isGeneratingShort ? 'Generating...' : '✨ Generate Short Code'}
            </button>
          )}

          {useShortCode && shortCode && (
            <div style={{ 
              background: '#f0fdf4', 
              border: '1px solid #86efac',
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              <strong style={{ color: '#16a34a' }}>Short Code:</strong> {shortCode}
              <br />
              <span style={{ fontSize: '12px', color: '#15803d' }}>
                Your embed is now {Math.round((1 - generateShortEmbedCode().length / generateEmbedCode().length) * 100)}% shorter!
              </span>
            </div>
          )}

          <div
            style={{
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              padding: '20px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '13px',
              overflowX: 'auto',
              marginBottom: '15px'
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {useShortCode && shortCode ? generateShortEmbedCode() : generateEmbedCode()}
            </pre>
          </div>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => {
                const code = useShortCode && shortCode ? generateShortEmbedCode() : generateEmbedCode();
                navigator.clipboard.writeText(code);
                alert('Embed code copied to clipboard!');
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📋 Copy Embed Code
            </button>

            {useShortCode && shortCode && (
              <button
                onClick={() => {
                  setShortCode('');
                  generateShortCode();
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: '#8b5cf6',
                  border: '2px solid #8b5cf6',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔄 Regenerate Short Code
              </button>
            )}
          </div>

          {/* Code comparison stats */}
          {useShortCode && shortCode && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#92400e' }}>📊 Stats:</strong>
              <div style={{ color: '#78350f' }}>
                <div>Short code: <strong>{generateShortEmbedCode().length}</strong> characters</div>
                <div>Full code: <strong>{generateEmbedCode().length}</strong> characters</div>
                <div style={{ marginTop: '5px', color: '#16a34a', fontWeight: '600' }}>
                  ✓ Saved {generateEmbedCode().length - generateShortEmbedCode().length} characters
                </div>
              </div>
            </div>
          )}

          {showPreview && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
                Live Preview
              </h3>
              <div
                style={{
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  minHeight: '300px',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div
                  style={{
                    ...getPositionStyles(config.designTokens.position),
                    backgroundColor: config.designTokens.backgroundColor,
                    color: config.designTokens.textColor,
                    fontFamily: config.designTokens.fontFamily,
                    borderRadius: config.designTokens.borderRadius,
                    padding: config.designTokens.padding,
                    maxWidth: config.designTokens.maxWidth,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <h4 style={{ margin: '0 0 12px 0', color: config.designTokens.primaryColor }}>
                    {config.contentType.charAt(0).toUpperCase() + config.contentType.slice(1)} Widget
                  </h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', lineHeight: '1.5' }}>
                    This is a preview of your embedded widget. It will inherit these design tokens and render natively on any website.
                  </p>
                  <button
                    style={{
                      backgroundColor: config.designTokens.primaryColor,
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Interact
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getPositionStyles(position: string) {
  switch (position) {
    case 'fixed-bottom-right':
      return { position: 'fixed' as const, bottom: '20px', right: '20px' };
    case 'fixed-bottom-left':
      return { position: 'fixed' as const, bottom: '20px', left: '20px' };
    default:
      return { position: 'relative' as const };
  }
}