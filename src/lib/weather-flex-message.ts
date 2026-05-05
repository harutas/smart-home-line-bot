import { describeWeather, type DailyForecast, type TimeSlotForecast } from '@/lib/open-meteo';
import type { messagingApi } from '@line/bot-sdk';

function jstDateLabel(): string {
	const parts = new Intl.DateTimeFormat('ja-JP', {
		timeZone: 'Asia/Tokyo',
		month: 'numeric',
		day: 'numeric',
		weekday: 'narrow',
	}).formatToParts(new Date());
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
	return `${get('month')}月${get('day')}日（${get('weekday')}）`;
}

function timeSlotRow(icon: string, label: string, slot: TimeSlotForecast): messagingApi.FlexBox {
	return {
		type: 'box',
		layout: 'horizontal',
		alignItems: 'center',
		paddingTop: 'lg',
		paddingBottom: 'lg',
		paddingStart: 'md',
		paddingEnd: 'md',
		contents: [
			{
				type: 'text',
				text: `${icon} ${label}`,
				size: 'sm',
				color: '#888888',
				flex: 2,
			},
			{
				type: 'text',
				text: describeWeather(slot.weatherCode),
				size: 'sm',
				flex: 5,
				margin: 'md',
				wrap: true,
			},
			{
				type: 'text',
				text: `${slot.temperature}°C`,
				size: 'sm',
				align: 'end',
				color: '#E67E22',
				flex: 2,
			},
			{
				type: 'text',
				text: `🌧️ ${slot.precipitationProbability}%`,
				size: 'sm',
				align: 'end',
				color: '#5DADE2',
				flex: 3,
			},
		],
	};
}

export function buildWeatherFlexMessage(forecast: DailyForecast): messagingApi.FlexMessage {
	return {
		type: 'flex',
		altText: `今日の天気｜最高 ${forecast.maxTemp}°C / 最低 ${forecast.minTemp}°C`,
		contents: {
			type: 'bubble',
			size: 'mega',
			styles: {
				header: { backgroundColor: '#1E3A5F' },
			},
			header: {
				type: 'box',
				layout: 'vertical',
				paddingAll: 'xl',
				contents: [
					{
						type: 'text',
						text: '今日の天気予報',
						color: '#FFFFFF',
						size: 'lg',
						weight: 'bold',
					},
					{
						type: 'text',
						text: jstDateLabel(),
						color: '#B0C4DE',
						size: 'sm',
						margin: 'sm',
					},
				],
			},
			body: {
				type: 'box',
				layout: 'vertical',
				paddingTop: 'none',
				paddingBottom: 'xs',
				paddingStart: 'md',
				paddingEnd: 'md',
				contents: [
					{
						type: 'box',
						layout: 'horizontal',
						paddingTop: 'lg',
						paddingBottom: 'lg',
						paddingStart: 'md',
						paddingEnd: 'md',
						contents: [
							{
								type: 'text',
								text: `最高気温 ${forecast.maxTemp}°C`,
								size: 'sm',
								color: '#E74C3C',
								weight: 'bold',
								align: 'center',
								flex: 1,
							},
							{
								type: 'text',
								text: `最低気温 ${forecast.minTemp}°C`,
								size: 'sm',
								color: '#3498DB',
								weight: 'bold',
								align: 'center',
								flex: 1,
							},
						],
					},
					{ type: 'separator' },
					timeSlotRow('🌅', '朝', forecast.morning),
					{ type: 'separator' },
					timeSlotRow('☀️', '昼', forecast.noon),
					{ type: 'separator' },
					timeSlotRow('🌙', '夜', forecast.evening),
				],
			},
		},
	};
}
