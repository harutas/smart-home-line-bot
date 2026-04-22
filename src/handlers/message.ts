import type { LineMessageEvent } from '../types/line';

export async function handleMessageEvent(event: LineMessageEvent, env: Env): Promise<void> {
	if (event.message.type !== 'text') {
		return;
	}

	console.log('text message:', event.message.text);
}
