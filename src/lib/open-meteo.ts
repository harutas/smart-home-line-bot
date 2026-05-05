import { fetchWeatherApi } from 'openmeteo';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export type TimeSlotForecast = {
	weatherCode: number;
	temperature: number;
	precipitationProbability: number;
};

export type DailyForecast = {
	maxTemp: number;
	minTemp: number;
	morning: TimeSlotForecast; // 8:00
	noon: TimeSlotForecast; // 12:00
	evening: TimeSlotForecast; // 18:00
};

export async function fetchDailyForecast(latitude: number, longitude: number): Promise<DailyForecast> {
	const responses = await fetchWeatherApi(OPEN_METEO_URL, {
		latitude: [latitude],
		longitude: [longitude],
		daily: 'temperature_2m_max,temperature_2m_min',
		hourly: 'weather_code,temperature_2m,precipitation_probability',
		timezone: 'Asia/Tokyo',
		forecast_days: 1,
	});

	const response = responses[0];

	// daily: 0=temperature_2m_max, 1=temperature_2m_min
	const daily = response.daily()!;
	const maxTemp = Math.round(daily.variables(0)!.valuesArray()![0]);
	const minTemp = Math.round(daily.variables(1)!.valuesArray()![0]);

	// hourly: 0=weather_code, 1=temperature_2m, 2=precipitation_probability
	// timezone=Asia/Tokyo のため index = 時刻（0時=0, 8時=8, ...）
	const hourly = response.hourly()!;
	const weatherCodes = hourly.variables(0)!.valuesArray()!;
	const temperatures = hourly.variables(1)!.valuesArray()!;
	const precipProbs = hourly.variables(2)!.valuesArray()!;

	const slotAt = (hour: number): TimeSlotForecast => ({
		weatherCode: weatherCodes[hour],
		temperature: Math.round(temperatures[hour]),
		precipitationProbability: Math.round(precipProbs[hour]),
	});

	return {
		maxTemp,
		minTemp,
		morning: slotAt(8),
		noon: slotAt(12),
		evening: slotAt(18),
	};
}

// WMO Weather interpretation codes
const WEATHER_LABELS: Record<number, string> = {
	0: '快晴 ☀️',
	1: '晴れ 🌤',
	2: '曇り ⛅',
	3: '曇り ☁️',
	45: '霧 😶‍🌫️',
	48: '霧 😶‍🌫️',
	51: '霧雨 🌂',
	53: '霧雨 🌂',
	55: '霧雨 🌂',
	56: '凍結霧雨 🌨',
	57: '凍結霧雨 🌨',
	61: '雨 ☂️',
	63: '雨 ☂️',
	65: '大雨 ☔️',
	66: '凍雨 🌨',
	67: '凍雨 🌨',
	71: '雪 ❄️',
	73: '雪 🌨',
	75: '大雪 🌨',
	77: '雪粒 ❄️',
	80: 'にわか雨 🌂',
	81: 'にわか雨 ☂️',
	82: 'にわか雨 ☔️',
	85: 'にわか雪 ❄️',
	86: 'にわか雪 🌨',
	95: '雷雨 ⛈️',
	96: '雷雨（ひょう） ⛈️',
	99: '雷雨（ひょう） ⛈️',
};

export function describeWeather(code: number): string {
	return WEATHER_LABELS[code] ?? '不明';
}
