// Avoid type errors
declare module globalThis {
  var _resources: Record<string, {
    bytes?: string
    exists?: boolean
    etag?: string
    mimeType?: string
  }>
}

export function mockEtagService() {
  return {
    getEtag: (path: string, etagOverride?: number) => {
      if (etagOverride === -1) {
        return {
          etag: undefined
        };
      }
      const name = path.replace(/^com\.example\.myproject:/, '');
      // console.debug('getEtag', {name, path, etagOverride});
      const resource = globalThis._resources[name];
      if (resource) {
        return {
          etag: resource.etag ? `"${resource.etag}"` : undefined
        };
      }
      throw new Error(`getEtag: Unmocked path:${path} etagOverride:${etagOverride}!`);
    }
  }
}
