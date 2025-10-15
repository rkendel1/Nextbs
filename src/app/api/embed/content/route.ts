// src/app/api/embed/content/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const widgetId = searchParams.get('widgetId');
  const type = searchParams.get('type');

  // Add CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (!widgetId) {
    return NextResponse.json(
      { error: 'Widget ID is required' },
      { status: 400, headers }
    );
  }

  // Fetch widget content from your database or CMS
  // This is a mock implementation - replace with your actual data source
  const content = await getWidgetContent(widgetId, type);

  return NextResponse.json(content, { headers });
}

export async function OPTIONS() {
  // Handle preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Mock function - replace with actual database/CMS query
async function getWidgetContent(widgetId: string, type: string | null) {
  // Simulate database lookup
  const contentMap: Record<string, any> = {
    chat: {
      title: 'Chat with us',
      message: 'Hi there! How can we help you today?',
      agent: 'Support Team',
    },
    form: {
      title: 'Get in Touch',
      description: 'Fill out the form and we\'ll get back to you shortly.',
      fields: ['name', 'email', 'message'],
    },
    notification: {
      title: '🎉 Special Offer!',
      message: 'Get 20% off your first order. Use code: WELCOME20',
      action: 'Shop Now',
    },
    custom: {
      title: 'Welcome!',
      message: 'This is a custom widget. Content can be dynamically updated.',
    },
  };

  const content = contentMap[type || 'custom'] || contentMap.custom;

  return {
    widgetId,
    type,
    timestamp: new Date().toISOString(),
    ...content,
  };
}