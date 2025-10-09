import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/design-tokens/proxy
 * Proxy endpoint for fetching website content to extract design tokens
 * This helps bypass CORS restrictions when extracting design tokens from external websites
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: "URL is required" }, 
      { status: 400 }
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" }, 
      { status: 400 }
    );
  }

  // Security: Only allow HTTP/HTTPS protocols
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return NextResponse.json(
      { error: "Only HTTP/HTTPS protocols are allowed" }, 
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      );
    }
    
    const html = await response.text();
    
    // Return the HTML content with appropriate CORS headers
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error: any) {
    console.error('Proxy fetch error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timeout - website took too long to respond" }, 
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to proxy request" }, 
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}