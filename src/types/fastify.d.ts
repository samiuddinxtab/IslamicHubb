import 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { AuthUser } from './auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }

  interface FastifyInstance {
    prisma: PrismaClient;
    audit: {
      log: (params: {
        institutionId: string;
        userId: string;
        action: string;
        metadata?: unknown;
      }) => Promise<void>;
    };
  }
}
