import type { PostbackContext } from '@/handlers/postback';
import { fetchDailyForecast } from '@/lib/open-meteo';
import { clearPendingAction, getUserSettings, setPendingAction, setUserSettings } from '@/lib/user-settings';
import { buildWeatherFlexMessage } from '@/lib/weather-flex-message';
import { POSTBACK_ACTION } from '@/types/postback';
import type { messagingApi } from '@line/bot-sdk';

const NOTIFY_HOURS = [5, 6, 7, 8, 9, 10] as const;

function hourQuickReplyItem(hour: number): messagingApi.QuickReplyItem {
	return {
		type: 'action',
		action: {
			type: 'postback',
			label: `${hour}時`,
			data: JSON.stringify({ action: POSTBACK_ACTION.FORECAST_NOTIFY_TIME_CHANGE, hour }),
			displayText: `${hour}時台`,
		},
	};
}

function minuteQuickReplyItem(hour: number, minute: 0 | 30): messagingApi.QuickReplyItem {
	const label = `${hour}:${String(minute).padStart(2, '0')}`;
	return {
		type: 'action',
		action: {
			type: 'postback',
			label,
			data: JSON.stringify({ action: POSTBACK_ACTION.FORECAST_NOTIFY_TIME_CHANGE, hour, minute }),
			displayText: `${label} に通知`,
		},
	};
}

export async function handleForecastCheck({ userId, replyToken, lineClient, env }: PostbackContext): Promise<void> {
	await setPendingAction(env.SMART_HOME_KV, userId, 'check');

	await lineClient.replyMessage({
		replyToken,
		messages: [
			{
				type: 'text',
				text: 'どこの天気を調べる？',
				quickReply: {
					items: [
						{
							type: 'action',
							action: {
								type: 'postback',
								label: '登録済みの場所',
								data: JSON.stringify({ action: POSTBACK_ACTION.FORECAST_CHECK_REGISTERED }),
								displayText: '登録済みの場所の天気',
							},
						},
						{
							type: 'action',
							action: {
								type: 'location',
								label: '位置情報から',
							},
						},
					],
				},
			},
		],
	});
}

export async function handleForecastCheckRegistered({ userId, replyToken, lineClient, env }: PostbackContext): Promise<void> {
	await clearPendingAction(env.SMART_HOME_KV, userId);
	const settings = await getUserSettings(env.SMART_HOME_KV, userId);

	if (settings.notifyLat == null || settings.notifyLon == null) {
		await lineClient.replyMessage({
			replyToken,
			messages: [{ type: 'text', text: '通知用の位置情報が未登録です。\n「通知地点を登録」から位置情報を登録してください。' }],
		});
		return;
	}

	const forecast = await fetchDailyForecast(settings.notifyLat, settings.notifyLon);
	await lineClient.replyMessage({
		replyToken,
		messages: [buildWeatherFlexMessage(forecast)],
	});
}

export async function handleForecastRegisterLocation({ userId, replyToken, lineClient, env }: PostbackContext): Promise<void> {
	await setPendingAction(env.SMART_HOME_KV, userId, 'register');
	await lineClient.replyMessage({
		replyToken,
		messages: [
			{
				type: 'text',
				text: '通知用の位置情報を送ってください',
				quickReply: {
					items: [{ type: 'action', action: { type: 'location', label: 'マップを開く' } }],
				},
			},
		],
	});
}

export async function handleNotifyTimeChange({ userId, replyToken, lineClient, env, data }: PostbackContext): Promise<void> {
	// 時間未選択なら時間帯を選択させる
	if (data.hour == null) {
		await lineClient.replyMessage({
			replyToken,
			messages: [
				{
					type: 'text',
					text: '時間帯を選んでください',
					quickReply: { items: NOTIFY_HOURS.map(hourQuickReplyItem) },
				},
			],
		});
		return;
	}

	// 時間帯選択済みで、分単位が未選択なら分を選択させる
	if (data.minute == null) {
		await lineClient.replyMessage({
			replyToken,
			messages: [
				{
					type: 'text',
					text: `${data.hour}時の何分に通知しますか？`,
					quickReply: {
						items: [minuteQuickReplyItem(data.hour, 0), minuteQuickReplyItem(data.hour, 30)],
					},
				},
			],
		});
		return;
	}

	// 時間・分の両方が選択済みなら保存して通知
	const settings = await getUserSettings(env.SMART_HOME_KV, userId);
	const minute = data.minute as 0 | 30;
	await setUserSettings(env.SMART_HOME_KV, userId, { ...settings, notifyHour: data.hour, notifyMinute: minute });

	const time = `${data.hour}:${String(minute).padStart(2, '0')}`;
	await lineClient.replyMessage({
		replyToken,
		messages: [{ type: 'text', text: `毎日 ${time} に通知します 🔔` }],
	});
}

export async function handleNotifyStop({ userId, replyToken, lineClient, env }: PostbackContext): Promise<void> {
	const settings = await getUserSettings(env.SMART_HOME_KV, userId);
	await setUserSettings(env.SMART_HOME_KV, userId, { ...settings, notifyHour: null, notifyMinute: undefined });

	await lineClient.replyMessage({
		replyToken,
		messages: [{ type: 'text', text: '通知を停止しました 🔕' }],
	});
}
