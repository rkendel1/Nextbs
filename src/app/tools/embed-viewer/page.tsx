'use client';
import { useState } from 'react';

const EmbedViewerTool = () => {
  const [embedCode, setEmbedCode] = useState('');

  const handleEmbedCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmbedCode(event.target.value);
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
            placeholder="Paste your iframe embed code here, e.g., &lt;iframe src=&quot;/embed/product/[id]&quot; width=&quot;400&quot; height=&quot;600&quot; style=&quot;border:none;&quot; loading=&quot;lazy&quot; allowfullscreen&gt;&lt;/iframe&gt;"
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {embedCode && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Live Preview</h2>
            <div 
              className="w-full border rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: embedCode }}
            />
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Examples:</p>
          <div className="space-x-4">
            <button
              onClick={() => setEmbedCode(`&lt;iframe src="/embed/product/[your-product-id]" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen&gt;&lt;/iframe&gt;`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Product Embed
            </button>
            <button
              onClick={() => setEmbedCode(`&lt;iframe src="/embed/creator/[your-creator-id]" width="400" height="400" style="border:none;" loading="lazy" allowfullscreen&gt;&lt;/iframe&gt;`)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Creator Embed
            </button>
            <button
              onClick={() => setEmbedCode(`&lt;iframe src="/embed/platform" width="400" height="300" style="border:none;" loading="lazy" allowfullscreen&gt;&lt;/iframe&gt;`)}
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