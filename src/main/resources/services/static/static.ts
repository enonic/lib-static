import type {
	Request,
	Response,
} from '/lib/enonic/static/types';

import Router from '/lib/router';
import { isEnabled } from '/lib/enonic/static/config';
import { requestHandler } from '/lib/enonic/static/service/requestHandler';

const router = Router();

router.get('{path:.*}', (request: Request): Response => {
  return requestHandler({ request });
});

export const all = (request: Request) => {
	if (isEnabled()) {
		return router.dispatch(request);
	}
	return { status: 404 };
}
