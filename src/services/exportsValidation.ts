import { z } from 'zod';

export const entityTypeSchema = z.enum(['attendance', 'payments', 'students']);

const dateStringSchema = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

const attendanceFiltersSchema = z
  .object({
    date_from: dateStringSchema.optional(),
    date_to: dateStringSchema.optional(),
    student_id: z.string().uuid().optional()
  })
  .passthrough();

const paymentsFiltersSchema = z
  .object({
    date_from: dateStringSchema.optional(),
    date_to: dateStringSchema.optional(),
    status: z.enum(['paid', 'pending', 'failed']).optional()
  })
  .passthrough();

const studentsFiltersSchema = z
  .object({
    grade: z.string().min(1).optional(),
    active: z.boolean().optional()
  })
  .passthrough();

export function getFiltersSchema(entityType: z.infer<typeof entityTypeSchema>) {
  switch (entityType) {
    case 'attendance':
      return attendanceFiltersSchema;
    case 'payments':
      return paymentsFiltersSchema;
    case 'students':
      return studentsFiltersSchema;
  }
}

const createExportBodySchema = z.object({
  entity_type: entityTypeSchema,
  filters: z.unknown().optional()
});

export function parseCreateExportBody(input: unknown): {
  entityType: z.infer<typeof entityTypeSchema>;
  filters?: unknown;
} {
  const parsed = createExportBodySchema.parse(input);

  if (parsed.filters === undefined) {
    return { entityType: parsed.entity_type };
  }

  const filtersSchema = getFiltersSchema(parsed.entity_type);
  const filters = filtersSchema.parse(parsed.filters);
  return { entityType: parsed.entity_type, filters };
}

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
