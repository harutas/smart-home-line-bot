import type { Context, Next } from 'hono';
import type { HonoVariables } from '../types/hono';

type HonoEnv = { Bindings: Env; Variables: HonoVariables };

export async function allowedUsersMiddleware(c: Context<HonoEnv>, next: Next) {
	const allowed = new Set(c.env.ALLOWED_LINE_USER_IDS.split(',').map((id) => id.trim()));
	const filtered = c.get('events').filter((event) => event.source.userId && allowed.has(event.source.userId));
	c.set('events', filtered);
	await next();
}
