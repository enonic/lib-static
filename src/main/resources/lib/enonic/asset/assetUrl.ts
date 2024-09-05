import type {assetUrl as assetUrlFn} from '/lib/xp/portal'

import { serviceUrlRootViaAssetUrl } from '/lib/enonic/static/service/serviceUrlRootViaAssetUrl';
import { getFingerprint } from '/lib/enonic/static/runMode';

// https://developer.enonic.com/docs/xp/stable/runtime/engines/asset-service
// <app-root>/_/asset/<app-name><:build-id>/<asset-path>

// https://developer.enonic.com/docs/xp/stable/runtime/engines/http-service
// **/_/service/<appname>/<servicename>

export const assetUrl: typeof assetUrlFn = ({
  application,
  params,
  path,
  type,
}) => {
  const pathWithoutTrailingSlash = path.replace(/\/$/, '');
  let staticServiceUrl = serviceUrlRootViaAssetUrl({
    params,
    service: 'asset',
    type,
  });
  if (application !== app.name) {
    staticServiceUrl.replace(`/_/service/${app.name}/asset/`, `/_/service/${application}/asset/`);
  }
  const fingerprint = getFingerprint(application);
  if (fingerprint) {
    staticServiceUrl.replace(`/_/service/${application}/asset/`, `/_/service/${application}:${fingerprint}/asset/`);
  }
  const firstQuestionMarkIndex = staticServiceUrl.indexOf('?');
  if (firstQuestionMarkIndex !== -1) {
    return `${staticServiceUrl.substring(0, firstQuestionMarkIndex)}/${pathWithoutTrailingSlash}${staticServiceUrl.substring(firstQuestionMarkIndex)}`;
  }
  return `${staticServiceUrl}/${pathWithoutTrailingSlash}`;
}
