import { isDevelopment } from '@/lib/env';
import type { HonoVariables } from '@/types/hono';
import type { Context, Next } from 'hono';

type HonoEnv = { Bindings: Env; Variables: HonoVariables };

export async function isDevelopmentMiddleware(c: Context<HonoEnv>, next: Next) {
	if (!isDevelopment(c.env)) {
		return c.json({ error: 'This endpoint is only available in development' }, 403);
	}

	await next();
}
