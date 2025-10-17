'use client';
import { useState } from 'react';

const EmbedViewerTool = () => {
  const [embedCode, setEmbedCode] = useState('');
  const [previewDiv, setPreviewDiv] = useState<HTMLDivElement | null>(null);

  const handleEmbedCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmbedCode(event.target.value);
  };

  const loadEmbed = () => {
    if (!previewDiv) return;

    // Clear previous content
    previewDiv.innerHTML = '';

    // Parse the pasted code to extract data attributes
    const parser = new DOMParser();
    const doc = parser.parseFromString(embedCode, 'text/html');
    const script = doc.querySelector('script[src="/embed.js"]') as HTMLScriptElement;

    if (script) {
      const type = script.dataset.type;
      const id = script.dataset.id;
      const style = script.dataset.style;

      if (type && id) {
        // Create script element with data attributes
        const newScript = document.createElement('script');
        newScript.src = '/embed.js';
        newScript.dataset.type = type;
        newScript.dataset.id = id;
        newScript.dataset.style = style || 'brand';

        // Append to preview div
        previewDiv.appendChild(newScript);
      } else {
        // Fallback to raw HTML if not a script
        previewDiv.innerHTML = embedCode;
      }
    } else {
      // Fallback to raw HTML for iframe or other HTML
      previewDiv.innerHTML = embedCode;
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Embed Code Viewer</h1>
        <p className="text-center text-gray-600 mb-8">Paste your embed code below to preview it live.</p>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Embed Code</label>
          <textarea
            value={embedCode}
            onChange={handleEmbedCodeChange}
            placeholder="Paste your embed script here, e.g., &lt;script src=\&quot;/embed.js\&quot; data-type=\&quot;product\&quot; data-id=\&quot;your-id\&quot; data-style=\&quot;brand\&quot;&gt;&lt;/script&gt;"
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={loadEmbed}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Load Preview
          </button>
        </div>

        {embedCode && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Live Preview</h2>
            <div 
              ref={setPreviewDiv}
              className="w-full border rounded-lg overflow-hidden min-h-[400px]"
            />
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Examples:</p>
          <div className="space-x-4">
            <button
              onClick={() => setEmbedCode(`&lt;script src="/embed.js" data-type="product" data-id="[your-product-id]" data-style="brand"&gt;&lt;/script&gt;`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Product Embed
            </button>
            <button
              onClick={() => setEmbedCode(`&lt;script src="/embed.js" data-type="creator" data-id="[your-creator-id]" data-style="brand"&gt;&lt;/script&gt;`)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Creator Embed
            </button>
            <button
              onClick={() => setEmbedCode(`&lt;script src="/embed.js" data-type="platform" data-id="[your-platform-id]" data-style="brand"&gt;&lt;/script&gt;`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Platform Embed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedViewerTool;