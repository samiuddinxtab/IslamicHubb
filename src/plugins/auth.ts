import fp from 'fastify-plugin';
import type { AuthRole, AuthUser } from '../types/auth.js';

function normalizeRole(role: string | undefined): AuthRole {
  if (!role) return 'unknown';
  if (role === 'institution_admin') return 'institution_admin';
  if (role === 'teacher') return 'teacher';
  if (role === 'student') return 'student';
  return 'unknown';
}

export default fp(async (app) => {
  app.addHook('preHandler', async (request) => {
    const userId = request.headers['x-user-id'];
    const institutionId = request.headers['x-institution-id'];

    if (typeof userId !== 'string' || typeof institutionId !== 'string') return;

    const roleHeader = request.headers['x-role'];
    const role = typeof roleHeader === 'string' ? normalizeRole(roleHeader) : 'unknown';

    const user: AuthUser = {
      id: userId,
      institutionId,
      role
    };

    request.user = user;
  });
});
