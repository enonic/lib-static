import type {
  AssetUrlParams,
  ServiceUrlParams,
} from '/lib/xp/portal';

import { serviceUrlRootViaAssetUrl } from '/lib/enonic/static/service/serviceUrlRootViaAssetUrl';


export function getStaticUrl({
  params,
  path, // relative to the root
  service,
  type = 'server',
}: {
  params?: ServiceUrlParams['params']
  path: string
  service?: string
  type?: AssetUrlParams['type'] // AssetUrl doesn't support 'websocket'
}): string {
  const pathWithoutTrailingSlash = path.replace(/\/$/, '');
  const staticServiceUrl = serviceUrlRootViaAssetUrl({
    params,
    service,
    type,
  });
  const firstQuestionMarkIndex = staticServiceUrl.indexOf('?');
  if (firstQuestionMarkIndex !== -1) {
    return `${staticServiceUrl.substring(0, firstQuestionMarkIndex)}/${pathWithoutTrailingSlash}${staticServiceUrl.substring(firstQuestionMarkIndex)}`;
  }
  return `${staticServiceUrl}/${pathWithoutTrailingSlash}`;
}
