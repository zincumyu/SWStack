export function resolveRedirect(raw: unknown, fallback = '/'): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return fallback
  }
  const path = raw.split('?')[0]?.split('#')[0] ?? ''
  if (path === '/login' || path === '/welcome') {
    return fallback
  }
  return raw
}
