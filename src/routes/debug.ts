import { runWeatherNotification } from '@/scheduled/weather-notification';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.get('/weather-notification', async (c) => {
	await runWeatherNotification(c.env);
	return c.json({ status: 'ok' });
});

export default app;
