import { isDevelopmentMiddleware } from '@/middleware/isDevelopment';
import debug from '@/routes/debug';
import webhook from '@/routes/webhook';
import { runWeatherNotification } from '@/scheduled/weather-notification';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.route('/webhook', webhook);

app.use('/debug/*', isDevelopmentMiddleware);
app.route('/debug', debug);

export default {
	fetch: app.fetch,
	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(runWeatherNotification(env));
	},
};
