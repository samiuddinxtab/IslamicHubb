import { describe, expect, test } from 'vitest';
import { parseCreateExportBody } from '../../src/services/exportsValidation.js';

describe('exportsValidation', () => {
  test('requires entity_type', () => {
    expect(() => parseCreateExportBody({})).toThrow();
  });

  test('validates filters by entity_type', () => {
    const parsed = parseCreateExportBody({
      entity_type: 'students',
      filters: { active: true, grade: '5' }
    });

    expect(parsed.entityType).toBe('students');
    expect(parsed.filters).toEqual({ active: true, grade: '5' });
  });

  test('rejects invalid date filters', () => {
    expect(() =>
      parseCreateExportBody({
        entity_type: 'attendance',
        filters: { date_from: 'not-a-date' }
      })
    ).toThrow();
  });

  test('rejects unexpected types for known filter keys', () => {
    expect(() =>
      parseCreateExportBody({
        entity_type: 'students',
        filters: { active: 'yes' }
      })
    ).toThrow();
  });
});
