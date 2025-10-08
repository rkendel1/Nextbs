import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "API key name is required" },
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

    // Generate a secure API key
    const apiKey = `sk_${crypto.randomBytes(32).toString("hex")}`;

    // Create the API key in the database
    const newApiKey = await prisma.apiKey.create({
      data: {
        saasCreatorId: user.saasCreator.id,
        name: name.trim(),
        key: apiKey,
      },
    });

    return NextResponse.json({ apiKey: newApiKey }, { status: 201 });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { message: "Failed to create API key" },
      { status: 500 }
    );
  }
}
