import type {
	Request,
	Response,
} from '/lib/enonic/static/types';

import Router from '/lib/router';
import { handleResourceRequest } from '/lib/enonic/static/service/handleResourceRequest'


const router = Router();

router.get('{path:.*}', (request: Request): Response => {
  return handleResourceRequest({ request });
});

export const all = (request: Request) => router.dispatch(request);
