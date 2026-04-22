import { LinePostbackEvent } from '@/types/line';

export async function handlePostbackEvent(event: LinePostbackEvent, env: Env): Promise<void> {
	console.log('postback:', event.postback.data);
}
