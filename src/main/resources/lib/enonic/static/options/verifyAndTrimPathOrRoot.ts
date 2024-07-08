import type { BuildGetterParamsWithRoot } from '../types';


export const errorMessageTemplateFirstArgumentMissing = (label: 'path'|'root') =>
  `First argument (${label}OrOptions), or the ${label} attribute in it, is missing (or falsy)`;

// Verify that path or root is a string, and not empty (label is 'path' or 'root')
export const verifyAndTrimPathOrRoot = (
  pathOrRoot: string|BuildGetterParamsWithRoot,
  label: 'path'|'root'
) => {
    if (typeof pathOrRoot !== 'string') {
        if (pathOrRoot) {
            throw Error(`First argument (${label}OrOptions), or the ${label} attribute in it, is of unexpected type '${Array.isArray(pathOrRoot) ? "array" : typeof pathOrRoot}'. Expected: string or object.`);
        } else {
            throw Error(errorMessageTemplateFirstArgumentMissing(label));
        }
    }
    return pathOrRoot.trim();
}
