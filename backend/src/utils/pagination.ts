/**
 * Pagination Utilities
 * Provides standard pagination helpers for API responses
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
  skip?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Parse pagination parameters from query string
 * Supports both offset-based (limit/offset) and page-based (page/pageSize) pagination
 */
export function parsePaginationParams(params: PaginationParams): {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
} {
  // Support both limit/offset and page/pageSize
  const pageSize = params.pageSize || params.limit || 20;
  const page = params.page || 1;
  
  // If offset/skip provided, calculate page from it
  const skip = params.offset || params.skip || (page - 1) * pageSize;
  
  // Validation
  const validPageSize = Math.min(Math.max(pageSize, 1), 100); // 1-100 items per page
  const validPage = Math.max(page, 1);
  const validSkip = Math.max(skip, 0);
  
  return {
    skip: validSkip,
    take: validPageSize,
    page: validPage,
    pageSize: validPageSize,
  };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Express middleware to parse pagination from query
 */
export function paginationMiddleware(req: any, _res: any, next: any) {
  const { page, pageSize, limit, offset } = req.query;
  
  req.pagination = parsePaginationParams({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  });
  
  next();
}
