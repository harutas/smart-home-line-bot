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

async function sendCommand(token: string, secret: string, deviceId: string, command: string): Promise<void> {
	try {
		const headers = generateHeaders(token, secret);
		const res = await fetch(`${SWITCHBOT_API_BASE}/devices/${deviceId}/commands`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ command, parameter: 'default', commandType: 'command' }),
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
