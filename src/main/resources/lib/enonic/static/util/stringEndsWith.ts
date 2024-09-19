export function stringEndsWith(
	string: string,
	suffix: string,
): boolean {
	return string.indexOf(suffix, string.length - suffix.length) !== -1;
}
