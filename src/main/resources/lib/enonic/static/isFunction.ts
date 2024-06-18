/*
error  Don't use `Function` as a type. The `Function` type accepts any function-like value.
It provides no type safety when calling the function, which can be a common source of bugs.
It also accepts things like class declarations, which will throw at runtime as they will not be called with `new`.
If you are expecting the function to accept certain arguments, you should explicitly define the function shape  @typescript-eslint/ban-types
*/
// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction<FunctionShape extends Function>(value: unknown): value is FunctionShape {
	return Object.prototype.toString.call(value).slice(8,-1) === 'Function';
}
