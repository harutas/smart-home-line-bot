import type { PostbackContext } from '@/handlers/postback';
import { turnOff, turnOn } from '@/lib/switchbot';

export async function handleTurnOn({ replyToken, lineClient, env }: PostbackContext): Promise<void> {
	const { SWITCHBOT_TOKEN: token, SWITCHBOT_SECRET: secret, SWITCHBOT_BOT_DEVICE_ID: deviceId } = env;

	await turnOn(token, secret, deviceId);
	await lineClient.replyMessage({ replyToken, messages: [{ type: 'text', text: 'つけたよ💡' }] });
}

export async function handleTurnOff({ replyToken, lineClient, env }: PostbackContext): Promise<void> {
	const { SWITCHBOT_TOKEN: token, SWITCHBOT_SECRET: secret, SWITCHBOT_BOT_DEVICE_ID: deviceId } = env;

	await turnOff(token, secret, deviceId);
	await lineClient.replyMessage({ replyToken, messages: [{ type: 'text', text: '消したよ🌙' }] });
}
