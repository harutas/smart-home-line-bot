import { pushMessage } from '@/lib/line-push';
import { fetchDailyForecast } from '@/lib/open-meteo';
import { getUserSettings } from '@/lib/user-settings';
import { buildWeatherFlexMessage } from '@/lib/weather-flex-message';

function currentJST(): { hour: number; minute: number } {
	const parts = new Intl.DateTimeFormat('ja-JP', {
		timeZone: 'Asia/Tokyo',
		hour: 'numeric',
		minute: 'numeric',
		hour12: false,
	}).formatToParts(new Date());
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');

	return { hour: get('hour'), minute: get('minute') };
}

async function getNotifyUserIds(kv: KVNamespace): Promise<string[]> {
	const userIds: string[] = [];
	let cursor: string | undefined;

	do {
		const result = await kv.list({ prefix: 'user:', cursor });
		for (const key of result.keys) {
			userIds.push(key.name.slice('user:'.length));
		}
		cursor = result.list_complete ? undefined : result.cursor;
	} while (cursor);

	return userIds;
}

export async function runWeatherNotification(env: Env): Promise<void> {
	const { hour, minute } = currentJST();
	const userIds = await getNotifyUserIds(env.SMART_HOME_KV);

	await Promise.all(
		userIds.map(async (userId) => {
			const { notifyLat, notifyLon, notifyHour, notifyMinute = 0 } = await getUserSettings(env.SMART_HOME_KV, userId);

			// 通知時間が登録されていなければ通知しない（null = 停止, undefined = 未設定）
			if (notifyHour == null) {
				return;
			}

			// 指定時間でなければ通知しない
			if (hour !== notifyHour || minute !== notifyMinute) {
				return;
			}

			// 位置情報が登録されていなければ通知しない
			if (notifyLat == null || notifyLon == null) {
				return;
			}

			const forecast = await fetchDailyForecast(notifyLat, notifyLon);
			await pushMessage(env, userId, buildWeatherFlexMessage(forecast));
		})
	);
}
