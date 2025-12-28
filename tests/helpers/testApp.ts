import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

export async function resetDb(app: FastifyInstance) {
  await app.prisma.auditLog.deleteMany();
  await app.prisma.export.deleteMany();
}

export const adminHeaders = {
  'x-user-id': 'user-1',
  'x-institution-id': 'inst-1',
  'x-role': 'institution_admin'
};

export const teacherHeaders = {
  'x-user-id': 'user-2',
  'x-institution-id': 'inst-1',
  'x-role': 'teacher'
};
