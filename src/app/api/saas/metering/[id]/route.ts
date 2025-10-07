import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// PUT update metering configuration
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      meteringType,
      meteringUnit,
      aggregationType,
      usageReportingUrl,
    } = body;

    // Verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    const config = await prisma.meteringConfig.findUnique({
      where: { id: params.id },
      include: { product: true },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Metering configuration not found" },
        { status: 404 }
      );
    }

    if (!user?.saasCreator || config.product.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update config
    const updatedConfig = await prisma.meteringConfig.update({
      where: { id: params.id },
      data: {
        ...(meteringType && { meteringType }),
        ...(meteringUnit && { meteringUnit }),
        ...(aggregationType && { aggregationType }),
        ...(usageReportingUrl !== undefined && { usageReportingUrl }),
      },
    });

    return NextResponse.json({ config: updatedConfig });
  } catch (error: any) {
    console.error("Update metering config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update metering configuration" },
      { status: 500 }
    );
  }
}
