import type {
  AssetUrlParams,
  ServiceUrlParams
} from '/lib/xp/portal';

import { assetUrl as getAssetUrl } from '/lib/xp/portal';

const SERVICE_NAME = 'static';

export function serviceUrlRootViaAssetUrl({
  params,
  type = 'server',
}:{
  params?: ServiceUrlParams['params']
  type?: AssetUrlParams['type']
}) {
  let assetUrl = getAssetUrl({
    path:'/',
    params,
    type
  });
  log.debug('assetUrl:%s', assetUrl);

  let assetUrlParams = '';

  const firstQuestionMarkIndex = assetUrl.indexOf('?');
  if (firstQuestionMarkIndex !== -1) {
    assetUrlParams = assetUrl.substring(firstQuestionMarkIndex);
    log.debug('assetUrlParams:%s', assetUrlParams);

    assetUrl = assetUrl.substring(0, firstQuestionMarkIndex);
    log.debug('assetUrlWithoutParams:%s', assetUrl);
  }

  const serviceUrlRootWithoutParams = assetUrl
    .replace(/\/edit\/([^\/]+)\/([^\/]+)\/_\/asset/,'/preview/$1/$2/_/asset') // Avoid: Assets give 404 in edit mode
    .replace(/\/_\/asset\/.*$/, `/_/service/${app.name}/${SERVICE_NAME}/`)
    .replace(/\/+$/, '');
  log.debug('serviceUrlRootWithoutParams:%s', serviceUrlRootWithoutParams);

  return `${serviceUrlRootWithoutParams}${assetUrlParams}`;
}