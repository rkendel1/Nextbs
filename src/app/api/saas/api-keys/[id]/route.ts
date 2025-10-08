import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

interface RouteParams {
  params: {
    id: string;
  };
}

// Helper function to verify API key ownership
async function verifyApiKeyOwnership(id: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { saasCreator: true },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
  });

  if (!apiKey) {
    return { error: "API key not found", status: 404 };
  }

  // Check if the API key belongs to either the user directly or their SaaS creator profile
  if (apiKey.userId !== user.id && apiKey.saasCreatorId !== user.saasCreator?.id) {
    return { error: "Unauthorized", status: 403 };
  }

  return { user, apiKey };
}

// DELETE /api/saas/api-keys/[id] - Revoke/delete an API key
export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = context.params;
    const result = await verifyApiKeyOwnership(id, session.user.email);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Delete the API key
    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "API key revoked successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete API key error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete API key" },
      { status: 500 }
    );
  }
}

// PATCH /api/saas/api-keys/[id] - Update API key (e.g., deactivate, rename)
export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = context.params;
    const result = await verifyApiKeyOwnership(id, session.user.email);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();
    const { isActive, name } = body;

    // Update the API key
    const updatedKey = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(name && { name }),
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

    return NextResponse.json({ apiKey: updatedKey });
  } catch (error: any) {
    console.error("Update API key error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update API key" },
      { status: 500 }
    );
  }
}