import type { PostbackContext } from '@/handlers/postback';
import { AC_FAN_SPEED, AC_MODE, setAirConditioner, turnOff } from '@/lib/switchbot';
import { POSTBACK_ACTION, type AcMode } from '@/types/postback';
import type { messagingApi } from '@line/bot-sdk';

type FlexMessage = messagingApi.FlexMessage;
type FlexBubble = messagingApi.FlexBubble;
type FlexButton = messagingApi.FlexButton;

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
	await lineClient.replyMessage({ replyToken, messages: [{ type: 'text', text: 'エアコンを止めたよ' }] });
}

const MODE_LABEL: Record<AcMode, string> = { cool: '冷房', heat: '暖房' };
const MODE_COLOR: Record<AcMode, string> = { cool: '#66c5fc', heat: '#F87171' };
const MODE_TEMPS: Record<AcMode, number[]> = {
	cool: [24, 25, 26, 27, 28],
	heat: [20, 21, 22, 23, 24],
};
const MODE_TO_AC: Record<AcMode, (typeof AC_MODE)[keyof typeof AC_MODE]> = {
	cool: AC_MODE.COOL,
	heat: AC_MODE.HEAT,
};

function modeButton(mode: AcMode): FlexButton {
	return {
		type: 'button',
		style: 'primary',
		color: MODE_COLOR[mode],
		action: {
			type: 'postback',
			label: MODE_LABEL[mode],
			data: JSON.stringify({ action: POSTBACK_ACTION.LIVING_ROOM_AC_SELECT_TEMP, mode }),
			displayText: MODE_LABEL[mode],
		},
	};
}

function tempQuickReplyItem(mode: AcMode, temperature: number): messagingApi.QuickReplyItem {
	return {
		type: 'action',
		action: {
			type: 'postback',
			label: `${temperature}°C`,
			data: JSON.stringify({ action: POSTBACK_ACTION.LIVING_ROOM_AC_START, mode, temperature }),
			displayText: `${temperature}°C`,
		},
	};
}

export async function handleSelectMode({ replyToken, lineClient }: PostbackContext): Promise<void> {
	const message: FlexMessage = {
		type: 'flex',
		altText: 'モードを選んでね',
		contents: {
			type: 'bubble',
			header: {
				type: 'box',
				layout: 'vertical',
				contents: [{ type: 'text', text: 'モードを選んでね', weight: 'bold' }],
			},
			body: {
				type: 'box',
				layout: 'vertical',
				spacing: 'md',
				paddingTop: 'none',
				contents: (['cool', 'heat'] as AcMode[]).map(modeButton),
			},
		} satisfies FlexBubble,
	};
	await lineClient.replyMessage({ replyToken, messages: [message] });
}

export async function handleSelectTemp({ replyToken, lineClient, data }: PostbackContext): Promise<void> {
	const { mode } = data;
	if (!mode) {
		return;
	}

	await lineClient.replyMessage({
		replyToken,
		messages: [
			{
				type: 'text',
				text: `${MODE_LABEL[mode]}の温度を選んでね`,
				quickReply: {
					items: MODE_TEMPS[mode].map((temperature) => tempQuickReplyItem(mode, temperature)),
				},
			},
		],
	});
}

export async function handleStart({ replyToken, lineClient, env, data }: PostbackContext): Promise<void> {
	const { mode, temperature } = data;
	if (!mode || !temperature) {
		return;
	}

	const { SWITCHBOT_TOKEN: token, SWITCHBOT_SECRET: secret, SWITCHBOT_LIVING_ROOM_AC_DEVICE_ID: deviceId } = env;

	await setAirConditioner(token, secret, deviceId, temperature, MODE_TO_AC[mode], AC_FAN_SPEED.AUTO);
	await lineClient.replyMessage({
		replyToken,
		messages: [{ type: 'text', text: `${MODE_LABEL[mode]} ${temperature}°C でつけたよ` }],
	});
}
