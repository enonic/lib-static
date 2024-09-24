import type {NotFoundHandler} from '/lib/enonic/static/types';

import {requestHandler} from '/lib/enonic/static/service/requestHandler';
import {notFoundResponse} from '/lib/enonic/static/response/responses';

export const spaNotFoundHandler: NotFoundHandler = ({
  cacheControl,
  contentType,
  etag,
  index,
  request,
  root,
  staticCompress,
  throwErrors,
}) => {
  // Recursively call requestHandler with the same parameters, except for notFound and relativePath.
  return requestHandler({
    cacheControl,
    contentType,
    etag,
    index,
    notFound: () => notFoundResponse(), // Avoid infinite loop

    // NOTE:
    // If index is truthy
    //  Then it shortcircuits the 301 redirect
    //    If there is a resource at `/${index}`
    //      Then it responds 200.
    //    Else if there is NO resource at `/${index}`
    //      Then it responds 404.
    // Else if index is falsy
    //   The it just returns '/'
    //   And responds correcly with 404, because there is no resource at '/'.
    relativePath: () => `/${index}`,
    // ERROR:
    // Always just returning '/' fails because the relativePath callback is used BOTH:
    //   1. to find the resource,
    //   2. BUT ALSO TO FIND THE indexResource,
    // And since '/' is never a resource, it will always return 404 !

    request,
    root,
    staticCompress,
    throwErrors,
  });
}
