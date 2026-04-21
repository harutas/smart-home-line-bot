import { validateSignature, LINE_SIGNATURE_HTTP_HEADER_NAME } from '@line/bot-sdk';
import type { Context, Next } from 'hono';
import type { HonoVariables } from '../types/hono';

type HonoEnv = { Bindings: Env; Variables: HonoVariables };

export async function lineSignatureMiddleware(c: Context<HonoEnv>, next: Next) {
	const signature = c.req.header(LINE_SIGNATURE_HTTP_HEADER_NAME);
	if (!signature) {
		return c.json({ error: 'Missing x-line-signature' }, 400);
	}

	const body = await c.req.text();
	const channelSecret = c.env.LINE_CHANNEL_SECRET;

	if (!validateSignature(body, channelSecret, signature)) {
		return c.json({ error: 'Invalid signature' }, 400);
	}

	c.set('rawBody', body);
	await next();
}
