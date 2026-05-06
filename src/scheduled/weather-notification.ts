import { pushMessage } from '@/lib/line-push';
import { fetchDailyForecast } from '@/lib/open-meteo';
import { getUserSettings } from '@/lib/user-settings';
import { buildWeatherFlexMessage } from '@/lib/weather-flex-message';

export const FALLBACK_LOCATION = {
	latitude: 35.6816858,
	longitude: 139.7466155,
}; // 皇居

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
			const settings = await getUserSettings(env.SMART_HOME_KV, userId);

			// opt-in: notifyHour が明示的に設定されている場合のみ通知（null = 停止, undefined = 未設定）
			if (settings.notifyHour == null) {
				return;
			}

			const targetMinute = settings.notifyMinute ?? 0;
			if (hour !== settings.notifyHour || minute !== targetMinute) {
				return;
			}

			const lat = settings.notifyLat ?? FALLBACK_LOCATION.latitude;
			const lon = settings.notifyLon ?? FALLBACK_LOCATION.longitude;

			const forecast = await fetchDailyForecast(lat, lon);
			await pushMessage(env, userId, buildWeatherFlexMessage(forecast));
		})
	);
}
