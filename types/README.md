# Types for Static asset library

## Install

```bash
npm i --save-dev @enonic-types/lib-static
```

## Setup

Add lib-static to compilerOptions.paths in the tsconfig.json file:

```json
{
  "compilerOptions": {
    "paths": {
      "/lib/enonic/static": ["node_modules/@enonic-types/lib-static"],
    }
  }
}
```

## Use

```typescript
import {requestHandler} from '/lib/enonic/static';
```

All imports from /lib/enonic/static should now be typed.

## Documentation

[Static asset library](https://developer.enonic.com/docs/lib-static)
