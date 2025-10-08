import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Skip if it's development environment or main production domain
  const isDevelopment = hostname === 'localhost:3000' || hostname === '127.0.0.1:3000'
  const isMainDomain = hostname === 'saasinasnap.com' || hostname === 'www.saasinasnap.com'
  
  if (isDevelopment || isMainDomain) {
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|whitelabel).*)',
  ],
}