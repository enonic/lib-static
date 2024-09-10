import type {
  AssetUrlParams,
  ServiceUrlParams
} from '/lib/xp/portal';

import { assetUrl as getAssetUrl } from '/lib/xp/portal';

const SERVICE_NAME = 'static';

export function serviceUrlRootViaAssetUrl({
  application = app.name,
  params,
  service = SERVICE_NAME,
  type = 'server',
}:{
  application?: string
  params?: ServiceUrlParams['params']
  service?: string
  type?: AssetUrlParams['type']
}) {
  let assetUrl = getAssetUrl({
    path:'/',
    params,
    type
  });
  // log.debug('assetUrl:%s', assetUrl);

  let assetUrlParams = '';

  const firstQuestionMarkIndex = assetUrl.indexOf('?');
  if (firstQuestionMarkIndex !== -1) {
    assetUrlParams = assetUrl.substring(firstQuestionMarkIndex);
    // log.debug('assetUrlParams:%s', assetUrlParams);

    assetUrl = assetUrl.substring(0, firstQuestionMarkIndex);
    // log.debug('assetUrlWithoutParams:%s', assetUrl);
  }

  const serviceUrlRootWithoutParams = assetUrl
    .replace(/\/edit\/([^\/]+)\/([^\/]+)\/_\/asset/,'/preview/$1/$2/_/asset') // Avoid: Assets give 404 in edit mode
    .replace(/\/_\/asset\/.*$/, `/_/service/${application}/${service}/`)
    .replace(/\/+$/, '');
  // log.debug('serviceUrlRootWithoutParams:%s', serviceUrlRootWithoutParams);

  return `${serviceUrlRootWithoutParams}${assetUrlParams}`;
}
