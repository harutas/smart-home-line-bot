import { handleTurnOff, handleTurnOn } from '@/handlers/postback/bedroom/light';
import type { LinePostbackEvent } from '@/types/line';
import { POSTBACK_ACTION, type PostbackAction, type PostbackData } from '@/types/postback';
import { messagingApi } from '@line/bot-sdk';

export type PostbackContext = {
	replyToken: string;
	lineClient: messagingApi.MessagingApiClient;
	env: Env;
};

type PostbackHandler = (ctx: PostbackContext) => Promise<void>;

const actionMap: Record<PostbackAction, PostbackHandler> = {
	[POSTBACK_ACTION.BEDROOM_LIGHT_TURN_ON]: handleTurnOn,
	[POSTBACK_ACTION.BEDROOM_LIGHT_TURN_OFF]: handleTurnOff,
};

export async function handlePostbackEvent(event: LinePostbackEvent, env: Env): Promise<void> {
	const { action } = JSON.parse(event.postback.data) as PostbackData;

	const handler = actionMap[action];

	if (!handler) {
		console.warn('unknown postback action:', action);
		return;
	}

	const ctx: PostbackContext = {
		replyToken: event.replyToken,
		lineClient: new messagingApi.MessagingApiClient({ channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN }),
		env,
	};

	await handler(ctx);
}
