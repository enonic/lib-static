export declare interface DefaultCookies {
	enonic_xp_tour?: string
	JSESSIONID?: string
	[key: string]: string|undefined
}

export declare interface DefaultHeaders {
	accept?: string // text/html
	'accept-charset'?: string
	'accept-encoding'?: string
	'accept-language'?: string
	authorization?: string
	'cache-control'?: string // no-cache
	connection?: string // keep-alive
	'content-length'?: string
	'content-type'?: string // application/json
	cookie?: string
	language?: string
	host?: string
	'if-none-match'?: string
	'sec-ch-ua'?: string
	'sec-ch-ua-mobile'?: string
	'sec-ch-ua-platform'?: string
	'sec-fetch-dest'?: string
	'sec-fetch-mode'?: string
	'sec-fetch-site'?: string
	'sec-fetch-user'?: string
	'upgrade-insecure-requests'?: string
	'user-agent'?: string
	'x-forwarded-for'?: string
	'x-forwarded-host'?: string
	'x-forwarded-proto'?: string
	'x-forwarded-server'?: string
	[headerName: string]: string|undefined
}

export declare type Request<
	T extends Record<string, unknown> = {
		body?: string // Often JSON
		contextPath?: string
		contentType?: string
		cookies?: DefaultCookies
		followRedirects?: boolean
		headers?: DefaultHeaders
		params?: Record<string, string | string[]>
		pathParams?: Record<string, string>
		rawPath?: string
		repositoryId?: string
		remoteAddress?: string
		webSocket?: boolean
	}
> = {
	branch: 'draft'|'master' // string
	host: string
	method: 'GET'|'POST'|'PUT'|'DELETE'|'HEAD'|'OPTIONS'|'PATCH'
	mode: 'edit'|'inline'|'live'|'preview'
	path: string
	port: number|string
	scheme: string // Using just string to match mock-xp.Request
	url: string
} & T
