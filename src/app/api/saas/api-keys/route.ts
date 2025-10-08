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
import { prisma } from "@/utils/prismaDB";
import { authOptions } from "@/utils/auth";
import crypto from "crypto";

// GET /api/saas/api-keys - List all API keys for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user and their SaaS creator profile
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
    console.error("List API keys error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list API keys" },
    // Fetch all API keys for this SaaS creator
    const apiKeys = await prisma.apiKey.findMany({
      where: { saasCreatorId: user.saasCreator.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ apiKeys }, { status: 200 });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { message: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST /api/saas/api-keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissions, expiresAt } = body;

    if (!name) {
      return NextResponse.json(
        { error: "API key name is required" },
        { status: 400 }
      );
    }

    // Get the user and their SaaS creator profile
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

    const { key, keyPrefix } = generateApiKey();
    const hashedKey = hashApiKey(key);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name,
        key: hashedKey,
        keyPrefix,
        permissions: permissions || ['usage:read', 'usage:write'],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    // Return the plain key only once (on creation)
    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
      key, // Only returned on creation
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create API key error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create API key" },
      { status: 500 }
    );
  }
}
