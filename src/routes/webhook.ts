import { Hono } from 'hono';
import { lineSignatureMiddleware } from '../middleware/lineSignature';
import { parseWebhookMiddleware } from '../middleware/parseWebhook';
import { allowedUsersMiddleware } from '../middleware/allowedUsers';
import { handleMessageEvent } from '../handlers/message';
import { handlePostbackEvent } from '../handlers/postback';
import type { HonoVariables } from '../types/hono';

const webhook = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

webhook.post('/', lineSignatureMiddleware, parseWebhookMiddleware, allowedUsersMiddleware, async (c) => {
	await Promise.all(
		c.get('events').map((event) => {
			switch (event.type) {
				case 'message':
					return handleMessageEvent(event, c.env);
				case 'postback':
					return handlePostbackEvent(event, c.env);
				default:
					return Promise.resolve();
			}
		})
	);

	return c.json({ status: 'ok' });
});

export default webhook;
