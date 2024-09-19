import {isObject} from '/lib/enonic/static/util/isObject';

export function mapKeys(
	obj: object,
	fn: ({
		key,
		result,
		value,
	}: {
		key: PropertyKey
		result: object
		value: unknown
	}) => void,
): object {
	if (!isObject(obj)) {
		throw new TypeError(`mapKeys: First param must be an object! got:${JSON.stringify(obj, null, 4)}`);
	}
	const result = {};
	const keys = Object.keys(obj);
	for (const key of keys) {
    fn({
        key,
        result,
        value: obj[key],
    });
  }
	return result;
}
