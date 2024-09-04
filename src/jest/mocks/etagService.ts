export function mockEtagService({
  resources = {}
}: {
  resources?: Record<string, {
    bytes?: string
    exists?: boolean
    etag?: string
    isDirectory?: boolean
    mimeType?: string
  }>
}) {
  return {
    getEtag: (path: string, etagOverride?: number) => {
      if (etagOverride === -1) {
        return {
          etag: undefined
        };
      }
      const name = path.replace(/^com\.example\.myproject:/, '');
      // console.debug('getEtag', {name, path, etagOverride});
      const resource = resources[name];
      if (resource) {
        return {
          etag: resource.etag ? `"${resource.etag}"` : undefined
        };
      }
      throw new Error(`getEtag: Unmocked path:${path} etagOverride:${etagOverride}!`);
    }
  }
}
