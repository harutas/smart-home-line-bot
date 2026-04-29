import type { PostbackContext } from '@/handlers/postback';
import { AC_FAN_SPEED, AC_MODE, setAirConditioner, turnOff } from '@/lib/switchbot';

export async function handleCool({ replyToken, lineClient, env }: PostbackContext): Promise<void> {
	const { SWITCHBOT_TOKEN: token, SWITCHBOT_SECRET: secret, SWITCHBOT_LIVING_ROOM_AC_DEVICE_ID: deviceId } = env;

	await setAirConditioner(token, secret, deviceId, 26, AC_MODE.COOL, AC_FAN_SPEED.AUTO);
	await lineClient.replyMessage({ replyToken, messages: [{ type: 'text', text: '冷房つけたよ❄️' }] });
}

export async function handleHeat({ replyToken, lineClient, env }: PostbackContext): Promise<void> {
	const { SWITCHBOT_TOKEN: token, SWITCHBOT_SECRET: secret, SWITCHBOT_LIVING_ROOM_AC_DEVICE_ID: deviceId } = env;

	await setAirConditioner(token, secret, deviceId, 24, AC_MODE.HEAT, AC_FAN_SPEED.AUTO);
	await lineClient.replyMessage({ replyToken, messages: [{ type: 'text', text: '暖房つけたよ🔥' }] });
}

export async function handleStop({ replyToken, lineClient, env }: PostbackContext): Promise<void> {
	const { SWITCHBOT_TOKEN: token, SWITCHBOT_SECRET: secret, SWITCHBOT_LIVING_ROOM_AC_DEVICE_ID: deviceId } = env;

	await turnOff(token, secret, deviceId);
	await lineClient.replyMessage({ replyToken, messages: [{ type: 'text', text: 'エアコン消したよ' }] });
}
