import { handleTurnOff, handleTurnOn } from '@/handlers/postback/bedroom/light';
import {
	handleForecastCheck,
	handleForecastCheckRegistered,
	handleForecastRegisterLocation,
	handleNotifyStop,
	handleNotifyTimeChange,
} from '@/handlers/postback/forecast';
import { handleCool, handleHeat, handleSelectMode, handleSelectTemp, handleStart, handleStop } from '@/handlers/postback/living-room/ac';
import { POSTBACK_ACTION, type PostbackAction, type PostbackData } from '@/types/postback';
import type { webhook } from '@line/bot-sdk';
import { messagingApi } from '@line/bot-sdk';

export type PostbackContext = {
	userId: string;
	replyToken: string;
	lineClient: messagingApi.MessagingApiClient;
	env: Env;
	data: PostbackData;
};

type PostbackHandler = (ctx: PostbackContext) => Promise<void>;

const actionMap: Record<PostbackAction, PostbackHandler> = {
	[POSTBACK_ACTION.BEDROOM_LIGHT_TURN_ON]: handleTurnOn,
	[POSTBACK_ACTION.BEDROOM_LIGHT_TURN_OFF]: handleTurnOff,
	[POSTBACK_ACTION.LIVING_ROOM_AC_COOL]: handleCool,
	[POSTBACK_ACTION.LIVING_ROOM_AC_HEAT]: handleHeat,
	[POSTBACK_ACTION.LIVING_ROOM_AC_STOP]: handleStop,
	[POSTBACK_ACTION.LIVING_ROOM_AC_SELECT_MODE]: handleSelectMode,
	[POSTBACK_ACTION.LIVING_ROOM_AC_SELECT_TEMP]: handleSelectTemp,
	[POSTBACK_ACTION.LIVING_ROOM_AC_START]: handleStart,
	[POSTBACK_ACTION.FORECAST_CHECK]: handleForecastCheck,
	[POSTBACK_ACTION.FORECAST_CHECK_REGISTERED]: handleForecastCheckRegistered,
	[POSTBACK_ACTION.FORECAST_REGISTER_LOCATION]: handleForecastRegisterLocation,
	[POSTBACK_ACTION.FORECAST_NOTIFY_TIME_CHANGE]: handleNotifyTimeChange,
	[POSTBACK_ACTION.FORECAST_NOTIFY_STOP]: handleNotifyStop,
};

export async function handlePostbackEvent(event: webhook.PostbackEvent, env: Env): Promise<void> {
	let data: PostbackData;
	try {
		data = JSON.parse(event.postback.data) as PostbackData;
	} catch {
		// richmenuswitch など JSON でないポストバックは無視
		return;
	}
	const handler = actionMap[data.action];

	if (!handler) {
		console.warn('unknown postback action:', data.action);
		return;
	}

	const ctx: PostbackContext = {
		userId: event.source?.userId ?? '',
		replyToken: event.replyToken!,
		lineClient: new messagingApi.MessagingApiClient({ channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN }),
		env,
		data,
	};

	await handler(ctx);
}
