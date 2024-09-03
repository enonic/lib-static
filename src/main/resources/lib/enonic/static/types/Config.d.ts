// export type CacheStrategy = 'etag'|'immutable'

export interface Config {
  enabled: boolean // default is true
  etag: 'auto'|'on'|'off' // default is 'auto'
  cacheControl: string
  root: string
}
