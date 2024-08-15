import type {
  AssetUrlParams,
  ServiceUrlParams,
} from '/lib/xp/portal';

import { getStaticPath } from '/lib/enonic/static/getStaticPath';
import { serviceUrlRootViaAssetUrl } from '/lib/enonic/static/service/serviceUrlRootViaAssetUrl';


export function getStaticUrl({
  params,
  relResourcePath, // relative to the root
  root,
  type = 'server',
}: {
  params?: ServiceUrlParams['params']
  relResourcePath: string
  root?: string
  type?: AssetUrlParams['type'] // AssetUrl doesn't support 'websocket'
}): string {
  const staticPath = getStaticPath({ relResourcePath, root });
  const staticServiceUrl = serviceUrlRootViaAssetUrl({
    params,
    type,
  });
  const firstQuestionMarkIndex = staticServiceUrl.indexOf('?');
  if (firstQuestionMarkIndex !== -1) {
    return `${staticServiceUrl.substring(0, firstQuestionMarkIndex)}/${staticPath}${staticServiceUrl.substring(firstQuestionMarkIndex)}`;
  }
  return `${staticServiceUrl}/${staticPath}`;
}
