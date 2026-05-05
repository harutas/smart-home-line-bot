import { pushMessage } from '@/lib/line-push';
import { fetchDailyForecast } from '@/lib/open-meteo';
import { buildWeatherFlexMessage } from '@/lib/weather-flex-message';

type WeatherConfig = {
	home: {
		latitude: number;
		longitude: number;
	};
};

function parseConfig(encoded: string): WeatherConfig {
	return JSON.parse(atob(encoded)) as WeatherConfig;
}

export async function runWeatherNotification(env: Env): Promise<void> {
	const config = parseConfig(env.WEATHER_CONFIG);
	const forecast = await fetchDailyForecast(config.home.latitude, config.home.longitude);
	const flexMessage = buildWeatherFlexMessage(forecast);

	const pushUsers = env.LINE_PUSH_USER_IDS.split(',').map((id) => id.trim());

	await Promise.all(pushUsers.map((id) => pushMessage(env, id, flexMessage)));
}
