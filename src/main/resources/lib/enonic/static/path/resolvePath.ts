export const resolvePath = (path: string) => {
  const rootArr = path.split(/\/+/).filter(i => !!i);
  for (let i=1; i<rootArr.length; i++) {
    if (rootArr[i].endsWith('..')) {
      rootArr.splice(i - 1, 2);
      i -= 2;
    }
  }
  return rootArr.join('/').trim();
}
