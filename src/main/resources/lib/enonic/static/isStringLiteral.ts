export const isStringLiteral = (value: string | unknown): value is string =>
	typeof value === 'string'
