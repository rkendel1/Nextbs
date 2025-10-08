import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import crypto from "crypto";

// Generate a secure API key
function generateApiKey(): { key: string; keyPrefix: string } {
  const key = `sk_${crypto.randomBytes(32).toString('hex')}`;
  const keyPrefix = key.substring(0, 11); // "sk_" + first 8 chars
  return { key, keyPrefix };
}

// Hash API key for storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// GET - List all API keys for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    if (!user?.saasCreator) {
      return NextResponse.json(
        { message: "SaaS creator profile not found" },
        { status: 404 }
      );
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ apiKeys });
  } catch (error: any) {
    console.error("Get API keys error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissions, expiresAt } = body;

    if (!name || !permissions) {
      return NextResponse.json(
        { error: "Name and permissions are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate API key
    const { key, keyPrefix } = generateApiKey();
    const hashedKey = hashApiKey(key);

    // Create API key in database
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name,
        key: hashedKey,
        keyPrefix,
        permissions,
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Return the plain key only once (user needs to save it)
    return NextResponse.json({ 
      apiKey: { ...apiKey, key },
      message: "API key created successfully. Save this key - it won't be shown again!"
    });
  } catch (error: any) {
    console.error("Create API key error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create API key" },
      { status: 500 }
    );
  }
}
