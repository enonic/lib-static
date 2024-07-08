import { getPathError } from '/lib/enonic/static/path/getPathError';
import { resolvePath } from '/lib/enonic/static/path/resolvePath';


export const resolveRoot = (root: string) => {
  let resolvedRoot = resolvePath(root.replace(/^\/+/, '').replace(/\/+$/, ''));

  let errorMessage = getPathError(resolvedRoot);
  if (!errorMessage) {
    // TODO: verify that root exists and is a directory?
    if (!resolvedRoot) {
      errorMessage = "resolves to the JAR root / empty or all-spaces";
    }
  }
  if (errorMessage) {
    throw Error(`Illegal root argument (or .root option attribute) ${JSON.stringify(root)}: ${errorMessage}`);
  }

  return "/" + resolvedRoot;
};
