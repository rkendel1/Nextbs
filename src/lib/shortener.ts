// src/lib/shortener.ts
import crypto from 'crypto';

export interface ShortCode {
  id: string;
  code: string;
  config: string; // Base64 encoded config
  widgetId: string;
  createdAt: Date;
  expiresAt?: Date;
  clicks: number;
}

// Generate a short code (6 characters by default)
export function generateShortCode(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

// Generate a hash-based short code (consistent for same input)
export function generateHashCode(input: string, length: number = 6): string {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return hash.substring(0, length);
}

// Validate short code format
export function isValidShortCode(code: string): boolean {
  return /^[a-zA-Z0-9]{4,12}$/.test(code);
}

// src/app/api/embed/shorten/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateShortCode } from '@/lib/shortener';

// In-memory store (replace with database in production)
const shortCodeStore = new Map<string, {
  config: string;
  widgetId: string;
  createdAt: string;
  clicks: number;
}>();

export async function POST(request: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json();
    const { widgetId, config } = body;

    if (!widgetId || !config) {
      return NextResponse.json(
        { error: 'Widget ID and config are required' },
        { status: 400, headers }
      );
    }

    // Check if short code already exists for this config
    const existingCode = findExistingCode(config);
    if (existingCode) {
      return NextResponse.json(
        {
          shortCode: existingCode,
          url: `${getBaseUrl(request)}/e/${existingCode}`,
          existed: true
        },
        { headers }
      );
    }

    // Generate new short code
    let shortCode = generateShortCode(6);
    
    // Ensure uniqueness
    while (shortCodeStore.has(shortCode)) {
      shortCode = generateShortCode(6);
    }

    // Store the mapping
    shortCodeStore.set(shortCode, {
      config,
      widgetId,
      createdAt: new Date().toISOString(),
      clicks: 0
    });

    // In production, save to database:
    // await db.shortCodes.create({
    //   code: shortCode,
    //   config,
    //   widgetId,
    //   createdAt: new Date(),
    // });

    return NextResponse.json(
      {
        shortCode,
        url: `${getBaseUrl(request)}/e/${shortCode}`,
        existed: false
      },
      { headers }
    );
  } catch (error) {
    console.error('Shortener error:', error);
    return NextResponse.json(
      { error: 'Failed to create short code' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function findExistingCode(config: string): string | null {
  for (const [code, data] of shortCodeStore.entries()) {
    if (data.config === config) {
      return code;
    }
  }
  return null;
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || '';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}