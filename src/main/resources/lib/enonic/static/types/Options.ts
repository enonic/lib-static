import type {
  Request,
  Response,
  Resource,
} from '@enonic-types/core';

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

export interface NotFoundHandlerParams {
  path: string
  // Required
  request: Request
  // Optional
  cacheControl?: CacheControlResolver
  contentType?: ContentTypeResolver
  etag?: boolean
  index?: string|false
  // notFound?: NotFoundHandler
  // relativePath?: RelativePathResolver
  root?: string
  staticCompress?: boolean
  throwErrors?: boolean
}

export type NotFoundHandler = (params: NotFoundHandlerParams) => Response;

export interface RequestHandlerOptions {
  cacheControl?: CacheControlResolver
  contentType?: ContentTypeResolver
  etag?: boolean
  index?: string|false
  notFound?: NotFoundHandler
  relativePath?: RelativePathResolver
  root?: string
  staticCompress?: boolean
  throwErrors?: boolean
}

export type RequestHandler = (request: Request, options?: RequestHandlerOptions) => Response;
