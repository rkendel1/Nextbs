import { NextRequest } from "next/server";
import { prisma } from "@/utils/prismaDB";
import crypto from "crypto";

// Hash API key for verification
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Verify API key from request headers
export async function verifyApiKey(request: NextRequest): Promise<{
  valid: boolean;
  userId?: string;
  apiKeyId?: string;
  permissions?: string[];
  error?: string;
}> {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return { valid: false, error: 'No API key provided' };
  }

  // Hash the provided key
  const hashedKey = hashApiKey(apiKey);

  // Find the API key in the database
  const dbApiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    include: { user: true },
  });

  if (!dbApiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check if key is active
  if (!dbApiKey.isActive) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check if key has expired
  if (dbApiKey.expiresAt && new Date() > dbApiKey.expiresAt) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: dbApiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    userId: dbApiKey.userId,
    apiKeyId: dbApiKey.id,
    permissions: dbApiKey.permissions,
  };
}

// Check if API key has specific permission
export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) || permissions.includes('*');
}
