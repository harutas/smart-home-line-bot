import { createHmac } from 'node:crypto';

const SWITCHBOT_API_BASE = 'https://api.switch-bot.com/v1.1';

function generateHeaders(token: string, secret: string): HeadersInit {
	const t = Date.now().toString();
	const nonce = crypto.randomUUID();
	const data = token + t + nonce;
	const sign = createHmac('sha256', secret).update(data).digest('base64');

	return {
		Authorization: token,
		sign,
		nonce,
		t,
		'Content-Type': 'application/json',
	};
}

async function sendCommand(token: string, secret: string, deviceId: string, command: string, parameter = 'default'): Promise<void> {
	try {
		const headers = generateHeaders(token, secret);
		const res = await fetch(`${SWITCHBOT_API_BASE}/devices/${deviceId}/commands`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ command, parameter, commandType: 'command' }),
		});

		if (!res.ok) {
			throw new Error(`status: ${res.status}, body: ${await res.text()}`);
		}
	} catch (err) {
		throw new Error(`SwitchBot sendCommand failed [${command}]: ${err instanceof Error ? err.message : String(err)}`);
	}
}

export async function turnOn(token: string, secret: string, deviceId: string): Promise<void> {
	await sendCommand(token, secret, deviceId, 'turnOn');
}

export async function turnOff(token: string, secret: string, deviceId: string): Promise<void> {
	await sendCommand(token, secret, deviceId, 'turnOff');
}

export const AC_MODE = { AUTO: 1, COOL: 2, DRY: 3, FAN: 4, HEAT: 5 } as const;
export const AC_FAN_SPEED = { AUTO: 1, LOW: 2, MEDIUM: 3, HIGH: 4 } as const;
type AcMode = (typeof AC_MODE)[keyof typeof AC_MODE];
type AcFanSpeed = (typeof AC_FAN_SPEED)[keyof typeof AC_FAN_SPEED];

export async function setAirConditioner(
	token: string,
	secret: string,
	deviceId: string,
	temperature: number,
	mode: AcMode,
	fanSpeed: AcFanSpeed
): Promise<void> {
	// parameter format: {temperature},{mode},{fanSpeed},{powerState}
	await sendCommand(token, secret, deviceId, 'setAll', `${temperature},${mode},${fanSpeed},on`);
}
