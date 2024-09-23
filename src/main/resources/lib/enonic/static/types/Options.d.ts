import type {Resource} from '@enonic-types/lib-io';
import type {Request} from '/lib/enonic/static/types/Request';
import type {Response} from '/lib/enonic/static/types/Response';

export interface CacheControlResolverParams {
  contentType?: string
  path?: string
  resource?: Resource
}

export type CacheControlResolver = (params: CacheControlResolverParams) => string | null;

export interface ContentTypeResolverParams {
  path?: string
  resource?: Resource
}

export type ContentTypeResolver = (params: ContentTypeResolverParams) => string | null;

export type RelativePathResolver = (req: Request) => string;

export interface RequestHandlerParams {
  // Required
  request: Request
  // Optional
  cacheControl?: CacheControlResolver
  contentType?: ContentTypeResolver
  etag?: boolean
  index?: string|false
  relativePath?: RelativePathResolver
  root?: string
  staticCompress?: boolean
  throwErrors?: boolean
}

export type RequestHandler = (params: RequestHandlerParams) => Response;
