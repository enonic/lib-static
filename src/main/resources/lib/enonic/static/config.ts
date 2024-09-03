import type {
  Config,
} from '/lib/enonic/static/types';

import { getResource, readText } from '/lib/xp/io';
import {
  CACHE_CONTROL_DEFAULT,
  GETTER_ROOT
} from '/lib/enonic/static/constants';
import { isDev } from '/lib/enonic/static/runMode';


const RESOURCE_PATH = '/lib/enonic/static/config.json';

const DEFAULT_CONFIG: Config = {
  // cacheStrategy: 'etag',
  enabled: true,
  etag: 'auto',
  cacheControl: CACHE_CONTROL_DEFAULT,
  root: GETTER_ROOT
};

function _getConfig(): Config {
  const resource = getResource(RESOURCE_PATH);
  if (!resource.exists()) {
    return DEFAULT_CONFIG;
  }
  const resourceJson: string = readText(resource.getStream());
  let configFromFile: Config;
  try {
    configFromFile = JSON.parse(resourceJson);
  } catch (e) {
    log.error(`Something went wrong while parsing resource path:${RESOURCE_PATH} json:${resourceJson}!`, e);
  }
  return {
    ...DEFAULT_CONFIG,
    ...configFromFile,
  };
}

const CONFIG: Config = _getConfig();

export function getConfig(): Config {
  if (isDev()) {
    return _getConfig();
  }
  return CONFIG;
}

export function getConfiguredEtag(): Config['etag'] {
  return getConfig().etag;
}

export function getConfiguredCacheControl(): Config['cacheControl'] {
  return getConfig().cacheControl;
}

export function getRoot(): Config['root'] {
  return getConfig().root;
}

export function isEnabled(): Config['enabled'] {
  return getConfig().enabled;
}
