import Fastify from 'fastify';
import { ZodError } from 'zod';
import authPlugin from './plugins/auth.js';
import auditPlugin from './plugins/audit.js';
import prismaPlugin from './plugins/prisma.js';
import exportsRoutes from './routes/exports.js';

export async function buildApp() {
  const app = Fastify({
    logger: false
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({
        error: 'validation_error',
        issues: err.issues
      });
    }

    return reply.send(err);
  });

  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(auditPlugin);

  await app.register(exportsRoutes, { prefix: '/api/exports' });

  return app;
}
