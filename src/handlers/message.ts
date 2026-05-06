import { isDevelopment } from '@/lib/env';
import { fetchDailyForecast } from '@/lib/open-meteo';
import { clearPendingAction, getPendingAction, getUserSettings, setUserSettings } from '@/lib/user-settings';
import { buildWeatherFlexMessage } from '@/lib/weather-flex-message';
import { FALLBACK_LOCATION } from '@/scheduled/weather-notification';
import { messagingApi, webhook } from '@line/bot-sdk';

export async function handleMessageEvent(event: webhook.MessageEvent, env: Env): Promise<void> {
	const { message } = event;

	switch (message.type) {
		case 'text':
			await handleTextMessage(event, message, env);
			break;
		case 'location':
			await handleLocationMessage(event, message, env);
			break;
	}
}

async function handleTextMessage(event: webhook.MessageEvent, message: webhook.TextMessageContent, env: Env): Promise<void> {
	if (!isDevelopment(env)) {
		return;
	}

	if (message.text === '天気') {
		const forecast = await fetchDailyForecast(FALLBACK_LOCATION.latitude, FALLBACK_LOCATION.longitude);
		const flexMessage = buildWeatherFlexMessage(forecast);

		const client = new messagingApi.MessagingApiClient({ channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN });
		await client.replyMessage({ replyToken: event.replyToken!, messages: [flexMessage] });
	}
}

async function handleLocationMessage(event: webhook.MessageEvent, message: webhook.LocationMessageContent, env: Env): Promise<void> {
	const userId = event.source?.userId;
	if (!userId) {
		return;
	}

	const client = new messagingApi.MessagingApiClient({ channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN });

	const pendingAction = await getPendingAction(env.SMART_HOME_KV, userId);

	// 登録待ちなら通知設定を更新
	if (pendingAction === 'register') {
		await clearPendingAction(env.SMART_HOME_KV, userId);

		const settings = await getUserSettings(env.SMART_HOME_KV, userId);

		await setUserSettings(env.SMART_HOME_KV, userId, {
			...settings,
			notifyLat: message.latitude,
			notifyLon: message.longitude,
		});

		await client.replyMessage({
			replyToken: event.replyToken!,
			messages: [{ type: 'text', text: '通知用の位置情報を登録しました ✅' }],
		});

		return;
	}

	await clearPendingAction(env.SMART_HOME_KV, userId);

	const forecast = await fetchDailyForecast(message.latitude, message.longitude);
	await client.replyMessage({
		replyToken: event.replyToken!,
		messages: [buildWeatherFlexMessage(forecast)],
	});
}
