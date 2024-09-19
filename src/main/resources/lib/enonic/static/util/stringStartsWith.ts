export function stringStartsWith(
	string :string,
	searchString :string,
	position :number = 0
) :boolean {
	const pos = position > 0 ? position|0 : 0;
	return string.substring(pos, pos + searchString.length) === searchString;
}
