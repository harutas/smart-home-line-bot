import { turnOff, turnOn } from '@/lib/switchbot';
import type { LinePostbackEvent } from '@/types/line';
import { POSTBACK_ACTION, type PostbackData } from '@/types/postback';

export async function handlePostbackEvent(event: LinePostbackEvent, env: Env): Promise<void> {
	const { action } = JSON.parse(event.postback.data) as PostbackData;

	const { SWITCHBOT_TOKEN: token, SWITCHBOT_SECRET: secret, SWITCHBOT_BOT_DEVICE_ID: deviceId } = env;

	switch (action) {
		case POSTBACK_ACTION.TURN_ON:
			await turnOn(token, secret, deviceId);
			break;
		case POSTBACK_ACTION.TURN_OFF:
			await turnOff(token, secret, deviceId);
			break;
		default:
			console.warn('unknown postback action:', action);
	}
}
