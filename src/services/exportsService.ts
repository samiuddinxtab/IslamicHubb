import type { Export, PrismaClient } from '@prisma/client';
import { ExportStatus } from '@prisma/client';
import { createSignedDownloadUrl } from '../lib/s3.js';

export async function requestExport(
  prisma: PrismaClient,
  params: {
    institutionId: string;
    requestedByUserId: string;
    entityType: string;
    filters?: unknown;
  }
): Promise<Export> {
  return prisma.export.create({
    data: {
      institutionId: params.institutionId,
      requestedByUserId: params.requestedByUserId,
      entityType: params.entityType,
      filters: params.filters ?? null,
      status: ExportStatus.pending
    }
  });
}

export async function listExports(
  prisma: PrismaClient,
  params: {
    institutionId: string;
    page: number;
    limit: number;
  }
): Promise<{ data: Export[]; total: number }> {
  const skip = (params.page - 1) * params.limit;

  const [data, total] = await Promise.all([
    prisma.export.findMany({
      where: { institutionId: params.institutionId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit
    }),
    prisma.export.count({ where: { institutionId: params.institutionId } })
  ]);

  return { data, total };
}

export async function getExportById(
  prisma: PrismaClient,
  params: {
    id: string;
    institutionId: string;
  }
): Promise<Export | null> {
  return prisma.export.findFirst({
    where: {
      id: params.id,
      institutionId: params.institutionId
    }
  });
}

export async function markExportCompleted(
  prisma: PrismaClient,
  params: {
    id: string;
    fileKey: string;
  }
): Promise<Export> {
  const { url: fileUrl, expiresAt: fileUrlExpiresAt } = createSignedDownloadUrl({
    key: params.fileKey
  });

  return prisma.export.update({
    where: { id: params.id },
    data: {
      status: ExportStatus.completed,
      fileKey: params.fileKey,
      fileUrl,
      fileUrlExpiresAt
    }
  });
}

export async function markExportFailed(
  prisma: PrismaClient,
  params: {
    id: string;
  }
): Promise<Export> {
  return prisma.export.update({
    where: { id: params.id },
    data: {
      status: ExportStatus.failed
    }
  });
}

export async function getFreshDownloadUrl(
  prisma: PrismaClient,
  exportRecord: Export
): Promise<{ url: string }> {
  if (exportRecord.status !== ExportStatus.completed || !exportRecord.fileKey) {
    throw new Error('Export is not completed');
  }

  if (exportRecord.fileUrl && exportRecord.fileUrlExpiresAt) {
    const now = Date.now();
    if (exportRecord.fileUrlExpiresAt.getTime() > now) {
      return { url: exportRecord.fileUrl };
    }
  }

  const { url, expiresAt } = createSignedDownloadUrl({ key: exportRecord.fileKey });

  await prisma.export.update({
    where: { id: exportRecord.id },
    data: {
      fileUrl: url,
      fileUrlExpiresAt: expiresAt
    }
  });

  return { url };
}
