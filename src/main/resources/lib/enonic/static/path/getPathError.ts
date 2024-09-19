import {
  REGEX_PATH_DOUBLE_DOT,
  REGEX_PATH_ILLEGAL_CHARS,
} from '/lib/enonic/static/constants';

export const ERROR_MESSAGE_PATH_SLASH_OR_EMPTY = 'resolves to the JAR root / empty or all-spaces';

// Very conservative filename verification:
// Actual filenames with these characters are rare and more likely to be attempted attacks.
// For now, easier/cheaper to just prevent them. Revisit this later if necessary.
export const getPathError = (trimmedPathString: string): string|undefined => {
  if (trimmedPathString.match(REGEX_PATH_DOUBLE_DOT) || trimmedPathString.match(REGEX_PATH_ILLEGAL_CHARS)) {
    return "can't contain '..' or any of these characters: \\ | ? * < > ' \" ` ´";
  }
  if (!trimmedPathString) {
    return ERROR_MESSAGE_PATH_SLASH_OR_EMPTY;
  }
};
