import fp from 'fastify-plugin';

export default fp(async (app) => {
  app.decorate('audit', {
    log: async ({ institutionId, userId, action, metadata }) => {
      await app.prisma.auditLog.create({
        data: {
          institutionId,
          userId,
          action,
          metadata: metadata ?? null
        }
      });
    }
  });
});
