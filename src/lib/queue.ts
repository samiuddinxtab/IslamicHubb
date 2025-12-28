import type { JobsOptions, Queue } from 'bullmq';

export type ExportJobPayload = {
  exportId: string;
};

let exportsQueue: Queue<ExportJobPayload> | null = null;

async function getExportsQueue(): Promise<Queue<ExportJobPayload> | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  if (exportsQueue) return exportsQueue;

  const { Queue } = await import('bullmq');
  exportsQueue = new Queue<ExportJobPayload>('exports', {
    connection: { url: redisUrl }
  });

  return exportsQueue;
}

export async function enqueueExportGeneration(
  payload: ExportJobPayload,
  opts?: JobsOptions
): Promise<void> {
  const queue = await getExportsQueue();
  if (!queue) return;

  await queue.add('generate_export', payload, opts);
}
