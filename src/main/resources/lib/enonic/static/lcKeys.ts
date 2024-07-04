import { mapKeys } from '/lib/enonic/static/mapKeys';


export function lcKeys(obj: object) {
	return mapKeys(obj,({
		key,
		result,
		value
	}) => {
		result[String(key).toLowerCase()] = value;
	});
}
