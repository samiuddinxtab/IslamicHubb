import type { FastifyPluginAsync } from 'fastify';
import { enqueueExportGeneration } from '../lib/queue.js';
import {
  getFreshDownloadUrl,
  getExportById,
  listExports,
  requestExport
} from '../services/exportsService.js';
import {
  paginationQuerySchema,
  parseCreateExportBody
} from '../services/exportsValidation.js';

const exportsRoutes: FastifyPluginAsync = async (app) => {
  const requireInstitutionAdmin = async (request: any, reply: any) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'unauthorized' });
    }

    if (request.user.role !== 'institution_admin') {
      return reply.code(403).send({ error: 'forbidden' });
    }
  };

  const toExportResponse = (record: any) => ({
    id: record.id,
    entity_type: record.entityType,
    filters: record.filters,
    status: record.status,
    file_url: record.fileUrl,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  });

  app.post(
    '/',
    {
      preHandler: requireInstitutionAdmin
    },
    async (request, reply) => {
      const { entityType, filters } = parseCreateExportBody(request.body);

      const exportRecord = await requestExport(app.prisma, {
        institutionId: request.user!.institutionId,
        requestedByUserId: request.user!.id,
        entityType,
        filters
      });

      await app.audit.log({
        institutionId: request.user!.institutionId,
        userId: request.user!.id,
        action: 'exports.requested',
        metadata: {
          exportId: exportRecord.id,
          entityType
        }
      });

      await enqueueExportGeneration({ exportId: exportRecord.id });

      return reply.code(201).send(toExportResponse(exportRecord));
    }
  );

  app.get(
    '/',
    {
      preHandler: requireInstitutionAdmin
    },
    async (request, reply) => {
      const { page, limit } = paginationQuerySchema.parse(request.query);

      const { data, total } = await listExports(app.prisma, {
        institutionId: request.user!.institutionId,
        page,
        limit
      });

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        data: data.map(toExportResponse),
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages
        }
      });
    }
  );

  app.get(
    '/:id',
    {
      preHandler: requireInstitutionAdmin
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const exportRecord = await getExportById(app.prisma, {
        id,
        institutionId: request.user!.institutionId
      });

      if (!exportRecord) {
        return reply.code(404).send({ error: 'not_found' });
      }

      return reply.send(toExportResponse(exportRecord));
    }
  );

  app.get(
    '/:id/download',
    {
      preHandler: requireInstitutionAdmin
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const exportRecord = await getExportById(app.prisma, {
        id,
        institutionId: request.user!.institutionId
      });

      if (!exportRecord || exportRecord.status !== 'completed') {
        return reply.code(404).send({ error: 'not_found' });
      }

      try {
        const { url } = await getFreshDownloadUrl(app.prisma, exportRecord);
        return reply.redirect(url);
      } catch {
        return reply.code(404).send({ error: 'not_found' });
      }
    }
  );
};

export default exportsRoutes;
