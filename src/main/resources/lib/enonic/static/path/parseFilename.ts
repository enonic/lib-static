export function parseFilename({
  filename
}: {
  filename: string
}) {
  const lastDotI = filename.lastIndexOf('.');

  if (lastDotI === -1) { // No extension
    return {
      ext: '',
      filename,
    };
  }

  return {
    ext: filename.slice(lastDotI + 1),
    filename: filename.slice(0, lastDotI),
  };
}
