/////////////////////////////////////////////////////////  Cache-control constants:

const DEFAULT_MAX_AGE = 31536000;

export const DEFAULT_CACHE_CONTROL_FIELDS = [
    "public",
    "max-age=" + DEFAULT_MAX_AGE,
    "immutable"
];
export const DEFAULT_CACHE_CONTROL = DEFAULT_CACHE_CONTROL_FIELDS.join(", ");
export const INDEXFALLBACK_CACHE_CONTROL = 'no-cache';
