import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Schema walidacji UUID (projectId)
 */
export const uuidSchema = z.string().uuid('Nieprawidłowy format UUID');

/**
 * Schema dla tworzenia projektu
 */
export const createProjectSchema = z.object({
  keyword: z
    .string()
    .min(1, 'Słowo kluczowe jest wymagane')
    .max(200, 'Słowo kluczowe może mieć maksymalnie 200 znaków')
    .trim(),
  language: z
    .string()
    .max(50, 'Język może mieć maksymalnie 50 znaków')
    .optional()
    .default('Polish'),
  ai_overview_content: z
    .string()
    .max(50000, 'AI Overview może mieć maksymalnie 50000 znaków')
    .optional()
    .nullable(),
});

/**
 * Schema dla workflow projectId
 */
export const workflowProjectIdSchema = z.object({
  projectId: uuidSchema,
});

/**
 * Schema dla semantic search
 */
export const semanticSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Zapytanie jest wymagane')
    .max(1000, 'Zapytanie może mieć maksymalnie 1000 znaków')
    .trim(),
  threshold: z
    .number()
    .min(0, 'Próg musi być >= 0')
    .max(1, 'Próg musi być <= 1')
    .optional()
    .default(0.1),
  limit: z
    .number()
    .int('Limit musi być liczbą całkowitą')
    .min(1, 'Limit musi być >= 1')
    .max(100, 'Limit musi być <= 100')
    .optional()
    .default(20),
});

/**
 * Schema dla product search
 */
export const productSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Zapytanie jest wymagane')
    .max(1000, 'Zapytanie może mieć maksymalnie 1000 znaków')
    .trim(),
  threshold: z
    .number()
    .min(0, 'Próg musi być >= 0')
    .max(1, 'Próg musi być <= 1')
    .optional()
    .default(0.15),
  limit: z
    .number()
    .int('Limit musi być liczbą całkowitą')
    .min(1, 'Limit musi być >= 1')
    .max(100, 'Limit musi być <= 100')
    .optional()
    .default(30),
});

/**
 * Schema dla OCR gazetka
 */
export const ocrGazetkaSchema = z.object({
  imageUrl: z
    .string()
    .url('imageUrl musi być prawidłowym URL')
    .max(2000, 'URL może mieć maksymalnie 2000 znaków'),
  gazetkaId: z
    .number()
    .int('gazetkaId musi być liczbą całkowitą')
    .positive('gazetkaId musi być dodatnie')
    .optional(),
  pageNumber: z
    .number()
    .int('pageNumber musi być liczbą całkowitą')
    .min(1, 'pageNumber musi być >= 1')
    .max(500, 'pageNumber musi być <= 500')
    .optional()
    .default(1),
  saveToDatabase: z.boolean().optional().default(false),
  provider: z.enum(['ollama', 'openrouter']).optional().default('ollama'),
  model: z.string().max(100, 'Model może mieć maksymalnie 100 znaków').optional(),
});

/**
 * Schema dla crop products
 */
export const cropProductsSchema = z.object({
  imageUrl: z
    .string()
    .url('imageUrl musi być prawidłowym URL')
    .max(2000, 'URL może mieć maksymalnie 2000 znaków'),
  products: z
    .array(
      z.object({
        id: z.string().min(1, 'id produktu jest wymagane').max(100),
        bbox: z.tuple([
          z.number().min(0, 'Współrzędna x1 musi być >= 0'),
          z.number().min(0, 'Współrzędna y1 musi być >= 0'),
          z.number().min(0, 'Współrzędna x2 musi być >= 0'),
          z.number().min(0, 'Współrzędna y2 musi być >= 0'),
        ]),
      })
    )
    .min(1, 'Wymagany jest co najmniej jeden produkt')
    .max(100, 'Maksymalnie 100 produktów'),
  gazetkaId: z.number().int().positive().optional(),
  pageNumber: z.number().int().min(1).optional(),
});

/**
 * Schema dla proxy image
 */
export const proxyImageSchema = z.object({
  url: z
    .string()
    .url('url musi być prawidłowym URL')
    .max(2000, 'URL może mieć maksymalnie 2000 znaków'),
});

/**
 * Typ wyniku walidacji
 */
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Helper do walidacji requestów API
 * @param schema - Schema Zod do walidacji
 * @param data - Dane do walidacji
 * @returns Wynik walidacji z danymi lub NextResponse z błędem
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Błąd walidacji',
          details: errors,
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Helper do walidacji URL parametrów (search params)
 */
export function validateSearchParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  const data: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    data[key] = value;
  });

  return validateRequest(schema, data);
}
