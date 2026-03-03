export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(Math.max(1, parseInt(query.limit) || 10), 100);
  return { page, limit };
}
