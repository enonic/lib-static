import type {
  VirtualHost,
  isEnabled,
  list,
} from '@enonic-types/lib-vhost';

import { jest } from '@jest/globals';


export function mockLibXpVhost({
  enabled = false,
  vhosts = [],
}: {
  enabled?: boolean
  vhosts?: VirtualHost[]
} = {}) {
  jest.mock('/lib/xp/vhost', () => ({
    isEnabled: jest.fn<typeof isEnabled>(() => enabled),
    list: jest.fn<typeof list>(() => ({
      vhosts
    })),
  }), { virtual: true });

}
