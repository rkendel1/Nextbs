function embedProduct(id) {
  const iframe = document.createElement('iframe');
  iframe.src = `/embed/product/${id}`;
  iframe.width = '400';
  iframe.height = '600';
  iframe.style.border = 'none';
  iframe.loading = 'lazy';
  iframe.allowFullscreen = true;
  document.body.appendChild(iframe);
}

function embedCreator(id) {
  const iframe = document.createElement('iframe');
  iframe.src = `/embed/creator/${id}`;
  iframe.width = '400';
  iframe.height = '400';
  iframe.style.border = 'none';
  iframe.loading = 'lazy';
  iframe.allowFullscreen = true;
  document.body.appendChild(iframe);
}

function embedPlatform() {
  const iframe = document.createElement('iframe');
  iframe.src = `/embed/platform`;
  iframe.width = '400';
  iframe.height = '300';
  iframe.style.border = 'none';
  iframe.loading = 'lazy';
  iframe.allowFullscreen = true;
  document.body.appendChild(iframe);
}

// Usage: embedProduct('id'); embedCreator('id'); embedPlatform();