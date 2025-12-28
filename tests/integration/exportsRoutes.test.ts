import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { createTestApp, resetDb, adminHeaders, teacherHeaders } from '../helpers/testApp.js';

describe('exports routes (integration)', () => {
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

  test('only institution_admin can request exports', async () => {
    const res = await ctx.app!.inject({
      method: 'POST',
      url: '/api/exports',
      headers: teacherHeaders,
      payload: { entity_type: 'students' }
    });

    expect(res.statusCode).toBe(403);
  });

  test('request export creates pending export record and audit log', async () => {
    const res = await ctx.app!.inject({
      method: 'POST',
      url: '/api/exports',
      headers: adminHeaders,
      payload: { entity_type: 'students', filters: { active: true } }
    });

    expect(res.statusCode).toBe(201);

    const body = res.json();
    expect(body.status).toBe('pending');
    expect(body.entity_type).toBe('students');
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    const auditCount = await ctx.app!.prisma.auditLog.count();
    expect(auditCount).toBe(1);
  });

  test('lists exports for institution with pagination', async () => {
    for (let i = 0; i < 3; i++) {
      await ctx.app!.inject({
        method: 'POST',
        url: '/api/exports',
        headers: adminHeaders,
        payload: { entity_type: 'students', filters: { grade: String(i + 1) } }
      });
    }

    await ctx.app!.inject({
      method: 'POST',
      url: '/api/exports',
      headers: {
        ...adminHeaders,
        'x-user-id': 'user-99',
        'x-institution-id': 'inst-2'
      },
      payload: { entity_type: 'students' }
    });

    const listRes = await ctx.app!.inject({
      method: 'GET',
      url: '/api/exports?page=1&limit=2',
      headers: adminHeaders
    });

    expect(listRes.statusCode).toBe(200);
    const body = listRes.json();

    expect(body.data).toHaveLength(2);
    expect(body.pagination.total).toBe(3);
    expect(body.pagination.total_pages).toBe(2);
  });

  test('download endpoint returns 404 if export is not yet completed', async () => {
    const createRes = await ctx.app!.inject({
      method: 'POST',
      url: '/api/exports',
      headers: adminHeaders,
      payload: { entity_type: 'students' }
    });

    const { id } = createRes.json();

    const downloadRes = await ctx.app!.inject({
      method: 'GET',
      url: `/api/exports/${id}/download`,
      headers: adminHeaders
    });

    expect(downloadRes.statusCode).toBe(404);
  });
});
