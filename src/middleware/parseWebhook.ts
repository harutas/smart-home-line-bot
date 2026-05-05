import type { HonoVariables } from '@/types/hono';
import type { webhook } from '@line/bot-sdk';
import type { Context, Next } from 'hono';

type HonoEnv = { Bindings: Env; Variables: HonoVariables };

export async function parseWebhookMiddleware(c: Context<HonoEnv>, next: Next) {
	const body: webhook.CallbackRequest = JSON.parse(c.get('rawBody'));
	c.set('events', body.events);
	await next();
}
