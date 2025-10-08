import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/utils/prismaDB";
import { authOptions } from "@/utils/auth";

// DELETE /api/saas/api-keys/[id] - Revoke/delete an API key
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

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

    // Verify that the API key belongs to this user
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { message: "API key not found" },
        { status: 404 }
      );
    }

    if (apiKey.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json(
        { message: "Unauthorized to delete this API key" },
        { status: 403 }
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
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { message: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
