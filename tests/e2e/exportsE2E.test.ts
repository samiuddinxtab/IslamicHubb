import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { createTestApp, resetDb, adminHeaders } from '../helpers/testApp.js';
import { markExportCompleted } from '../../src/services/exportsService.js';

describe('exports flow (e2e)', () => {
  const ctx: { app: Awaited<ReturnType<typeof createTestApp>> | null } = { app: null };

  beforeAll(async () => {
    ctx.app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb(ctx.app!);
  });

  afterAll(async () => {
    await ctx.app?.close();
  });

  test('admin requests export, polls status, downloads when ready', async () => {
    const createRes = await ctx.app!.inject({
      method: 'POST',
      url: '/api/exports',
      headers: adminHeaders,
      payload: { entity_type: 'attendance', filters: { date_from: '2025-01-01' } }
    });

    expect(createRes.statusCode).toBe(201);
    const created = createRes.json();

    expect(created.status).toBe('pending');

    const firstStatus = await ctx.app!.inject({
      method: 'GET',
      url: `/api/exports/${created.id}`,
      headers: adminHeaders
    });

    expect(firstStatus.statusCode).toBe(200);
    expect(firstStatus.json().status).toBe('pending');

    await markExportCompleted(ctx.app!.prisma, {
      id: created.id,
      fileKey: `exports/${created.id}.csv`
    });

    let status: any = null;

    for (let i = 0; i < 5; i++) {
      const res = await ctx.app!.inject({
        method: 'GET',
        url: `/api/exports/${created.id}`,
        headers: adminHeaders
      });

      status = res.json();
      if (status.status === 'completed') break;
    }

    expect(status.status).toBe('completed');
    expect(status.file_url).toContain('X-Amz-Expires=604800');

    const downloadRes = await ctx.app!.inject({
      method: 'GET',
      url: `/api/exports/${created.id}/download`,
      headers: adminHeaders
    });

    expect(downloadRes.statusCode).toBe(302);
    expect(downloadRes.headers.location).toBe(status.file_url);
  });
});
