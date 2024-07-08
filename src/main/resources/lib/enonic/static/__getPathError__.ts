// Very conservative filename verification:
// Actual filenames with these characters are rare and more likely to be attempted attacks.
// For now, easier/cheaper to just prevent them. Revisit this later if necessary.
const doubleDotRx = /\.\./;
const illegalCharsRx = /[<>:"'`´\\|?*]/;
// Exported for testing only
export const ERROR_MESSAGE_PATH_SLASH_OR_EMPTY = 'resolves to the JAR root / empty or all-spaces';
export const __getPathError__ = (trimmedPathString: string): string|undefined => {
  if (trimmedPathString.match(doubleDotRx) || trimmedPathString.match(illegalCharsRx)) {
    return "can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´";
  }
  if (!trimmedPathString) {
    return ERROR_MESSAGE_PATH_SLASH_OR_EMPTY;
  }
};
