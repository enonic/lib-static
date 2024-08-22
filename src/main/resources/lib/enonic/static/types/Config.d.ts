export type CacheStrategy = 'etag'|'immutable'

export interface Config {
  cacheStrategy: CacheStrategy
  etagCacheControlHeader: string
  etagProcessing: 'auto'|'always'|'never'
  immutableCacheControlHeader: string
  root: string
}
