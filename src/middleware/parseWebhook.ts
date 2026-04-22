import type { HonoVariables } from '@/types/hono';
import type { LineWebhookBody } from '@/types/line';
import type { Context, Next } from 'hono';

type HonoEnv = { Bindings: Env; Variables: HonoVariables };

export async function parseWebhookMiddleware(c: Context<HonoEnv>, next: Next) {
	const body: LineWebhookBody = JSON.parse(c.get('rawBody'));
	c.set('events', body.events);
	await next();
}
