/////////////////////////////////////////////////////////  Cache-control constants:

const DEFAULT_MAX_AGE = 31536000;

exports.DEFAULT_CACHE_CONTROL_FIELDS = [
    "public",
    "max-age=" + DEFAULT_MAX_AGE,
    "immutable"
];
const DEFAULT_CACHE_CONTROL = exports.DEFAULT_CACHE_CONTROL_FIELDS.join(", ");

const INDEXFALLBACK_CACHE_CONTROL = 'no-cache';

exports.DEFAULT_CACHE_CONTROL = DEFAULT_CACHE_CONTROL;
exports.INDEXFALLBACK_CACHE_CONTROL = INDEXFALLBACK_CACHE_CONTROL;
