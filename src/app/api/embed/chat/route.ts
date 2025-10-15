import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/utils/auth';
import { ChatMessage } from '@/types/embed';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = await request.json();
    const { widgetId, message, sender, sessionId, parentId } = body as ChatMessage & { widgetId: string; sessionId: string; parentId?: string };

    if (!widgetId || !message || !sender || !sessionId) {
      return NextResponse.json({ error: 'Missing widgetId, message, sender, or sessionId' }, { status: 400 });
    }

    // Map sender to enum
    const messageSender = sender.toUpperCase() as 'USER' | 'BOT' | 'AGENT';

    // Validate widget exists
    const widget = await prisma.widget.findUnique({ where: { widgetId } });
    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        widgetId,
        message,
        sender: messageSender,
        sessionId,
        parentId,
      },
    });

    return NextResponse.json({ success: true, id: chatMessage.id, timestamp: chatMessage.createdAt });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}