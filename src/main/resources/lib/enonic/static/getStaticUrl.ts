import type {
  AssetUrlParams,
  ServiceUrlParams,
} from '/lib/xp/portal';
// import type { Request } from '/lib/enonic/static/types';

// import { serviceUrl as getServiceUrl } from '/lib/xp/portal';
// import {
//   isEnabled as vhostsEnabled,
//   list as getVhosts
// } from '/lib/xp/vhost';
import { getStaticPath } from '/lib/enonic/static/getStaticPath';
// import { portWhenScheme } from '/lib/enonic/static/request/portWhenScheme';
import { serviceUrlRootViaAssetUrl } from '/lib/enonic/static/service/serviceUrlRootViaAssetUrl';


export function getStaticUrl({
  params,
  relResourcePath, // relative to the root
  // request,
  root,
  type = 'server',
}: {
  params?: ServiceUrlParams['params']
  relResourcePath: string
  // request?: Request
  root?: string
  type?: AssetUrlParams['type'] // AssetUrl doesn't support 'websocket'
}): string {
  const staticPath = getStaticPath({ relResourcePath, root });

  // I was told not to use vhost, and that new url features are on the way.
  // if (vhostsEnabled) {
  //   const {vhosts} = getVhosts();
  //   log.debug('vhosts:%s', JSON.stringify(vhosts, null, 4));

  //   if (type === 'server') {
  //     const mappingsToStaticService = vhosts.filter(({target}) => target === `/_/service/${app.name}/static`);
  //     if (mappingsToStaticService.length) {
  //       if (mappingsToStaticService.length > 1) {
  //         log.warning(`More than one vhost mapping to static service. Using the first one.`);
  //         log.debug('mappingsToStaticService:%s', JSON.stringify(mappingsToStaticService, null, 4));
  //       }
  //       const {
  //         // host,
  //         source
  //       } = mappingsToStaticService[0];
  //       return `${source}/${staticPath}`;
  //     }

  //   } else if (type === 'absolute') {
  //     if (!request) {
  //       const message = `Can't handle type absolute without request!`;
  //       log.error(message);
  //       throw new Error(message);
  //     }
  //     log.debug('request:%s', JSON.stringify(request, null, 4));
  //     const {
  //       host,
  //       port,
  //       scheme,
  //       // webSocket,
  //     } = request;
  //     const mappingsToStaticService = vhosts.filter(({
  //       host: vhostHost,
  //       target
  //     }) => target === `/_/service/${app.name}/static` && vhostHost === host);
  //     log.debug('mappingsToStaticService:%s', JSON.stringify(mappingsToStaticService, null, 4));
  //     if (mappingsToStaticService.length) {
  //       if (mappingsToStaticService.length > 1) {
  //         log.warning(`More than one vhost mapping to static service. Using the first one.`);
  //         log.debug('mappingsToStaticService:%s', JSON.stringify(mappingsToStaticService, null, 4));
  //       }
  //       const {
  //         // host,
  //         source
  //       } = mappingsToStaticService[0];
  //       return `${scheme}://${host}${portWhenScheme({
  //         port,
  //         scheme
  //       })}${source}/${staticPath}`;
  //     }
  //   } // type === 'absolute'
  //   // TODO? handle type === 'websocket'
  // } // vhostsEnabled

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
