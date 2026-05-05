import { isDevelopment } from '@/lib/env';
import { fetchDailyForecast } from '@/lib/open-meteo';
import { buildWeatherFlexMessage } from '@/lib/weather-flex-message';
import { messagingApi, webhook } from '@line/bot-sdk';

export async function handleMessageEvent(event: webhook.MessageEvent, env: Env): Promise<void> {
	const message = event.message;

	// デバッグ用
	if (!isDevelopment(env) || message.type !== 'text') {
		return;
	}

	const client = new messagingApi.MessagingApiClient({ channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN });

	if (message.text === '天気') {
		const config = JSON.parse(atob(env.WEATHER_CONFIG)) as { home: { latitude: number; longitude: number } };
		const forecast = await fetchDailyForecast(config.home.latitude, config.home.longitude);
		const flexMessage = buildWeatherFlexMessage(forecast);

		await client.replyMessage({ replyToken: event.replyToken!, messages: [flexMessage] });

		return;
	}

	console.log('text message:', message.text);
}
