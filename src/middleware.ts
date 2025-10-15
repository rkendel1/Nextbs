import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import fs from 'fs';
import path from 'path';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Serve embed.js with proper headers
  if (pathname === '/embed.js') {
    try {
      // Read the embed.js file from the public directory
      const embedPath = path.join(process.cwd(), 'public', 'embed.js');
      const embedScript = fs.readFileSync(embedPath, 'utf-8');

      return new NextResponse(embedScript, {
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      });
    } catch (error) {
      console.error('Error serving embed.js:', error);
      return new NextResponse('Embed script not found', { status: 404 });
    }
  }

  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Skip if it's development environment or main production domain
  const isDevelopment = hostname.startsWith('localhost') || 
                        hostname.startsWith('127.0.0.1') || 
                        hostname.startsWith('0.0.0.0') ||
                        hostname.startsWith('192.168.')
  const isMainDomain = hostname === 'saasinasnap.com' || hostname === 'www.saasinasnap.com'
  
  // In development, apply rewrite for subdomain paths like /s/...
  if (isDevelopment && url.pathname.startsWith('/s/')) {
    const subdomain = 's';
    url.pathname = `/whitelabel/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Specific rewrite for payment-success path
  if (isDevelopment && url.pathname.endsWith('/payment-success')) {
    const pathParts = url.pathname.split('/');
    const domain = pathParts[1]; // e.g., 'sus' from /sus/payment-success
    if (domain) {
      url.pathname = `/whitelabel/${domain}/payment-success`;
      return NextResponse.rewrite(url);
    }
  }
  
  if (isDevelopment || isMainDomain || url.pathname.startsWith('/embed')) {
    return NextResponse.next()
  }
  
  // Extract subdomain from hostname
  const subdomain = hostname.split('.')[0]
  
  // Skip if it's www or empty subdomain
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next()
  }
  
  // Check if this is a custom domain (not a subdomain of saasinasnap.com)
  const isCustomDomain = !hostname.includes('saasinasnap.com')
  
  // Rewrite to white label pages
  if (isCustomDomain) {
    // Custom domain - use the full hostname as identifier
    url.pathname = `/whitelabel/${hostname}${url.pathname}`
  } else {
    // Subdomain - use subdomain as identifier
    url.pathname = `/whitelabel/${subdomain}${url.pathname}`
  }
  
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - whitelabel (to prevent infinite loops)
     * - embed (public embed viewer)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|whitelabel|embed).*)',
    '/embed.js'
  ],
}