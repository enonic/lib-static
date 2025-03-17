export type {Resource} from '@enonic-types/lib-io';

export type {LibStaticResourceInterface} from './Io'; // Keep this relative for @enonic-types/lib-static to be correct.
export type {
  CacheControlResolver,
  ContentTypeResolver,
  NotFoundHandler,
  RequestHandler,
  RequestHandlerOptions,
} from './Options'; // Keep this relative for @enonic-types/lib-static to be correct.
