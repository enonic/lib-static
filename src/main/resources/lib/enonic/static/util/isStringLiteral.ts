export const isStringLiteral = (value: unknown): value is string =>
	typeof value === 'string'
