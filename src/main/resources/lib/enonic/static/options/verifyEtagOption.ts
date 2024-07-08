export const verifyEtagOption = (etag:Boolean|undefined) => {
  if (etag !== true && etag !== false && etag !== undefined) {
    throw Error("Unexpected 'etag' option: only true, false or undefined are allowed.");
  }
};
