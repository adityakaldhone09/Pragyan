export function toCareerSlug(value: string) {
  return String(value || 'career-journey')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
