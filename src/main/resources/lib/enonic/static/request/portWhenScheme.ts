export function portWhenScheme({
  port,
  scheme
}: {
  port?: string | number,
  scheme: string // 'http' | 'https'
}) {
  if (port === 80 && scheme === 'http') {
    return '';
  }
  if (port === 443 && scheme === 'https') {
    return '';
  }
  return `:${port}`;
}
