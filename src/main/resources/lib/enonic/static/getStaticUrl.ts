import type {
  AssetUrlParams,
  ServiceUrlParams,
} from '/lib/xp/portal';

import { getStaticPath } from '/lib/enonic/static/getStaticPath';
import { serviceUrlRootViaAssetUrl } from '/lib/enonic/static/service/serviceUrlRootViaAssetUrl';


export function getStaticUrl({
  params,
  path, // relative to the root
  root,
  service,
  type = 'server',
}: {
  params?: ServiceUrlParams['params']
  path: string
  root?: string
  service?: string
  type?: AssetUrlParams['type'] // AssetUrl doesn't support 'websocket'
}): string {
  const staticPath = getStaticPath({ path, root });
  const staticServiceUrl = serviceUrlRootViaAssetUrl({
    params,
    service,
    type,
  });
  const firstQuestionMarkIndex = staticServiceUrl.indexOf('?');
  if (firstQuestionMarkIndex !== -1) {
    return `${staticServiceUrl.substring(0, firstQuestionMarkIndex)}/${staticPath}${staticServiceUrl.substring(firstQuestionMarkIndex)}`;
  }
  return `${staticServiceUrl}/${staticPath}`;
}
