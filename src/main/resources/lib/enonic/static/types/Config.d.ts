export type CacheStrategy = 'etag'|'immutable'

export interface Config {
  enabled: boolean // default is true
  cacheStrategy: CacheStrategy
  etagCacheControlHeader: string
  etagProcessing: 'auto'|'always'|'never'
  immutableCacheControlHeader: string
  root: string
}
