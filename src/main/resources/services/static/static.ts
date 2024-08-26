import type {
	Request,
	Response,
} from '/lib/enonic/static/types';

import Router from '/lib/router';
import { requestHandler } from '/lib/enonic/static/service/requestHandler';


const router = Router();

router.get('{path:.*}', (request: Request): Response => {
  return requestHandler({ request });
});

export const all = (request: Request) => router.dispatch(request);
