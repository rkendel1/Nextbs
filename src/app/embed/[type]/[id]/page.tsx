'use client';

import Script from 'next/script';

interface Props {
  params: {
    type: string;
    id: string;
  };
}

export default function EmbedViewer({ params }: Props) {
  if (!params.type || !params.id) {
    return <div>Invalid embed parameters.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Embed Viewer</h1>
        <div className="border rounded-lg p-4 bg-white">
          <Script
            src="/embed.js"
            strategy="afterInteractive"
            data-type={params.type}
            data-id={params.id}
            data-style="brand"
          />
        </div>
      </div>
    </div>
  );
}