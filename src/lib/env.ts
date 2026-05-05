export function isDevelopment(env: Env): boolean {
	return env.ENVIRONMENT === 'development';
}
