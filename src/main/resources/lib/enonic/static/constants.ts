const DEFAULT_MAX_AGE = 31536000;

export const DEFAULT_CACHE_CONTROL_FIELDS = [
    "public",
    "max-age=" + DEFAULT_MAX_AGE,
    "immutable"
];
export const DEFAULT_CACHE_CONTROL = DEFAULT_CACHE_CONTROL_FIELDS.join(", ");
export const DEFAULT_CACHE_CONTROL_WHEN_ETAG = 'max-age=3600';

export const HTTP2_REQUEST_HEADER_IF_NONE_MATCH = 'if-none-match';

export const HTTP2_RESPONSE_HEADER_NAME_CACHE_CONTROL = 'cache-control';
export const HTTP2_RESPONSE_HEADER_NAME_ETAG = 'etag';

export const CACHE_CONTROL_IMMUTABLE = `public, max-age=${DEFAULT_MAX_AGE}, immutable`;
export const CACHE_CONTROL_NO_CACHE = 'no-cache';
export const INDEXFALLBACK_CACHE_CONTROL = CACHE_CONTROL_NO_CACHE;

export const GETTER_ROOT = 'static';

export const RESPONSE_NOT_MODIFIED = {
    status: 304
} as const;

export const REGEX_PATH_DOUBLE_DOT = /\.\./;
export const REGEX_PATH_ILLEGAL_CHARS = /[<>:"'`´\\|?*]/;
