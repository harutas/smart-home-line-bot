import { isDevelopment } from '@/lib/env';
import { fetchDailyForecast } from '@/lib/open-meteo';
import { buildWeatherFlexMessage } from '@/lib/weather-flex-message';
import { LineMessageEvent } from '@/types/line';
import { messagingApi } from '@line/bot-sdk';

export async function handleMessageEvent(event: LineMessageEvent, env: Env): Promise<void> {
	// デバッグ用
	if (!isDevelopment(env) || event.message.type !== 'text') {
		return;
	}

	if (event.message.text === '天気') {
		const config = JSON.parse(atob(env.WEATHER_CONFIG)) as { home: { latitude: number; longitude: number } };
		const forecast = await fetchDailyForecast(config.home.latitude, config.home.longitude);
		const flexMessage = buildWeatherFlexMessage(forecast);

		const client = new messagingApi.MessagingApiClient({ channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN });
		await client.replyMessage({ replyToken: event.replyToken, messages: [flexMessage] });

		return;
	}

	console.log('text message:', event.message.text);
}
